from __future__ import annotations

from pathlib import Path
from typing import Any

from intelligence.provenance import stamp

PILOT_SEQUENCE = (
    'connect',
    'audit',
    'strategy',
    'review_opportunities',
    'implement_selected',
    'validate',
    'monitor',
    'compare_outcomes',
)

SCORECARD_AREAS = (
    'classification',
    'technical',
    'search',
    'content',
    'competitors',
    'geo_aio',
    'prioritization',
    'implementation',
    'reporting',
    'efficiency',
)

BASELINE_METRICS = (
    'organic_clicks',
    'organic_impressions',
    'ctr',
    'average_position',
    'organic_sessions',
    'leads_signups',
    'conversions',
    'revenue',
    'indexed_pages',
    'technical_errors',
    'commercial_query_coverage',
    'ai_search_observations',
)

REVIEW_DECISIONS = ('accept', 'override', 'defer')

REGRESSION_FLOOR = 54

PILOT_CLIENTS = (
    {
        'workspace': 'vees-airbnb',
        'name': 'VEES AIRBNB',
        'project_type': 'hospitality',
        'traits': ('local', 'transactional'),
    },
    {
        'workspace': 'couples-retreat',
        'name': 'Couples Retreat',
        'project_type': 'hospitality',
        'traits': ('local', 'booking-oriented'),
    },
    {
        'workspace': 'moore-business',
        'name': 'Moore Business',
        'project_type': 'automotive',
        'traits': ('bilingual', 'inventory', 'services'),
    },
    {
        'workspace': 'research-peptides-uk',
        'name': 'Research Peptides UK',
        'project_type': 'ecommerce-or-catalogue',
        'traits': ('highly-competitive', 'commercial', 'compliance-sensitive'),
    },
)


def empty_baseline(source: str = 'pilot-baseline') -> dict[str, Any]:
    metrics = {key: None for key in BASELINE_METRICS}
    return stamp({
        'metrics': metrics,
        'notes': [
            'Missing measurements are null, not zero.',
            'Do not invent clicks, rankings, conversions or AI citations.',
        ],
    }, source, evidence_type='observed', confidence=None)


def scorecard_template(workspace: str, reviewer: str = '') -> dict[str, Any]:
    areas = {area: {'pass': None, 'notes': '', 'question': _QUESTION[area]} for area in SCORECARD_AREAS}
    return stamp({
        'workspace': workspace,
        'reviewer': reviewer,
        'sequence': list(PILOT_SEQUENCE),
        'areas': areas,
        'override': {'reviewed': 0, 'overridden': 0, 'rate_pct': None},
        'causal_policy': 'Traffic movement after a change is correlation unless supporting evidence justifies a stronger claim.',
    }, 'sgos.pilot_scorecard', evidence_type='generated')


_QUESTION = {
    'classification': 'Did SGOS correctly understand the business/project?',
    'technical': 'Did it find real, material technical problems?',
    'search': 'Did it identify genuine search opportunities?',
    'content': 'Are recommended topics/pages commercially useful?',
    'competitors': 'Did it identify meaningful search competitors?',
    'geo_aio': 'Are AI-search findings evidence-based?',
    'prioritization': 'Are the top opportunities actually the best ones?',
    'implementation': 'Are proposed changes technically safe?',
    'reporting': 'Can a client understand the result?',
    'efficiency': 'Did SGOS save meaningful human research time?',
}


def override_rate(reviews: list[dict[str, Any]]) -> dict[str, Any]:
    rows = [r for r in (reviews or []) if isinstance(r, dict)]
    reviewed = [r for r in rows if str(r.get('decision') or '').lower() in REVIEW_DECISIONS]
    if not reviewed:
        return stamp({
            'reviewed': 0,
            'overridden': 0,
            'accepted': 0,
            'deferred': 0,
            'rate_pct': None,
            'notes': ['No recommendations were reviewed. Override rate is unknown, not zero.'],
        }, 'sgos.strategist_override', evidence_type='observed', confidence=None)
    overridden = sum(1 for r in reviewed if str(r.get('decision')).lower() == 'override')
    accepted = sum(1 for r in reviewed if str(r.get('decision')).lower() == 'accept')
    deferred = sum(1 for r in reviewed if str(r.get('decision')).lower() == 'defer')
    return stamp({
        'reviewed': len(reviewed),
        'overridden': overridden,
        'accepted': accepted,
        'deferred': deferred,
        'rate_pct': round(100.0 * overridden / len(reviewed), 2),
        'notes': ['Declining override rate across pilots is a stronger validation signal than recommendation volume.'],
    }, 'sgos.strategist_override', evidence_type='observed', confidence=1.0)


def compare_baselines(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    prev = (before or {}).get('metrics') or before or {}
    curr = (after or {}).get('metrics') or after or {}
    changes = []
    for key in BASELINE_METRICS:
        a, b = prev.get(key), curr.get(key)
        if a is None or b is None:
            changes.append({'metric': key, 'previous': a, 'current': b, 'delta': None, 'note': 'Insufficient evidence; missing is not zero.'})
            continue
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            changes.append({'metric': key, 'previous': a, 'current': b, 'delta': b - a})
        else:
            changes.append({'metric': key, 'previous': a, 'current': b, 'delta': 'changed' if a != b else 0})
    return stamp({
        'changes': changes,
        'causal_claim': 'correlation_only',
        'notes': [
            'A traffic increase after an SEO change is correlation, not automatic proof of causation.',
            'Separate seasonality, tracking changes, deployments and demand from likely effects.',
        ],
    }, 'sgos.pilot_compare', evidence_type='inferred')


def count_regression_tests(root: str | Path | None = None) -> int:
    base = Path(root or Path(__file__).resolve().parent)
    total = 0
    for path in sorted(base.glob('test_*.py')):
        text = path.read_text(encoding='utf-8')
        total += sum(1 for line in text.splitlines() if line.startswith('def test_'))
    return total
