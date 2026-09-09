from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any
from urllib.parse import urlparse

from intelligence.provenance import stamp


def _domain(value: str | None) -> str:
    raw = (value or '').strip().lower()
    if not raw:
        return ''
    if '://' in raw:
        raw = urlparse(raw).netloc.lower()
    return raw[4:] if raw.startswith('www.') else raw


def _citations_from_observation(row: dict[str, Any]) -> list[dict[str, Any]]:
    citations = []
    for item in row.get('citations') or []:
        if isinstance(item, str):
            citations.append({'url': item, 'domain': _domain(item), 'cited': True})
            continue
        if not isinstance(item, dict):
            continue
        url = item.get('url') or item.get('source_url') or ''
        domain = _domain(item.get('domain') or item.get('source_domain') or url)
        citations.append({'url': url, 'domain': domain, 'cited': bool(item.get('cited', True)), 'entity': item.get('entity')})
    if not citations and (row.get('source_url') or row.get('source_domain')):
        citations.append({
            'url': row.get('source_url') or '',
            'domain': _domain(row.get('source_domain') or row.get('source_url')),
            'cited': bool(row.get('cited', False)),
        })
    return citations


def build_citation_intelligence(observations: list[dict[str, Any]], *, target_domain: str | None = None) -> dict[str, Any]:
    rows = observations or []
    if not rows:
        return stamp({
            'domain': _domain(target_domain),
            'citation_rate': None,
            'citation_frequency': None,
            'top_sources': [],
            'source_domains': [],
            'source_urls': [],
            'brand_mentions': [],
            'entity_mentions': [],
            'notes': ['No AI-search observations were supplied. Citation rate is unknown, not zero.'],
        }, 'citation_intelligence', evidence_type='inferred', confidence=None)
    target = _domain(target_domain)
    by_query = defaultdict(list)
    domains: Counter[str] = Counter()
    urls: Counter[str] = Counter()
    brands: Counter[str] = Counter()
    entities: Counter[str] = Counter()
    cited_for_target = 0
    queries_with_target = set()
    for row in rows:
        query = str(row.get('query') or '')
        by_query[query].append(row)
        for citation in _citations_from_observation(row):
            if citation['domain']:
                domains[citation['domain']] += 1
            if citation['url']:
                urls[citation['url']] += 1
            if target and citation['domain'] == target and citation['cited']:
                cited_for_target += 1
                queries_with_target.add(query)
        for mention in row.get('brand_mentions') or []:
            brands[str(mention)] += 1
        if row.get('brand'):
            brands[str(row['brand'])] += 1
        for ent in row.get('entities') or []:
            name = ent if isinstance(ent, str) else ent.get('name')
            if name:
                entities[str(name)] += 1
    query_count = len([q for q in by_query if q])
    citation_rate = round(len(queries_with_target) / query_count, 4) if target and query_count else None
    payload = {
        'domain': target,
        'citation_rate': citation_rate,
        'citation_frequency': cited_for_target if target else sum(domains.values()),
        'top_sources': [{'domain': domain, 'count': count} for domain, count in domains.most_common(20)],
        'source_domains': [domain for domain, _ in domains.most_common()],
        'source_urls': [url for url, _ in urls.most_common(50)],
        'brand_mentions': [{'name': name, 'count': count} for name, count in brands.most_common(20)],
        'entity_mentions': [{'name': name, 'count': count} for name, count in entities.most_common(20)],
        'query_count': query_count,
        'observation_count': len(rows),
        'notes': ['Rates are computed only from supplied observations.'],
    }
    return stamp(payload, 'citation_intelligence', evidence_type='inferred')
