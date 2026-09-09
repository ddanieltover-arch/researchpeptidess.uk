from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

EVIDENCE_TYPES = ('observed', 'estimated', 'inferred', 'generated')

DEFAULT_CONFIDENCE = {
    'observed': 1.0,
    'estimated': 0.4,
    'inferred': 0.7,
    'generated': 0.5,
}

SOURCE_ALIASES = {
    'gsc': 'google_search_console',
    'google-search-console': 'google_search_console',
    'google-search-console.search-analytics': 'google_search_console',
    'ga4': 'google_analytics_4',
    'google-analytics-4': 'google_analytics_4',
    'google-ads': 'google_ads',
    'serpapi': 'serp_api',
    'serp-api': 'serp_api',
    'chatgpt-search': 'chatgpt_search',
    'google-ai-mode': 'google_ai_mode',
    'google-ai-overviews': 'google_ai_overviews',
    'perplexity': 'perplexity',
    'gemini': 'gemini',
    'claude-search': 'claude_search',
}


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical_source(source: str) -> str:
    raw = (source or 'unknown').strip()
    return SOURCE_ALIASES.get(raw, SOURCE_ALIASES.get(raw.lower(), raw.replace('-', '_').replace('.', '_')))


def provenance(
    source: str,
    *,
    evidence_type: str = 'observed',
    confidence: float | None = ...,
    collected_at: str | None = None,
) -> dict[str, Any]:
    kind = (evidence_type or 'observed').lower()
    if kind not in EVIDENCE_TYPES:
        raise ValueError(f'Unknown evidence_type: {evidence_type}. Use {EVIDENCE_TYPES}.')
    score = DEFAULT_CONFIDENCE[kind] if confidence is ... else confidence
    return {
        'source': canonical_source(source),
        'collected_at': collected_at or utcnow(),
        'confidence': score,
        'evidence_type': kind,
    }


def stamp(record: dict[str, Any], source: str, *, evidence_type: str = 'observed', confidence: float | None = ..., collected_at: str | None = None) -> dict[str, Any]:
    """Attach provenance without overwriting an explicit complete provenance block."""
    payload = dict(record)
    existing = payload.get('provenance') if isinstance(payload.get('provenance'), dict) else None
    if existing and existing.get('source') and existing.get('evidence_type'):
        return payload
    meta = provenance(source, evidence_type=evidence_type, confidence=confidence, collected_at=collected_at or payload.get('collected_at'))
    payload['provenance'] = meta
    payload.setdefault('source', meta['source'])
    payload.setdefault('collected_at', meta['collected_at'])
    payload.setdefault('confidence', meta['confidence'])
    payload.setdefault('evidence_type', meta['evidence_type'])
    return payload
