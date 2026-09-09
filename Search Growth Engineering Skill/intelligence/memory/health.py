from __future__ import annotations
from typing import Any


def summarize_health(compare: dict[str, Any], thresholds: dict[str, float] | None = None) -> dict[str, Any]:
    thresholds = thresholds or {
        'organic_clicks_percent': -10.0,
        'organic_conversions_percent': -10.0,
        'error_count_absolute': 10.0,
    }
    alerts = []
    for item in compare.get('changes', []):
        metric = item['metric']; pct = item.get('percent_change'); delta = item.get('delta')
        if pct is not None and 'click' in metric.lower() and pct <= thresholds['organic_clicks_percent']:
            alerts.append({'severity': 'high', 'metric': metric, 'reason': 'organic clicks decline', 'percent_change': pct})
        elif pct is not None and 'conversion' in metric.lower() and pct <= thresholds['organic_conversions_percent']:
            alerts.append({'severity': 'high', 'metric': metric, 'reason': 'organic conversions decline', 'percent_change': pct})
        elif isinstance(delta, (int, float)) and 'error' in metric.lower() and delta >= thresholds['error_count_absolute']:
            alerts.append({'severity': 'medium', 'metric': metric, 'reason': 'technical error increase', 'delta': delta})
    status = 'alert' if alerts else 'stable'
    return {'status': status, 'alerts': alerts, 'change_count': len(compare.get('changes', [])), 'baseline_id': compare.get('baseline_id')}
