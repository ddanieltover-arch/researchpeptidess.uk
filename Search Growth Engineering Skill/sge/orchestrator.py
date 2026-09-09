from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json

from connectors import ConnectorRegistry
from connectors.secrets import SecretsManager
from workspaces import WorkspaceManager
from intelligence.memory import GrowthMemory
from intelligence.orchestrator import orchestrate as orchestrate_local
from intelligence.ai_search.observe import observe_ai_search
from intelligence.citations import build_citation_intelligence
from intelligence.entities import build_entity_platform
from intelligence.live_serp import collect_live_serp
from intelligence.provenance import stamp
from reporting import write_reports, REPORT_KINDS
from agents.runtime import AgentOrchestrator
from agents.protocol import A2AMessage
from .modes import resolve_mode

PIPELINE = (
    'connect',
    'sync',
    'observe',
    'analyze',
    'model',
    'prioritize',
    'execute',
    'validate',
    'monitor',
    'learn',
)

PLATFORM_VERSION = '2.1.2'


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _persist_engine_artifacts(ws, *, project: dict[str, Any], evidence: dict[str, Any], strategy: dict[str, Any] | None = None) -> dict[str, str]:
    from intelligence.strategy import search_data_status
    evidence = dict(evidence or {})
    evidence.setdefault('project', project)
    audit = evidence.get('audit') or {}
    data_status = (strategy or {}).get('search_data_status') or search_data_status(evidence)
    limitations = (strategy or {}).get('limitations') or {
        'search_data_status': data_status,
        'available': ['technical-evidence', 'on-page-evidence', 'repository-evidence', 'entity-evidence'] if evidence.get('crawl') else ['repository-evidence'],
        'unavailable': ['search-demand', 'current-rankings', 'competitors', 'ctr', 'conversions', 'ai-search-observations'],
        'notes': ['Audit artifacts persisted for reuse by strategy. Search metrics were not estimated.'],
    }
    written = {
        'engine/project-profile.json': ws.write_json('engine/project-profile.json', project or {}),
        'engine/evidence.json': ws.write_json('engine/evidence.json', evidence),
        'engine/audit.json': ws.write_json('engine/audit.json', audit),
        'engine/limitations.json': ws.write_json('engine/limitations.json', limitations),
    }
    if strategy is not None:
        written['engine/strategy.json'] = ws.write_json('engine/strategy.json', strategy)
    return {key: str(path) for key, path in written.items()}


def orchestrate_platform(
    workspace: str,
    *,
    project_path: str | Path = '.',
    url: str | None = None,
    sync: bool = False,
    observe: bool = False,
    strategy: bool = False,
    monitor: bool = False,
    apply: bool = False,
    mode: str | None = None,
    workspaces_root: str | Path | None = None,
    secrets: SecretsManager | None = None,
    report: bool = True,
) -> dict[str, Any]:
    plan = resolve_mode(mode, sync=sync, observe=observe, strategy=strategy, monitor=monitor)
    manager = WorkspaceManager(workspaces_root)
    ws = manager.ensure(workspace)
    memory = ws.memory
    registry = ConnectorRegistry(secrets=secrets or SecretsManager.current(), config=ws.config)
    stages: dict[str, Any] = {name: {'status': 'skipped'} for name in PIPELINE}
    artifacts: dict[str, str] = {}
    target_url = url or ws.config.get('target_url')
    target_domain = ws.config.get('target_domain') or ''
    certificates: list[dict[str, Any]] = []

    enabled = ws.enabled_connectors()
    if plan['sync']:
        if not enabled:
            enabled = [row['id'] for row in registry.discover() if registry.validate(row['id']).ok]
        stages['connect'] = {
            'status': 'ok',
            'connectors': {cid: registry.connect(cid).to_dict() for cid in enabled} if enabled else {},
            'notes': [] if enabled else ['No configured connectors. Sync skipped rather than fabricating metrics.'],
        }
        synced = {cid: registry.sync(cid).to_dict() for cid in enabled}
        stages['sync'] = {'status': 'ok' if enabled else 'skipped', 'connectors': synced}
        ws.write_json('connectors/last-sync.json', stages['sync'])
        artifacts['last-sync.json'] = str(ws.resolve('connectors/last-sync.json'))

    observations = {'observations': [], 'status': 'skipped'}
    live_serp: list[dict[str, Any]] = []
    if plan['observe']:
        observe_cfg = ws.config.get('observe') or {}
        queries = observe_cfg.get('queries') or []
        for query in queries:
            live_serp.append(collect_live_serp(query, workspace=workspace, store_root=str(ws.root), registry=registry))
        rows = []
        obs_file = observe_cfg.get('ai_observations_file')
        if obs_file:
            loaded = ws.read_json(obs_file)
            if isinstance(loaded, list):
                rows = loaded
            elif isinstance(loaded, dict):
                rows = loaded.get('observations') or loaded.get('rows') or []
        observations = observe_ai_search(rows)
        citations = build_citation_intelligence(observations['observations'], target_domain=target_domain or None)
        stages['observe'] = stamp({
            'status': 'ok',
            'live_serp': live_serp,
            'ai_search': observations,
            'citations': citations,
            'notes': [
                'Only authorized SERP providers and supplied AI-search observations were used.',
                'Visibility was not estimated.',
            ],
        }, 'sgos.observe', evidence_type='observed')
        ws.write_json('intelligence/observe.json', stages['observe'])
        artifacts['observe.json'] = str(ws.resolve('intelligence/observe.json'))

    local = None
    if plan.get('analyze') and not plan.get('strategy'):
        from intelligence.discovery.project import discover_project, refine_classification
        from intelligence.crawl.site import crawl_site
        from intelligence.audit.technical import audit_crawl
        from intelligence.entities.jsonld import entities_from_crawl
        project = discover_project(project_path)
        evidence = {'project': project, 'collected_at': _now(), 'target_url': target_url}
        if target_url:
            crawl = crawl_site(target_url, 50, 0.15)
            project = refine_classification(project, crawl)
            evidence['project'] = project
            evidence['crawl'] = crawl
            evidence['audit'] = audit_crawl(crawl)
            graph = entities_from_crawl(crawl.get('pages'))
            evidence['entity_graph'] = graph
            evidence['entity_collisions'] = graph.get('collisions') or []
        persisted = _persist_engine_artifacts(ws, project=project, evidence=evidence)
        artifacts.update(persisted)
        local = stamp({
            'project': project,
            'evidence': evidence,
            'strategy': {},
            'execution': None,
            'validation': None,
            'artifacts': persisted,
        }, 'sgos.audit', evidence_type='observed')
        stages['analyze'] = {'status': 'ok', 'project': project}
    elif plan.get('strategy'):
        local = orchestrate_local(project_path, target_url, root=str(ws.resolve('engine')), apply=apply, execute=bool(plan.get('execute')))
        entity_graph = (local.get('evidence') or {}).get('entity_graph') or ws.config.get('entities') or {}
        entity_platform = build_entity_platform(entity_graph)
        agent_results = AgentOrchestrator().fanout(A2AMessage(
            task='platform-strategy',
            context={
                'url': target_url,
                'crawl': (local.get('evidence') or {}).get('crawl') or {},
                'target_domain': target_domain,
                'observations': observations.get('observations') or [],
                'serp_rows': [row for snap in live_serp for row in (snap.get('results') or [])],
                'entities': (entity_graph.get('entities') if isinstance(entity_graph, dict) else entity_graph) or [],
            },
        ))
        strategy_payload = stamp(local.get('strategy') or {}, 'sgos.strategy', evidence_type='inferred')
        stages['analyze'] = {'status': 'ok', 'project': local.get('project'), 'agents': list(agent_results.get('results', {}))}
        stages['model'] = {'status': 'ok', 'entity_platform': entity_platform, 'agent_results': agent_results}
        stages['prioritize'] = {'status': 'ok', 'strategy': strategy_payload}
        if plan.get('execute'):
            stages['execute'] = {'status': 'ok', 'execution': local.get('execution'), 'mode': 'apply' if apply else 'dry-run'}
        if plan.get('validate'):
            stages['validate'] = {'status': 'ok', 'validation': local.get('validation')}
        artifacts.update(local.get('artifacts') or {})

    if plan.get('monitor'):
        from intelligence.monitor import run_monitor
        monitor_cfg = ws.resolve('connectors/monitor.json')
        if not monitor_cfg.exists():
            ws.write_json('connectors/monitor.json', {
                'crawl_targets': [{'url': target_url, 'max_pages': 20}] if target_url else [],
                'snapshot_label': 'platform-monitor',
            })
        monitor_result = run_monitor(monitor_cfg, ws.resolve('memory'), dry_run=not apply)
        stages['monitor'] = {'status': monitor_result.get('status'), 'result': monitor_result}
        if monitor_result.get('alerts'):
            ws.write_json('alerts/latest.json', monitor_result['alerts'])
        if plan.get('recommend'):
            from intelligence.strategy import build_strategy
            recommendations = stamp(build_strategy(monitor_result.get('strategy_input') or {}), 'sgos.growth', evidence_type='inferred')
            stages['monitor']['recommendations'] = recommendations
            ws.write_json('roadmaps/recommendations.json', recommendations)

    digest = memory.digest()
    run_record = memory.record_run('sgos', 'ok', {
        'workspace': workspace,
        'mode': plan.get('mode'),
        'sync': plan['sync'],
        'observe': plan['observe'],
        'strategy': plan['strategy'],
        'monitor': plan['monitor'],
        'apply': apply,
        'pipeline': [name for name, row in stages.items() if row.get('status') not in {None, 'skipped'}],
    })
    stages['learn'] = {'status': 'ok', 'memory': digest, 'run': run_record}

    evidence = stamp({
        'workspace': workspace,
        'target_url': target_url,
        'project': (local or {}).get('project') or {},
        'evidence': (local or {}).get('evidence') or {},
        'strategy': (stages.get('prioritize') or {}).get('strategy') or (local or {}).get('strategy') or {},
        'audit': ((local or {}).get('evidence') or {}).get('audit') or {},
        'citations': (stages.get('observe') or {}).get('citations') or {},
        'ai_observations': observations,
        'market_map': ((local or {}).get('evidence') or {}).get('market_map') or {},
        'entity_platform': (stages.get('model') or {}).get('entity_platform') or {},
        'growth_memory': digest,
        'monitor': (stages.get('monitor') or {}).get('result') or {},
        'certificates': certificates,
        'summary': 'Search Growth Platform run. External metrics were used only when connectors returned observed evidence.',
    }, 'sgos', evidence_type='generated')
    report_kinds = plan.get('reports') or REPORT_KINDS
    if report:
        for kind in report_kinds:
            written = write_reports(kind, evidence, ws.resolve('reports'), formats=['json', 'markdown', 'html', 'pdf'])
            artifacts.update({f'report:{kind}:{fmt}': path for fmt, path in written.items()})

    summary = {
        'version': PLATFORM_VERSION,
        'status': 'completed',
        'readiness': 'real-client-pilots',
        'release': 'production-alpha',
        'generated_at': _now(),
        'mode': plan.get('mode'),
        'workspace': ws.to_dict(),
        'pipeline': PIPELINE,
        'stages': stages,
        'certificates': certificates,
        'dry_run': not apply,
        'artifacts': artifacts,
        'growth_memory': digest,
    }
    summary_path = ws.write_json('orchestration-summary.json', summary)
    artifacts['orchestration-summary.json'] = str(summary_path)
    summary['artifacts'] = artifacts
    return summary
