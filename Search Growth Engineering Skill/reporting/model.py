from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _workspace_id(evidence: dict[str, Any]) -> str:
    workspace = evidence.get('workspace')
    if isinstance(workspace, dict):
        return str(workspace.get('client_id') or workspace.get('id') or '')
    return str(workspace or '')


def _target_url(evidence: dict[str, Any]) -> str:
    if evidence.get('target_url'):
        return str(evidence['target_url'])
    workspace = evidence.get('workspace')
    if isinstance(workspace, dict):
        config = workspace.get('config') or {}
        if config.get('target_url'):
            return str(config['target_url'])
    project = evidence.get('project') or {}
    return str(project.get('target_url') or project.get('name') or '')


def canonical_report_model(evidence: dict[str, Any]) -> dict[str, Any]:
    """Single report model consumed by JSON, Markdown, HTML and PDF renderers."""
    strategy = evidence.get('strategy') or {}
    audit = (evidence.get('evidence') or {}).get('audit') or evidence.get('audit') or {}
    findings = audit.get('findings') or strategy.get('technical_findings') or []
    opportunities = strategy.get('opportunities') or []
    limitations = strategy.get('limitations') or evidence.get('limitations') or {}
    provenance = evidence.get('provenance') or {}
    if not limitations:
        limitations = {
            'search_data_status': strategy.get('search_data_status') or 'unknown',
            'notes': evidence.get('evidence_gaps') or ['External connectors may be unconfigured.'],
        }
    return {
        'project': evidence.get('project') or {},
        'workspace': _workspace_id(evidence),
        'target_url': _target_url(evidence),
        'evidence': {
            'crawl_pages': len(((evidence.get('evidence') or {}).get('crawl') or evidence.get('crawl') or {}).get('pages') or []),
            'search_data_status': strategy.get('search_data_status') or limitations.get('search_data_status'),
            'sources': ((evidence.get('evidence') or {}).get('sources') or evidence.get('sources') or []),
        },
        'findings': findings,
        'opportunities': opportunities,
        'priorities': strategy.get('top_opportunities') or opportunities[:10],
        'roadmap': strategy.get('roadmap') or {},
        'limitations': limitations,
        'provisional_strategy': strategy.get('provisional_strategy') or '',
        'known_opportunities': strategy.get('known_opportunities') or [],
        'unknown_opportunities': strategy.get('unknown_opportunities') or [],
        'required_data': strategy.get('required_data') or [],
        'provenance': provenance,
        'summary': evidence.get('summary') or 'Evidence-backed summary only. Missing measurements were not estimated.',
        'generated_at': evidence.get('generated_at') or _now(),
    }


def load_workspace_report_evidence(ws) -> dict[str, Any]:
    """Prefer engine artifacts over the raw orchestration summary."""
    default_summary = 'Search Growth Platform run. External metrics were used only when connectors returned observed evidence.'
    summary = ws.read_json('orchestration-summary.json') or {'workspace': ws.client_id}
    evidence = ws.read_json('engine/evidence.json') or {}
    strategy = ws.read_json('engine/strategy.json') or {}
    audit = ws.read_json('engine/audit.json') or (evidence.get('audit') or {})
    limitations = ws.read_json('engine/limitations.json') or (strategy.get('limitations') or {})
    project = ws.read_json('engine/project-profile.json') or (evidence.get('project') or {})
    summary_text = summary.get('summary')
    if isinstance(summary_text, dict) or not summary_text:
        summary_text = default_summary
    return {
        **summary,
        'workspace': ws.client_id,
        'target_url': (ws.config or {}).get('target_url') or summary.get('target_url') or evidence.get('target_url'),
        'project': project,
        'evidence': evidence,
        'audit': audit,
        'strategy': strategy,
        'limitations': limitations,
        'summary': summary_text,
    }
