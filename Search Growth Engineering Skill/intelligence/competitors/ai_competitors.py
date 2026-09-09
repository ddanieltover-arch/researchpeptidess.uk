from __future__ import annotations
from collections import Counter, defaultdict
from typing import Any
from .market_map import normalize_domain


def ai_source_competitor_analysis(observations: list[dict[str, Any]], target_domain: str) -> dict[str, Any]:
    target = normalize_domain(target_domain)
    by_query: dict[str, list[dict[str, Any]]] = defaultdict(list)
    domain_counts: Counter[str] = Counter()
    for r in observations:
        if not r.get('cited'):
            continue
        q = str(r.get('query') or '').strip()
        d = normalize_domain(r.get('source_domain') or r.get('source_url'))
        if not q or not d:
            continue
        by_query[q].append(r)
        domain_counts[d] += 1
    competitors=[]
    query_gaps=[]
    for q, rows in by_query.items():
        sources={normalize_domain(r.get('source_domain') or r.get('source_url')) for r in rows}
        sources.discard('')
        if target not in sources:
            query_gaps.append({'query': q, 'source_domains': sorted(sources)[:10], 'observation_count': len(rows)})
        for d in sources:
            if d != target:
                competitors.append({'domain': d, 'query': q})
    distinct = Counter(x['domain'] for x in competitors)
    return {
        'target_domain': target,
        'top_ai_source_competitors': [{'domain': d, 'citation_queries': c} for d,c in distinct.most_common(50)],
        'query_source_gaps': sorted(query_gaps, key=lambda x: x['query'])[:200],
        'target_citation_count': domain_counts.get(target, 0),
    }
