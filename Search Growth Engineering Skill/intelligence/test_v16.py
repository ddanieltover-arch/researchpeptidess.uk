import json
from pathlib import Path

from .memory import GrowthMemory
from .monitor import run_monitor


def test_monitor_no_baseline_is_ok(tmp_path):
    site = tmp_path / 'site'
    site.mkdir()
    (site / 'index.html').write_text('<html><head><title>Home</title><meta name="description" content="Home"></head><body><h1>Home</h1></body></html>')
    cfg = tmp_path / 'monitor.json'
    cfg.write_text(json.dumps({'crawl_targets':[{'url': site.as_uri(), 'max_pages': 5}], 'snapshot_label':'first'}))
    out = run_monitor(cfg, tmp_path / '.sge')
    assert out['status'] == 'ok'
    assert out['snapshot'] is not None


def test_monitor_alerts_on_metric_regression(tmp_path):
    root = tmp_path / '.sge'
    m = GrowthMemory(root)
    m.snapshot({'organic_clicks': 100, 'technical_errors': 1}, label='baseline')
    metrics = tmp_path / 'metrics.json'
    metrics.write_text(json.dumps({'organic_clicks': 70, 'technical_errors': 4}))
    site = tmp_path / 'site'; site.mkdir()
    (site / 'index.html').write_text('<html><head><title>Home</title></head><body><h1>Home</h1></body></html>')
    cfg = tmp_path / 'monitor.json'
    cfg.write_text(json.dumps({'crawl_targets':[{'url':site.as_uri(), 'max_pages':5}], 'metrics_file':str(metrics)}))
    out = run_monitor(cfg, root)
    assert out['status'] == 'alert'
    assert len(out['alerts']) >= 2
    assert (root / 'alerts-latest.json').exists()


def test_monitor_dry_run_does_not_snapshot(tmp_path):
    site = tmp_path / 'site'; site.mkdir()
    (site / 'index.html').write_text('<html><head><title>Home</title></head><body><h1>Home</h1></body></html>')
    cfg = tmp_path / 'monitor.json'
    cfg.write_text(json.dumps({'crawl_targets':[{'url':site.as_uri(), 'max_pages':5}]}))
    root = tmp_path / '.sge'
    out = run_monitor(cfg, root, dry_run=True)
    assert out['dry_run'] is True
    assert not (root / 'growth-memory.json').exists()
