from __future__ import annotations
from collections import defaultdict
from typing import Any

from .scoring.priority import score_finding, rank_findings
from .competitors.market_map import build_market_map
from .competitors.gaps import keyword_gap_analysis
from .competitors.ai_competitors import ai_source_competitor_analysis
from .content.strategy import build_content_strategy


INTENT_PAGE_TYPES = {
    'transactional': 'commercial landing page',
    'commercial-investigation': 'comparison/buyer guide',
    'informational': 'informational resource',
    'navigational': 'brand/product page',
    'mixed-or-unclear': 'intent validation page',
}


def _norm_url(url: str | None) -> str:
    return (url or '').rstrip('/')


def _words(text: str) -> set[str]:
    return {x.lower() for x in str(text or '').split() if x}


def build_url_inventory(crawl: dict[str, Any] | None) -> list[dict[str, Any]]:
    rows = (crawl or {}).get('pages') or (crawl or {}).get('results') or []
    inventory = []
    for row in rows:
        url = row.get('url') or row.get('final_url')
        if not url:
            continue
        inventory.append({
            'url': url,
            'status': row.get('status') or row.get('status_code'),
            'title': row.get('title') or '',
            'h1': row.get('h1') or row.get('h1_count') or 0,
            'word_count': row.get('word_count') or row.get('text_words') or 0,
        })
    return inventory


def map_keywords_to_urls(clusters: list[dict[str, Any]], urls: list[dict[str, Any]]) -> list[dict[str, Any]]:
    mappings = []
    for cluster in clusters:
        terms = _words(cluster.get('keywords', [])) if isinstance(cluster.get('keywords'), list) else _words(cluster.get('representative', ''))
        best = []
        for page in urls:
            corpus = _words(' '.join([page.get('title',''), page.get('url','')]))
            overlap = len(terms & corpus) / max(1, len(terms))
            if overlap > 0:
                best.append((overlap, page['url']))
        best.sort(reverse=True)
        mappings.append({
            'cluster_id': cluster.get('cluster_id'),
            'representative': cluster.get('representative'),
            'intent': cluster.get('intent'),
            'recommended_page_type': INTENT_PAGE_TYPES.get(cluster.get('intent'), 'search landing page'),
            'best_existing_urls': [u for _, u in best[:5]],
            'coverage_score': round(best[0][0], 3) if best else 0.0,
            'needs_new_or_reworked_page': not bool(best) or best[0][0] < 0.35,
        })
    return mappings


def discover_content_gaps(clusters: list[dict[str, Any]], urls: list[dict[str, Any]], cannibalization: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    mappings = map_keywords_to_urls(clusters, urls)
    cannibal_queries = {x.get('query') for x in (cannibalization or [])}
    gaps = []
    for m in mappings:
        if m['needs_new_or_reworked_page']:
            intent = m['intent']
            impact = 0.8 if intent in {'transactional','commercial-investigation'} else 0.65
            business = 0.9 if intent in {'transactional','commercial-investigation'} else 0.55
            if any(q and q == m['representative'] for q in cannibal_queries):
                business *= 0.9
            gaps.append({
                'type': 'content-gap',
                'title': f"Create or materially improve a {m['recommended_page_type']}: {m['representative']}",
                'cluster_id': m['cluster_id'],
                'representative_query': m['representative'],
                'intent': intent,
                'recommended_page_type': m['recommended_page_type'],
                'impact': impact,
                'business_value': business,
                'confidence': 0.72,
                'effort': 0.55,
                'urgency': 0.65,
                'evidence': 'No sufficiently matching existing URL was found from current crawl inventory.',
            })
    return gaps


SEARCH_DATA_KEYS = ('keyword_clusters', 'keyword_rows', 'keywords', 'serp_rows', 'gsc', 'search_analytics')
TECHNICAL_BLOCKERS = {'NOINDEX_ENTRY', 'CRAWL_STATUS'}
KNOWN_TECHNICAL = {'CRAWLABLE_DOCUMENT'}


def search_data_status(evidence: dict[str, Any]) -> str:
    if any(evidence.get(key) for key in SEARCH_DATA_KEYS):
        return 'available'
    analysis = evidence.get('serp_analysis') or {}
    if analysis.get('domain_frequency'):
        return 'available'
    return 'insufficient'


def _required_data_opportunities(evidence: dict[str, Any]) -> list[dict[str, Any]]:
    missing = []
    if not (evidence.get('gsc') or evidence.get('search_analytics')):
        missing.append(('gsc', 'Connect Google Search Console', 'Query, page, country and index coverage are unknown.'))
    if not evidence.get('ga4') and not evidence.get('analytics'):
        missing.append(('ga4', 'Connect Google Analytics 4', 'Landing-page and conversion evidence is unknown.'))
    if not evidence.get('serp_rows'):
        missing.append(('serpapi', 'Connect an authorized SERP provider', 'Live rankings and SERP competitors were not collected.'))
    rows = []
    for connector, title, why in missing:
        rows.append({
            'type': 'required-data',
            'title': title,
            'connector': connector,
            'impact': 0.88,
            'business_value': 0.92,
            'confidence': 0.95,
            'effort': 0.3,
            'urgency': 0.8,
            'evidence': why,
        })
    return rows


def _promote_technical(finding: dict[str, Any], data_status: str) -> bool:
    ftype = finding.get('type')
    if ftype in TECHNICAL_BLOCKERS:
        return True
    if ftype in KNOWN_TECHNICAL:
        return True
    if data_status != 'available':
        return False
    relevance = float(finding.get('business_relevance') or finding.get('business_value') or 0)
    return relevance >= 0.7 and ftype not in {'MISSING_IMAGE_ALT', 'SITEWIDE_MISSING_IMAGE_ALT', 'REDIRECT_ALIAS', 'H1_COUNT'}


def build_opportunities(evidence: dict[str, Any]) -> list[dict[str, Any]]:
    urls = build_url_inventory(evidence.get('crawl'))
    clusters = evidence.get('keyword_clusters') or []
    cannibal = evidence.get('cannibalization') or []
    data_status = search_data_status(evidence)
    findings = []

    findings.extend(discover_content_gaps(clusters, urls, cannibal))

    for c in cannibal:
        findings.append({
            'type': 'cannibalization',
            'title': f"Consolidate or clarify query targeting: {c.get('query')}",
            'query': c.get('query'),
            'pages': c.get('pages', []),
            'impact': min(1.0, 0.55 + 0.08 * max(0, c.get('page_count', 2) - 2)),
            'business_value': 0.7,
            'confidence': 0.82,
            'effort': 0.4,
            'urgency': 0.7,
            'evidence': 'The same query is associated with multiple distinct URLs in search-performance data.',
        })

    for audit in (evidence.get('audit', {}) or {}).get('findings', []):
        if _promote_technical(audit, data_status):
            row = dict(audit)
            row.setdefault('type', 'technical')
            row.setdefault('title', row.get('message') or row.get('type'))
            findings.append(row)

    for collision in evidence.get('entity_collisions') or []:
        findings.append({
            'type': 'entity-collision',
            'title': f"Verify entity identity for {collision.get('name')}",
            'impact': 0.8,
            'business_value': 0.85,
            'confidence': 0.7,
            'effort': 0.4,
            'urgency': 0.75,
            'evidence': collision.get('message') or collision,
        })

    serp = evidence.get('serp_analysis') or {}
    for domain, frequency in (serp.get('domain_frequency') or [])[:10]:
        if not domain:
            continue
        findings.append({
            'type': 'competitor-intelligence',
            'title': f'Analyze SERP competitor: {domain}',
            'competitor_domain': domain,
            'serp_frequency': frequency,
            'impact': min(1.0, 0.45 + frequency * 0.05),
            'business_value': 0.65,
            'confidence': 0.75,
            'effort': 0.35,
            'urgency': 0.55,
            'evidence': 'Domain appears repeatedly among supplied SERP results.',
        })

    if data_status == 'insufficient':
        findings.extend(_required_data_opportunities(evidence))

    return rank_findings(findings)


def build_keyword_url_map(clusters: list[dict[str, Any]], urls: list[dict[str, Any]]) -> dict[str, Any]:
    mappings = map_keywords_to_urls(clusters, urls)
    return {
        'mappings': mappings,
        'new_page_candidates': [m for m in mappings if m['needs_new_or_reworked_page']],
        'existing_page_candidates': [m for m in mappings if not m['needs_new_or_reworked_page']],
    }


def build_30_60_90(opportunities: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    ranked = sorted(opportunities, key=lambda x: x.get('priority_score', 0), reverse=True)
    roadmap = {'0-30_days': [], '31-60_days': [], '61-90_days': []}
    for idx, item in enumerate(ranked):
        score = item.get('priority_score', 0)
        bucket = '0-30_days' if score >= 75 or idx < 5 else '31-60_days' if score >= 55 or idx < 12 else '61-90_days'
        roadmap[bucket].append({
            'title': item.get('title'),
            'type': item.get('type'),
            'priority_score': score,
            'recommended_action': item.get('recommendation') or item.get('title'),
        })
    return roadmap


def build_strategy(evidence: dict[str, Any]) -> dict[str, Any]:
    data_status = search_data_status(evidence)
    technical_findings = list((evidence.get('audit') or {}).get('findings') or [])
    opportunities = build_opportunities(evidence)
    urls = build_url_inventory(evidence.get('crawl'))
    clusters = evidence.get('keyword_clusters') or []
    keyword_map = build_keyword_url_map(clusters, urls)
    serp_rows = evidence.get('serp_rows') or []
    ai_rows = evidence.get('ai_observations') or []
    paid_rows = evidence.get('paid_rows') or []
    target_domain = evidence.get('target_domain') or ''
    market_map = build_market_map(serp_rows, target_domain, ai_rows, paid_rows) if target_domain else {'competitors': [], 'competitor_count': 0, 'market_domains': []}
    keyword_gaps = keyword_gap_analysis(evidence.get('keyword_rows') or [], target_domain) if target_domain else {'true_content_gaps': [], 'ranking_gaps': [], 'competitive_wins': [], 'gap_count': 0, 'ranking_gap_count': 0}
    ai_competitors = ai_source_competitor_analysis(ai_rows, target_domain) if target_domain else {'top_ai_source_competitors': [], 'query_source_gaps': [], 'target_citation_count': 0}
    content_strategy = build_content_strategy(evidence)
    merged = opportunities + (content_strategy.get('opportunities', []) if data_status == 'available' or content_strategy.get('content_gaps') else [])
    merged = sorted(merged, key=lambda x: x.get('priority_score', 0), reverse=True)
    known = [row for row in merged if row.get('type') != 'required-data']
    unknown = []
    if data_status == 'insufficient':
        unknown = [
            {'type': 'unknown', 'title': 'Search demand is unknown until GSC or keyword evidence is connected', 'evidence': 'No query, ranking or impression rows were supplied.'},
            {'type': 'unknown', 'title': 'Competitors are unknown until SERP or GSC evidence is connected', 'evidence': 'Market map was not estimated.'},
            {'type': 'unknown', 'title': 'AI-search visibility is unknown; citation rate is null, not zero', 'evidence': 'No AI-search observations were supplied.'},
        ]
    limitations = {
        'search_data_status': data_status,
        'available': ['technical-evidence', 'on-page-evidence', 'repository-evidence', 'entity-evidence'],
        'unavailable': [name for name, present in {
            'search-demand': bool(clusters),
            'current-rankings': bool(serp_rows),
            'competitors': bool(market_map.get('competitors')),
            'ctr': bool(evidence.get('gsc')),
            'conversions': bool(evidence.get('ga4') or evidence.get('analytics')),
            'ai-search-observations': bool(ai_rows),
        }.items() if not present],
        'required_data': [row['connector'] for row in merged if row.get('type') == 'required-data'],
        'notes': [
            'Technical findings are stored separately from business opportunities.',
            'Missing search metrics were not estimated or coerced to zero.',
        ],
    }
    if data_status == 'insufficient':
        limitations['available'] = [item for item in limitations['available'] if evidence.get('crawl') or item != 'technical-evidence']
        if evidence.get('crawl'):
            limitations['available'] = ['technical-evidence', 'on-page-evidence', 'repository-evidence', 'entity-evidence']
        else:
            limitations['available'] = ['repository-evidence']
    return {
        'version': '2.1.2',
        'search_data_status': data_status,
        'opportunities': merged,
        'opportunity_count': len(merged),
        'known_opportunities': known,
        'unknown_opportunities': unknown,
        'required_data': limitations['required_data'],
        'technical_findings': technical_findings,
        'provisional_strategy': (
            'Discovery-constrained: recommend only observed technical blockers, document policy, entity clarity and required data connections. Do not claim market or ranking opportunities.'
            if data_status == 'insufficient'
            else 'Search evidence is available; opportunities combine demand, competitors and high-relevance technical blockers.'
        ),
        'limitations': limitations,
        'keyword_url_map': keyword_map,
        'roadmap': build_30_60_90(merged),
        'top_opportunities': merged[:10],
        'market_map': market_map,
        'keyword_competitor_gaps': keyword_gaps,
        'ai_source_competitors': ai_competitors,
        'content_intelligence': content_strategy,
    }
