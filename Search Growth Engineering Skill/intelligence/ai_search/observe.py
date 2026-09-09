from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from intelligence.provenance import stamp

OBSERVED_ENGINES = (
    'chatgpt-search',
    'google-ai-mode',
    'google-ai-overviews',
    'perplexity',
    'gemini',
    'claude-search',
)

ENGINE_ALIASES = {
    'chatgpt': 'chatgpt-search',
    'chatgpt search': 'chatgpt-search',
    'google ai mode': 'google-ai-mode',
    'ai mode': 'google-ai-mode',
    'google ai overviews': 'google-ai-overviews',
    'ai overview': 'google-ai-overviews',
    'ai overviews': 'google-ai-overviews',
    'google-ai-overview': 'google-ai-overviews',
    'claude': 'claude-search',
}


def canonical_engine(value: str) -> str:
    raw = (value or '').strip().lower()
    return ENGINE_ALIASES.get(raw, raw)


def observe_ai_search(rows: list[dict[str, Any]], *, collected_at: str | None = None) -> dict[str, Any]:
    """Record observed AI-search evidence only. Never estimate visibility."""
    observed_at = collected_at or datetime.now(timezone.utc).isoformat()
    observations = []
    rejected = []
    for row in rows or []:
        engine = canonical_engine(str(row.get('engine', '')))
        query = str(row.get('query') or '')
        if engine not in OBSERVED_ENGINES:
            rejected.append({'reason': 'unsupported_or_unobserved_engine', 'engine': row.get('engine'), 'query': query})
            continue
        if not query:
            rejected.append({'reason': 'missing_query', 'engine': engine})
            continue
        citations = row.get('citations') or []
        if not citations and (row.get('source_url') or row.get('source_domain')):
            citations = [{
                'url': row.get('source_url'),
                'domain': row.get('source_domain'),
                'cited': bool(row.get('cited', False)),
            }]
        entities = row.get('entities') or []
        observations.append(stamp({
            'query': query,
            'engine': engine,
            'citations': citations,
            'entities': entities,
            'answer_summary': row.get('answer_summary') or row.get('answer_surface') or '',
            'observed_at': row.get('observed_at') or observed_at,
            'evidence_source': row.get('evidence_source') or 'provided-observation',
            'locale': row.get('locale'),
            'source_url': row.get('source_url'),
            'source_domain': row.get('source_domain'),
            'cited': bool(row.get('cited', False)),
        }, engine, evidence_type='observed', collected_at=row.get('observed_at') or observed_at))
    return {
        'status': 'ok',
        'collected_at': observed_at,
        'observed_engines': sorted({row['engine'] for row in observations}),
        'supported_engines': list(OBSERVED_ENGINES),
        'observations': observations,
        'rejected': rejected,
        'notes': [
            'Only supplied observations were recorded.',
            'Visibility, citation probability and rankings were not estimated.',
        ],
    }
