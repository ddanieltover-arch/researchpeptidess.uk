from __future__ import annotations
from typing import Any


def build_content_gaps(topic_map: dict[str, Any], competitor_gaps: dict[str, Any] | None = None, min_authority: float = 55) -> list[dict[str, Any]]:
    competitor_gaps = competitor_gaps or {}
    out = []
    weak_clusters = [t for t in topic_map.get('topics', []) if t.get('topical_authority_score', 0) < min_authority]
    for topic in weak_clusters:
        intent = topic.get('intent') or 'mixed-or-unclear'
        urgency = 0.8 if intent in {'transactional', 'commercial-investigation'} else 0.6
        action = 'build or materially improve the primary page' if topic.get('page_count') else 'create a dedicated topic page'
        out.append({
            'type': 'topic-authority-gap',
            'topic': topic.get('representative'),
            'cluster_id': topic.get('cluster_id'),
            'title': f"Strengthen topical coverage: {topic.get('representative')}",
            'recommended_action': action,
            'topical_authority_score': topic.get('topical_authority_score', 0),
            'impact': 0.8 if intent in {'transactional','commercial-investigation'} else 0.65,
            'business_value': 0.85 if intent in {'transactional','commercial-investigation'} else 0.55,
            'confidence': 0.78,
            'effort': 0.55 if topic.get('page_count') else 0.65,
            'urgency': urgency,
            'evidence': 'Topic has insufficient page coverage/quality relative to the configured authority threshold.',
        })
    for gap in (competitor_gaps.get('true_content_gaps') or [])[:100]:
        out.append({
            'type': 'competitor-content-gap',
            'query': gap.get('query'),
            'title': f"Close competitor content gap: {gap.get('query')}",
            'competitor_domains': gap.get('competitor_domains', []),
            'impact': 0.82,
            'business_value': 0.78,
            'confidence': 0.84,
            'effort': 0.58,
            'urgency': 0.72,
            'evidence': 'One or more competitors have strong observed rankings while the target has no observed ranking for the query.',
        })
    return out
