from __future__ import annotations
from collections import defaultdict
from typing import Any


def _domain(value: str | None) -> str:
    return (value or '').lower().replace('https://','').replace('http://','').split('/')[0].removeprefix('www.')


def keyword_gap_analysis(rows: list[dict[str, Any]], target_domain: str) -> dict[str, Any]:
    target = _domain(target_domain)
    by_query: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for r in rows:
        q = str(r.get('query') or '').strip().lower()
        d = _domain(r.get('domain') or r.get('url') or '')
        if not q or not d:
            continue
        pos = r.get('position')
        try:
            pos = float(pos) if pos is not None else None
        except (TypeError, ValueError):
            pos = None
        prev = by_query[q].get(d)
        if prev is None or (pos is not None and (prev.get('position') is None or pos < prev['position'])):
            by_query[q][d] = dict(r, position=pos)

    gaps=[]; shared=[]; wins=[]
    for q, domains in by_query.items():
        competitors = [(d, row) for d, row in domains.items() if d != target]
        target_row = domains.get(target)
        strong_competitors = [d for d, row in competitors if row.get('position') is not None and row['position'] <= 20]
        if not strong_competitors:
            continue
        if target_row is None:
            gaps.append({'query': q, 'competitor_domains': strong_competitors[:10], 'best_competitor_position': min(domains[d]['position'] for d in strong_competitors if domains[d].get('position') is not None)})
        elif target_row.get('position') is not None:
            best_comp = min(domains[d]['position'] for d in strong_competitors if domains[d].get('position') is not None)
            if best_comp + 3 < target_row['position']:
                shared.append({'query': q, 'target_position': target_row['position'], 'best_competitor_position': best_comp, 'competitor_domains': strong_competitors[:10]})
            elif target_row['position'] <= 10 and best_comp > target_row['position'] + 3:
                wins.append({'query': q, 'target_position': target_row['position'], 'best_competitor_position': best_comp, 'competitor_domains': strong_competitors[:10]})
    return {
        'target_domain': target,
        'true_content_gaps': sorted(gaps, key=lambda x: (x['best_competitor_position'], x['query']))[:100],
        'ranking_gaps': sorted(shared, key=lambda x: (x['target_position'] - x['best_competitor_position']), reverse=True)[:100],
        'competitive_wins': wins[:100],
        'gap_count': len(gaps),
        'ranking_gap_count': len(shared),
    }


def paid_organic_overlap(organic_rows: list[dict[str, Any]], paid_rows: list[dict[str, Any]], target_domain: str) -> dict[str, Any]:
    target = _domain(target_domain)
    organic_q = defaultdict(set)
    for r in organic_rows:
        q = str(r.get('query') or '').strip().lower()
        if q and _domain(r.get('domain') or r.get('url')) == target:
            organic_q[q].add(r.get('page') or r.get('url') or '')
    paid_q = defaultdict(list)
    for r in paid_rows:
        q = str(r.get('query') or r.get('search_term') or r.get('keyword') or '').strip().lower()
        if q:
            paid_q[q].append(r)
    overlap=[]
    for q in sorted(set(organic_q) & set(paid_q)):
        overlap.append({'query': q, 'organic_pages': sorted(organic_q[q]), 'paid_rows': paid_q[q][:5]})
    paid_only = sorted(set(paid_q) - set(organic_q))
    organic_only = sorted(set(organic_q) - set(paid_q))
    return {'overlap': overlap, 'paid_only_queries': paid_only[:200], 'organic_only_queries': organic_only[:200], 'overlap_count': len(overlap)}
