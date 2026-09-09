from __future__ import annotations
from typing import Any
import re

HEURISTIC_FLOOR = 20.0
EXPLANATION = (
    'Heuristic floor of 20 plus bonuses for first-party facts, original sources and rare terms versus competitor pages. '
    'This is a relative evidence heuristic, not a claim about content quality or market uniqueness.'
)


def _tokens(value: Any) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", str(value or '').lower()) if len(t) > 2}


def score_information_gain(pages: list[dict[str, Any]], competitor_pages: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    competitor_pages = competitor_pages or []
    competitor_terms = set()
    for p in competitor_pages:
        competitor_terms |= _tokens(p.get('text') or p.get('title') or '')
    results = []
    for p in pages:
        text = p.get('text') or ''
        unique_facts = int(p.get('unique_facts') or p.get('first_party_facts') or 0)
        source_count = int(p.get('original_sources') or p.get('source_count') or 0)
        tokens = _tokens(text)
        rare_terms = len(tokens - competitor_terms) if competitor_terms else len(tokens)
        score = min(100.0, HEURISTIC_FLOOR + min(40, unique_facts * 6) + min(20, source_count * 5) + min(20, rare_terms / max(1, len(tokens)) * 100))
        results.append({
            'url': p.get('url'),
            'information_gain_score': round(score, 2),
            'unique_facts': unique_facts,
            'original_sources': source_count,
            'unique_term_signal': round(rare_terms / max(1, len(tokens)), 3),
            'heuristic_floor': HEURISTIC_FLOOR,
            'explanation': EXPLANATION,
        })
    return sorted(results, key=lambda x: x['information_gain_score'], reverse=True)
