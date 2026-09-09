from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from intelligence.provenance import stamp


FEATURE_KEYS = {
    'featured_snippets': ('featured_snippet', 'answer_box', 'featured_snippets'),
    'people_also_ask': ('people_also_ask', 'related_questions', 'paa'),
    'video_packs': ('video_results', 'videos', 'video_pack'),
    'image_packs': ('images', 'image_results', 'image_pack'),
    'local_packs': ('local_results', 'local_pack', 'places', 'map_results'),
    'shopping_results': ('shopping', 'shopping_results', 'product_results'),
    'ai_overviews': ('ai_overview', 'ai_overviews', 'generative_overview'),
    'ai_mode': ('ai_mode', 'ai_mode_results', 'google_ai_mode'),
}


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _organic(payload: dict[str, Any] | list[Any]) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload[:100]
    if not isinstance(payload, dict):
        return []
    for key in ('organic_results', 'organic', 'results', 'items'):
        if isinstance(payload.get(key), list):
            return payload[key][:100]
    if isinstance(payload.get('data'), dict):
        return _organic(payload['data'])
    return []


def _domain(url: str) -> str:
    if not url:
        return ''
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith('www.') else host


def normalize_live_serp(
    payload: Any,
    *,
    query: str,
    location: str | None = None,
    device: str | None = None,
    date: str | None = None,
    source: str = 'serp-api',
    collected_at: str | None = None,
) -> dict[str, Any]:
    raw = payload
    if isinstance(payload, dict) and 'data' in payload and isinstance(payload['data'], (dict, list)):
        raw = payload['data']
        if isinstance(raw, dict) and 'raw' in raw:
            raw = raw['raw']
    organic = _organic(raw if not isinstance(raw, dict) else raw)
    results = []
    for idx, row in enumerate(organic[:100], 1):
        if not isinstance(row, dict):
            continue
        url = row.get('link') or row.get('url') or row.get('target') or ''
        results.append({
            'position': row.get('position', idx),
            'title': row.get('title') or row.get('name') or '',
            'url': url,
            'domain': _domain(url),
            'snippet': row.get('snippet') or row.get('description') or '',
        })
    features: dict[str, list[Any]] = {}
    blob = raw if isinstance(raw, dict) else {}
    for feature, keys in FEATURE_KEYS.items():
        values: list[Any] = []
        for key in keys:
            values.extend(_as_list(blob.get(key)))
        features[feature] = values
    observed_date = date or (collected_at or datetime.now(timezone.utc).date().isoformat())
    collected = collected_at or datetime.now(timezone.utc).isoformat()
    return stamp({
        'query': query,
        'location': location or '',
        'device': device or '',
        'date': observed_date[:10],
        'collected_at': collected,
        'source': source,
        'results': results,
        'features': features,
        'feature_presence': {name: bool(items) for name, items in features.items()},
        'result_count': len(results),
        'notes': [
            'Observed provider payload only.',
            'Missing features are absent, not zero-ranked.',
        ],
    }, source, evidence_type='observed', confidence=1.0, collected_at=collected)
