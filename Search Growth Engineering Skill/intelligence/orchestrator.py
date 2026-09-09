from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json

from .discovery.project import discover_project, refine_classification
from .crawl.site import crawl_site
from .audit.technical import audit_crawl
from .strategy import build_strategy
from .execution.planner import build_execution_plan
from .execution.engine import ExecutionEngine
from .execution.validators import ValidationRunner
from .memory import GrowthMemory
from .content.authority import build_topic_map
from .content.information_gain import score_information_gain
from .ai_search.entity_graph import build_entity_graph
from .ai_search.analyzer import normalize_observations, analyze_observations, detect_source_gaps
from .competitors.market_map import build_market_map
from .search.keywords import cluster_keywords, detect_cannibalization
from .connectors.serp import normalize_results
from .search.serp_analysis import analyze_serp_results
from .entities.jsonld import entities_from_crawl


@dataclass
class OrchestrationConfig:
    max_pages: int = 50
    crawl_delay: float = 0.15
    run_external_connectors: bool = False
    dry_run: bool = True
    apply: bool = False
    write_artifacts: bool = True
    run_validation: bool = False
    validation_commands: list[str] | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_config(path: str | Path | None) -> OrchestrationConfig:
    if not path:
        return OrchestrationConfig()
    obj = json.loads(Path(path).read_text(encoding='utf-8'))
    return OrchestrationConfig(
        max_pages=int(obj.get('max_pages', 50)),
        crawl_delay=float(obj.get('crawl_delay', 0.15)),
        run_external_connectors=bool(obj.get('run_external_connectors', False)),
        dry_run=bool(obj.get('dry_run', True)),
        apply=bool(obj.get('apply', False)),
        write_artifacts=bool(obj.get('write_artifacts', True)),
        run_validation=bool(obj.get('run_validation', False)),
        validation_commands=obj.get('validation_commands') or [],
    )


def _module_payload(project: dict[str, Any]) -> dict[str, Any]:
    modules = project.get('activated_modules') or []
    return {
        'activated': modules,
        'disabled': [
            'external-connectors' if 'run_external_connectors' not in modules else None,
        ],
    }


def _collect_local_evidence(project: dict[str, Any], target_url: str | None, config: OrchestrationConfig) -> dict[str, Any]:
    evidence: dict[str, Any] = {'project': project, 'collected_at': _now(), 'sources': []}
    if not target_url:
        evidence['crawl'] = {'pages': [], 'errors': ['No target URL supplied.']}
        evidence['audit'] = {'findings': []}
        return evidence
    crawl = crawl_site(target_url, config.max_pages, config.crawl_delay)
    audit = audit_crawl(crawl)
    project = refine_classification(project, crawl)
    evidence['project'] = project
    evidence['crawl'] = crawl
    evidence['audit'] = audit
    evidence['target_url'] = target_url
    evidence['target_domain'] = target_url.split('//', 1)[-1].split('/', 1)[0].lower()
    evidence['sources'] += [
        {'type': 'crawl', 'target': target_url, 'pages': len(crawl.get('pages', []))},
        {'type': 'technical-audit', 'findings': len(audit.get('findings', []))},
    ]
    return evidence


def _enrich_local_intelligence(evidence: dict[str, Any]) -> dict[str, Any]:
    # Preserve an intentional evidence hierarchy. Missing external data is not synthesized.
    evidence = dict(evidence)
    evidence.setdefault('keyword_clusters', [])
    evidence.setdefault('keyword_rows', [])
    evidence.setdefault('cannibalization', [])
    evidence.setdefault('serp_rows', [])
    evidence.setdefault('serp_analysis', {})
    evidence.setdefault('ai_observations', [])
    evidence.setdefault('ai_analysis', {})
    evidence.setdefault('content_intelligence', {})

    pages = (evidence.get('crawl') or {}).get('pages') or []
    extracted = entities_from_crawl(pages)
    if pages:
        evidence['entity_graph'] = extracted
        evidence['entity_collisions'] = extracted.get('collisions') or []
    else:
        evidence.setdefault('entity_graph', {'entities': [], 'relationships': []})
        evidence.setdefault('entity_collisions', [])

    keyword_source = evidence.get('keywords') or []
    if keyword_source:
        evidence['keyword_clusters'] = cluster_keywords(keyword_source)
        evidence['cannibalization'] = detect_cannibalization(evidence.get('keyword_rows') or [])

    if evidence.get('serp_rows'):
        evidence['serp_analysis'] = analyze_serp_results(evidence['serp_rows'], evidence.get('target_domain', ''))
        evidence['market_map'] = build_market_map(
            evidence['serp_rows'],
            evidence.get('target_domain', ''),
            evidence.get('ai_observations') or [],
            evidence.get('paid_rows') or [],
        )

    if evidence.get('ai_observations'):
        obs = normalize_observations(evidence['ai_observations'])
        evidence['ai_analysis'] = analyze_observations(obs, evidence.get('target_domain', ''))
        evidence['ai_source_gaps'] = detect_source_gaps(obs, evidence.get('target_domain', ''))

    evidence['topic_map'] = build_topic_map(
        evidence.get('keyword_clusters') or [],
        (evidence.get('crawl') or {}).get('pages', []),
        (evidence.get('entity_graph') or {}).get('entities', []),
    )
    evidence['information_gain'] = score_information_gain(
        (evidence.get('crawl') or {}).get('pages', []),
        evidence.get('competitor_pages', []),
    )
    return evidence


def orchestrate(project_path: str | Path = '.', target_url: str | None = None, *, config_path: str | Path | None = None, root: str | Path = '.search-growth-engine', apply: bool = False, execute: bool = True) -> dict[str, Any]:
    cfg = _load_config(config_path)
    cfg.apply = bool(apply)
    if apply:
        cfg.dry_run = False

    project = discover_project(project_path)
    evidence = _collect_local_evidence(project, target_url, cfg)
    evidence = _enrich_local_intelligence(evidence)

    # Strategy is always generated before any implementation decision.
    strategy = build_strategy(evidence)
    plan = build_execution_plan(strategy, str(Path(project_path).resolve()))
    plan['approved'] = bool(apply)

    execution = None
    if execute and strategy.get('opportunities'):
        execution = ExecutionEngine(str(project_path)).apply(plan, apply=apply)

    validation = None
    if cfg.run_validation and cfg.validation_commands:
        validation = ValidationRunner(str(project_path)).run(cfg.validation_commands)

    memory = GrowthMemory(root)
    memory_context = memory.digest()
    run_record = memory.record_run('orchestrator', 'ok', {
        'project_path': str(Path(project_path).resolve()),
        'target_url': target_url,
        'apply': apply,
        'opportunity_count': strategy.get('opportunity_count', 0),
        'execution_mode': 'apply' if apply else 'dry-run',
        'validation_status': (validation or {}).get('status') if validation else None,
    })

    artifact_root = Path(root)
    artifacts = {}
    if cfg.write_artifacts:
        artifact_root.mkdir(parents=True, exist_ok=True)
        artifact_payloads = {
            'project-profile.json': project,
            'evidence.json': evidence,
            'audit.json': evidence.get('audit') or {'findings': []},
            'limitations.json': strategy.get('limitations') or {},
            'strategy.json': strategy,
            'execution-plan.json': plan,
            'execution-report.json': execution,
            'validation-report.json': validation,
            'orchestration-summary.json': {
                'version': '2.0.0',
                'generated_at': _now(),
                'project': project,
                'target_url': target_url,
                'modules': _module_payload(project),
                'memory': memory_context,
                'run_record': run_record,
            },
        }
        for name, payload in artifact_payloads.items():
            if payload is not None:
                path = artifact_root / name
                path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding='utf-8')
                artifacts[name] = str(path)

    return {
        'version': '2.0.0',
        'status': 'completed',
        'generated_at': _now(),
        'project': project,
        'target_url': target_url,
        'modules': _module_payload(project),
        'evidence': evidence,
        'strategy': strategy,
        'execution_plan': plan,
        'execution': execution,
        'validation': validation,
        'growth_memory': memory_context,
        'artifacts': artifacts,
    }
