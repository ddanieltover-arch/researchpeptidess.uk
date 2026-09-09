from __future__ import annotations
from collections import defaultdict
from typing import Any
import re


def _tokens(value: Any) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", str(value or '').lower()) if len(t) > 1}


def _page_score(page: dict[str, Any]) -> float:
    word_count = float(page.get('word_count') or page.get('text_words') or 0)
    h1 = float(page.get('h1_count') or page.get('h1') or 0)
    internal_in = float(page.get('internal_inlinks') or page.get('inlinks') or 0)
    unique_facts = float(page.get('unique_facts') or page.get('first_party_facts') or 0)
    freshness = float(page.get('freshness_score') or 0)
    quality = 0.0
    if word_count >= 800:
        quality += 0.3
    elif word_count >= 400:
        quality += 0.2
    elif word_count >= 250:
        quality += 0.1
    if h1 == 1:
        quality += 0.15
    if internal_in >= 3:
        quality += 0.15
    elif internal_in >= 1:
        quality += 0.08
    quality += min(0.2, unique_facts * 0.03)
    quality += min(0.2, freshness * 0.2)
    return min(1.0, quality)


def build_topic_map(keyword_clusters: list[dict[str, Any]], pages: list[dict[str, Any]], entities: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    pages = pages or []
    entities = entities or []
    entity_names = [str(e.get('name') or e.get('id') or '') for e in entities]
    topics = []
    for cluster in keyword_clusters or []:
        keywords = cluster.get('keywords') or [cluster.get('representative', '')]
        topic_tokens = set()
        for kw in keywords:
            topic_tokens |= _tokens(kw)
        matched = []
        for page in pages:
            corpus = _tokens(' '.join([
                str(page.get('title', '')),
                str(page.get('url', '')),
                str(page.get('h1', '')),
                str(page.get('text', '')),
            ]))
            overlap = len(topic_tokens & corpus) / max(1, len(topic_tokens))
            if overlap >= 0.2:
                matched.append({'url': page.get('url'), 'relevance': round(overlap, 3), 'quality_score': round(_page_score(page), 3)})
        matched.sort(key=lambda x: (x['relevance'], x['quality_score']), reverse=True)
        covered_terms = set()
        for kw in keywords:
            covered_terms |= _tokens(kw)
        avg_quality = sum(x['quality_score'] for x in matched) / len(matched) if matched else 0.0
        entity_hits = [e for e in entity_names if _tokens(e) & topic_tokens]
        coverage = min(1.0, len(matched) / max(1, min(5, len(keywords))))
        topical_authority = round(100 * (0.45 * coverage + 0.3 * avg_quality + 0.15 * min(1, len(entity_hits) / 3) + 0.1 * min(1, len(keywords) / 5)), 2)
        topics.append({
            'cluster_id': cluster.get('cluster_id'),
            'representative': cluster.get('representative'),
            'intent': cluster.get('intent'),
            'keywords': keywords,
            'matched_pages': matched[:10],
            'page_count': len(matched),
            'entity_matches': entity_hits[:10],
            'coverage_score': round(coverage, 3),
            'average_page_quality': round(avg_quality, 3),
            'topical_authority_score': topical_authority,
            'status': 'strong' if topical_authority >= 75 else 'developing' if topical_authority >= 50 else 'weak',
        })
    return {'topics': sorted(topics, key=lambda x: x['topical_authority_score'], reverse=True), 'topic_count': len(topics)}


def internal_link_graph(pages: list[dict[str, Any]]) -> dict[str, Any]:
    nodes = {p.get('url') for p in pages if p.get('url')}
    inbound = defaultdict(int)
    outbound = defaultdict(int)
    edges = []
    for p in pages:
        src = p.get('url')
        for link in (p.get('internal_links') or []):
            dst = link.get('url') if isinstance(link, dict) else link
            if src and dst and dst in nodes:
                outbound[src] += 1
                inbound[dst] += 1
                edges.append({'from': src, 'to': dst})
    orphan_pages = sorted([u for u in nodes if inbound[u] == 0])
    hubs = sorted([{'url': u, 'outbound_internal_links': outbound[u], 'inbound_internal_links': inbound[u]} for u in nodes if outbound[u] >= 5], key=lambda x: x['outbound_internal_links'], reverse=True)
    return {'nodes': len(nodes), 'edges': len(edges), 'orphan_pages': orphan_pages, 'hubs': hubs, 'inbound': dict(inbound), 'outbound': dict(outbound)}
