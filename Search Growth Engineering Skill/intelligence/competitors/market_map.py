from __future__ import annotations
from collections import Counter, defaultdict
from urllib.parse import urlparse
from typing import Any


def normalize_domain(value: str | None) -> str:
    raw = (value or '').strip().lower()
    if not raw:
        return ''
    if '://' not in raw:
        raw = 'https://' + raw
    host = urlparse(raw).netloc.lower().split(':')[0]
    if host.startswith('www.'):
        host = host[4:]
    return host


def _is_target(domain: str, target: str) -> bool:
    return bool(domain and target and (domain == target or domain.endswith('.' + target)))


def build_market_map(
    serp_rows: list[dict[str, Any]] | None = None,
    target_domain: str | None = None,
    ai_observations: list[dict[str, Any]] | None = None,
    paid_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    serp_rows = serp_rows or []
    ai_observations = ai_observations or []
    paid_rows = paid_rows or []
    target = normalize_domain(target_domain)

    serp_by_domain: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in serp_rows:
        url = row.get('url') or row.get('link') or ''
        domain = normalize_domain(row.get('domain') or url)
        if not domain:
            continue
        serp_by_domain[domain].append({
            'query': row.get('query'),
            'position': row.get('position'),
            'url': url,
            'title': row.get('title') or '',
            'features': row.get('features') or row.get('serp_features') or [],
        })

    ai_by_domain: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in ai_observations:
        if not row.get('cited'):
            continue
        domain = normalize_domain(row.get('source_domain') or row.get('source_url'))
        if domain:
            ai_by_domain[domain].append(row)

    paid_by_domain: Counter[str] = Counter()
    for row in paid_rows:
        domain = normalize_domain(row.get('domain') or row.get('final_url') or row.get('url'))
        if domain:
            paid_by_domain[domain] += 1

    domains = set(serp_by_domain) | set(ai_by_domain) | set(paid_by_domain)
    competitors = []
    for domain in domains:
        if _is_target(domain, target):
            continue
        serp_entries = serp_by_domain.get(domain, [])
        positions = [r['position'] for r in serp_entries if isinstance(r.get('position'), (int, float))]
        ai_entries = ai_by_domain.get(domain, [])
        queries = {r.get('query') for r in serp_entries if r.get('query')} | {r.get('query') for r in ai_entries if r.get('query')}
        features = Counter()
        for r in serp_entries:
            for f in r.get('features') or []:
                features[str(f)] += 1
        competitors.append({
            'domain': domain,
            'organic_serp_occurrences': len(serp_entries),
            'queries_seen': len(queries),
            'top_3_count': sum(1 for p in positions if p <= 3),
            'top_10_count': sum(1 for p in positions if p <= 10),
            'avg_position': round(sum(positions) / len(positions), 2) if positions else None,
            'ai_citations': len(ai_entries),
            'paid_result_occurrences': paid_by_domain.get(domain, 0),
            'serp_features': features.most_common(10),
        })

    competitors.sort(key=lambda x: (
        x['organic_serp_occurrences'],
        x['ai_citations'],
        x['paid_result_occurrences'],
    ), reverse=True)

    target_serp = serp_by_domain.get(target, [])
    target_ai = ai_by_domain.get(target, [])
    target_positions = [r['position'] for r in target_serp if isinstance(r.get('position'), (int, float))]

    return {
        'target_domain': target,
        'target_presence': {
            'organic_serp_occurrences': len(target_serp),
            'top_3_count': sum(1 for p in target_positions if p <= 3),
            'top_10_count': sum(1 for p in target_positions if p <= 10),
            'ai_citations': len(target_ai),
        },
        'competitors': competitors[:50],
        'competitor_count': len(competitors),
        'market_domains': [c['domain'] for c in competitors[:20]],
    }
