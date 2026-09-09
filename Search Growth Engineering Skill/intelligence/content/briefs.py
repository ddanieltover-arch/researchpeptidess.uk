from __future__ import annotations
from typing import Any


def generate_content_briefs(opportunities: list[dict[str, Any]], topic_map: dict[str, Any] | None = None, limit: int = 20) -> list[dict[str, Any]]:
    topic_lookup = {t.get('representative'): t for t in (topic_map or {}).get('topics', [])}
    briefs = []
    for opp in opportunities[:limit]:
        topic = opp.get('topic') or opp.get('query') or opp.get('representative_query') or opp.get('title')
        t = topic_lookup.get(topic, {})
        intent = t.get('intent') or opp.get('intent') or 'mixed-or-unclear'
        page_type = 'commercial landing page' if intent == 'transactional' else 'comparison/buyer guide' if intent == 'commercial-investigation' else 'informational resource'
        briefs.append({
            'topic': topic,
            'intent': intent,
            'recommended_page_type': page_type,
            'primary_goal': 'satisfy search intent and create a clearly differentiated, useful resource',
            'must_cover': t.get('keywords') or [topic],
            'entity_targets': t.get('entity_matches', []),
            'evidence_to_add': [
                'first-party experience or proprietary data where available',
                'specific examples or demonstrations',
                'clear author/source identity',
                'supporting references for important factual claims',
            ],
            'internal_link_targets': [p.get('url') for p in t.get('matched_pages', [])[:5]],
            'quality_gate': 'Do not publish unless the page provides meaningful value beyond a generic keyword rewrite.',
        })
    return briefs
