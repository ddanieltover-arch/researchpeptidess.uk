from __future__ import annotations
from typing import Any
from collections import defaultdict


def _value(row: dict[str, Any], key: str) -> float:
    try:
        return float(row.get(key) or 0)
    except (TypeError, ValueError):
        return 0.0


def detect_content_decay(current_rows: list[dict[str, Any]], previous_rows: list[dict[str, Any]], drop_threshold: float = 0.25) -> list[dict[str, Any]]:
    current = {r.get('page') or r.get('url'): r for r in current_rows if r.get('page') or r.get('url')}
    previous = {r.get('page') or r.get('url'): r for r in previous_rows if r.get('page') or r.get('url')}
    findings = []
    for page, cur in current.items():
        prev = previous.get(page)
        if not prev:
            continue
        metrics = {}
        for key in ('clicks','impressions','sessions','conversions','revenue','ctr'):
            if key in cur or key in prev:
                old = _value(prev, key); new = _value(cur, key)
                delta = (new - old) / old if old else (1.0 if new else 0.0)
                metrics[key] = round(delta, 4)
        severe = {k:v for k,v in metrics.items() if v <= -abs(drop_threshold)}
        if severe:
            findings.append({
                'page': page,
                'metrics': severe,
                'type': 'content-decay',
                'severity': 'high' if any(v <= -0.4 for v in severe.values()) else 'medium',
                'recommended_action': 'refresh, consolidate, or re-position the page after checking intent, competitors, freshness and technical regressions',
            })
    return sorted(findings, key=lambda x: min(x['metrics'].values()))
