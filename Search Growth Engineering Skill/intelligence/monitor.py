from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json
import os
import urllib.request
import urllib.error

from .crawl.site import crawl_site
from .audit.technical import audit_crawl
from .memory import GrowthMemory, summarize_health


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Alert:
    severity: str
    category: str
    metric: str
    message: str
    observed_at: str
    evidence: dict[str, Any]


class AlertSink:
    def send(self, alerts: list[dict[str, Any]]) -> dict[str, Any]:
        raise NotImplementedError


class FileAlertSink(AlertSink):
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def send(self, alerts: list[dict[str, Any]]) -> dict[str, Any]:
        payload = {
            'created_at': now_iso(),
            'count': len(alerts),
            'alerts': alerts,
        }
        self.path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding='utf-8')
        return {'sink': 'file', 'path': str(self.path), 'count': len(alerts)}


class WebhookAlertSink(AlertSink):
    def __init__(self, url: str, timeout: int = 10):
        self.url = url
        self.timeout = timeout

    def send(self, alerts: list[dict[str, Any]]) -> dict[str, Any]:
        body = json.dumps({'created_at': now_iso(), 'count': len(alerts), 'alerts': alerts}).encode('utf-8')
        req = urllib.request.Request(self.url, data=body, headers={'Content-Type': 'application/json'}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return {'sink': 'webhook', 'url': self.url, 'status': getattr(resp, 'status', 200), 'count': len(alerts)}
        except urllib.error.URLError as exc:
            return {'sink': 'webhook', 'url': self.url, 'status': 'error', 'error': str(exc), 'count': len(alerts)}


def _metric_health_alerts(compare: dict[str, Any], thresholds: dict[str, Any] | None = None) -> list[Alert]:
    alerts: list[Alert] = []
    observed = now_iso()
    thresholds = thresholds or {}
    perf_drop = float(thresholds.get('performance_drop_pct', -20))
    ctr_drop = float(thresholds.get('ctr_drop_pct', -15))
    error_rise = float(thresholds.get('technical_error_rise_pct', 50))
    for row in compare.get('changes', []):
        metric = row.get('metric')
        pct = row.get('percent_change')
        delta = row.get('delta')
        if not isinstance(pct, (int, float)):
            continue
        if metric in {'organic_clicks', 'organic_sessions', 'organic_conversions', 'revenue'} and pct <= perf_drop:
            alerts.append(Alert('high', 'performance', metric, f'{metric} declined {pct:.1f}% versus baseline.', observed, row))
        elif metric == 'technical_errors' and pct >= error_rise:
            alerts.append(Alert('high', 'technical', metric, f'{metric} increased {pct:.1f}% versus baseline.', observed, row))
        elif metric in {'organic_ctr'} and pct <= ctr_drop:
            alerts.append(Alert('medium', 'search-performance', metric, f'{metric} declined {pct:.1f}% versus baseline.', observed, row))
    return alerts


def run_monitor(config_path: str | Path, root: str | Path = '.search-growth-engine', *, dry_run: bool = False) -> dict[str, Any]:
    config = json.loads(Path(config_path).read_text(encoding='utf-8'))
    root_path = Path(root)
    root_path.mkdir(parents=True, exist_ok=True)
    memory = GrowthMemory(root_path)
    sources: list[dict[str, Any]] = []
    metrics: dict[str, Any] = {}
    observations: list[dict[str, Any]] = []

    for target in config.get('crawl_targets', []):
        url = target['url']
        crawl = crawl_site(url, int(target.get('max_pages', 50)), float(target.get('delay', 0.15)))
        audit = audit_crawl(crawl)
        pages = crawl.get('pages', [])
        error_count = sum(1 for p in pages if int(p.get('status', 0) or 0) >= 400)
        metadata_missing = sum(1 for p in pages if not p.get('title') or not p.get('meta_description'))
        metrics.update({
            'crawl_pages': len(pages),
            'technical_errors': error_count,
            'metadata_missing': metadata_missing,
            'audit_findings': len(audit.get('findings', [])),
        })
        sources.append({'source': 'crawl', 'url': url, 'pages': len(pages), 'errors': error_count})
        observations.append({'type': 'crawl', 'url': url, 'crawl': crawl, 'audit': audit})

    if 'metrics_file' in config:
        mf = Path(config['metrics_file'])
        if mf.exists():
            external = json.loads(mf.read_text(encoding='utf-8'))
            metrics.update(external.get('metrics', external if isinstance(external, dict) else {}))
            sources.append({'source': 'metrics_file', 'path': str(mf)})

    baseline_result = memory.changes_since(metrics, config.get('baseline_id'))
    health = summarize_health(baseline_result)
    alerts = _metric_health_alerts(baseline_result, config.get('alert_thresholds'))
    for row in health.get('alerts', []):
        if not any(a.metric == row.get('metric') for a in alerts):
            alerts.append(Alert(row.get('severity', 'high'), 'health', row.get('metric','unknown'), row.get('message','Health alert'), now_iso(), row))

    if not dry_run:
        snapshot = memory.snapshot(metrics, label=config.get('snapshot_label', 'monitoring'), source='monitor')
        run = memory.record_run('monitor', 'alert' if alerts else 'ok', {
            'sources': sources,
            'metrics': metrics,
            'health': health,
            'alerts': [asdict(a) for a in alerts],
        })
    else:
        snapshot = None
        run = {'dry_run': True}

    sinks = []
    alert_payload = [asdict(a) for a in alerts]
    if alert_payload and not dry_run:
        sinks.append(FileAlertSink(root_path / 'alerts-latest.json').send(alert_payload))
        webhook = config.get('alert_webhook') or os.getenv('SGE_ALERT_WEBHOOK')
        if webhook:
            sinks.append(WebhookAlertSink(webhook).send(alert_payload))

    strategy_input = {'crawl': {'pages': [p for obs in observations for p in (obs.get('audit') and [] or [])]}}
    # Preserve full crawl/audit evidence in strategy context without forcing external connectors.
    if observations:
        strategy_input = {'crawl': next((obs.get('crawl') for obs in observations if obs.get('crawl')), None),
                          'audit': next((obs.get('audit') for obs in observations if obs.get('audit')), {}),
                          'keyword_clusters': [], 'cannibalization': [], 'serp_analysis': {}}

    return {
        'version': '1.6.0',
        'status': 'alert' if alerts else 'ok',
        'dry_run': dry_run,
        'observed_at': now_iso(),
        'sources': sources,
        'metrics': metrics,
        'baseline': baseline_result,
        'health': health,
        'alerts': alert_payload,
        'alert_sinks': sinks,
        'snapshot': snapshot,
        'run': run,
        'observations': observations,
        'strategy_input': strategy_input,
    }
