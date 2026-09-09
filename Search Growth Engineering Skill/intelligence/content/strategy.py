from __future__ import annotations
from typing import Any
from .authority import build_topic_map, internal_link_graph
from .gaps import build_content_gaps
from .decay import detect_content_decay
from .information_gain import score_information_gain
from .briefs import generate_content_briefs


def build_content_strategy(evidence: dict[str, Any]) -> dict[str, Any]:
    crawl = evidence.get('crawl') or {}
    pages = crawl.get('pages') or crawl.get('results') or evidence.get('pages') or []
    clusters = evidence.get('keyword_clusters') or evidence.get('clusters') or []
    entities = (evidence.get('entity_graph') or {}).get('entities', evidence.get('entities', []))
    topic_map = build_topic_map(clusters, pages, entities)
    links = internal_link_graph(pages)
    competitor_gaps = evidence.get('keyword_competitor_gaps') or evidence.get('competitor_gaps') or {}
    gaps = build_content_gaps(topic_map, competitor_gaps)
    decay = detect_content_decay(evidence.get('current_content_metrics', []), evidence.get('previous_content_metrics', []))
    information_gain = score_information_gain(pages, evidence.get('competitor_pages', []))
    opportunities = gaps + [
        {
            'type': 'content-decay',
            'title': f"Refresh declining content: {x['page']}",
            'page': x['page'],
            'impact': 0.82 if x['severity'] == 'high' else 0.68,
            'business_value': 0.72,
            'confidence': 0.86,
            'effort': 0.45,
            'urgency': 0.8,
            'evidence': x['metrics'],
        } for x in decay
    ]
    orphan_opportunities = [
        {'type': 'internal-link-gap', 'title': f'Create internal links to orphan page: {u}', 'page': u, 'impact': 0.55, 'business_value': 0.5, 'confidence': 0.9, 'effort': 0.25, 'urgency': 0.55, 'evidence': 'Page has no inbound internal links in current crawl graph.'}
        for u in links.get('orphan_pages', [])
    ]
    opportunities.extend(orphan_opportunities)
    for item in opportunities:
        impact=item.get('impact',0.5); business=item.get('business_value',0.5); confidence=item.get('confidence',0.7); effort=item.get('effort',0.5); urgency=item.get('urgency',0.5)
        item['priority_score'] = round(100 * ((0.3*impact)+(0.25*business)+(0.2*confidence)+(0.15*urgency)+(0.1*(1-effort))), 2)
    opportunities.sort(key=lambda x: x['priority_score'], reverse=True)
    return {
        'version': '1.9.0',
        'topic_map': topic_map,
        'internal_link_graph': links,
        'content_gaps': sorted(gaps, key=lambda x: x.get('priority_score',0), reverse=True),
        'content_decay': decay,
        'information_gain': information_gain,
        'opportunities': opportunities,
        'opportunity_count': len(opportunities),
        'content_briefs': generate_content_briefs(opportunities, topic_map),
    }
