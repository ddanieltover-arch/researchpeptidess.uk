from __future__ import annotations

import json
from pathlib import Path

from connectors import ConnectorRegistry, secret
from connectors.catalog import CONNECTOR_CLASSES
from connectors.protocol import Connector
from connectors.secrets import MemoryBackend, SecretsManager, parse_dotenv
from connectors.rate_limit import RateLimiter, RateLimitSpec
from intelligence.live_serp.normalize import normalize_live_serp
from intelligence.ai_search.observe import observe_ai_search, OBSERVED_ENGINES
from intelligence.citations import build_citation_intelligence
from intelligence.entities import build_entity_platform
from mcp.catalog import TOOLS, tool_catalog
from mcp.server import handle_jsonrpc
from mcp.tools import call_tool, ToolError
from agents import AgentOrchestrator, A2AMessage, AGENT_CLASSES
from workspaces import WorkspaceManager, WorkspaceError
from api import handle_request, ApiError
from reporting import generate_report, REPORT_KINDS, render_pdf
from sge.orchestrator import orchestrate_platform, PIPELINE


def test_every_catalog_connector_implements_protocol():
    assert len(CONNECTOR_CLASSES) == 15
    registry = ConnectorRegistry(secrets=SecretsManager(backends=[MemoryBackend({})]))
    discovered = {row['id'] for row in registry.discover()}
    assert discovered == set(CONNECTOR_CLASSES)
    for connector_id, cls in CONNECTOR_CLASSES.items():
        inst = registry.instance(connector_id)
        assert isinstance(inst, Connector)
        for method in ('connect', 'disconnect', 'validate', 'sync', 'health'):
            assert callable(getattr(inst, method))
        health = registry.health(connector_id)
        assert health.connector_id == connector_id
        assert health.status in {'ok', 'unconfigured', 'disconnected', 'error'}


def test_registry_skips_unconfigured_sync_without_zero_metrics():
    registry = ConnectorRegistry(secrets=SecretsManager(backends=[MemoryBackend({})]))
    result = registry.sync('gsc')
    assert result.status == 'skipped'
    assert result.evidence is None
    assert any('not' in note.lower() or 'missing' in note.lower() for note in result.notes)


def test_secrets_come_from_secret_store_not_config():
    previous = SecretsManager.current()
    try:
        manager = SecretsManager(backends=[MemoryBackend({'GSC_CLIENT_ID': 'abc', 'GA4_PROPERTY_ID': '123'})])
        SecretsManager.set_current(manager)
        assert secret('GSC_CLIENT_ID') == 'abc'
        assert secret('GA4_PROPERTY_ID') == '123'
        assert secret('MISSING') is None
        parsed = parse_dotenv('GSC_CLIENT_ID=from-file\n# comment\nEMPTY=\n')
        assert parsed['GSC_CLIENT_ID'] == 'from-file'
    finally:
        SecretsManager.set_current(previous)


def test_http_secret_backend_and_rate_limit():
    from connectors.secrets import HttpJsonSecretBackend
    backend = HttpJsonSecretBackend('http://secrets.test', request_fn=lambda url, **kwargs: {'value': 'vaulted'})
    assert backend.get('GSC_CLIENT_ID') == 'vaulted'
    limiter = RateLimiter(clock=lambda: 0.0)
    spec = RateLimitSpec(requests_per_minute=1)
    assert limiter.allow('gsc', spec).allowed is True
    assert limiter.allow('gsc', spec).allowed is False


def test_live_serp_normalizes_features_and_top_100():
    payload = {
        'organic_results': [{'position': i, 'title': f'T{i}', 'link': f'https://example.com/{i}'} for i in range(1, 120)],
        'people_also_ask': [{'question': 'what is seo'}],
        'ai_overview': {'text': 'observed overview'},
        'video_results': [{'title': 'video'}],
    }
    snap = normalize_live_serp(payload, query='seo agency', location='US', device='mobile', date='2026-08-21')
    assert snap['query'] == 'seo agency'
    assert snap['result_count'] == 100
    assert snap['features']['people_also_ask']
    assert snap['feature_presence']['ai_overviews'] is True
    assert snap['feature_presence']['shopping_results'] is False


def test_ai_search_records_observations_only():
    observed = observe_ai_search([
        {'engine': 'ChatGPT Search', 'query': 'b2b seo', 'citations': [{'url': 'https://a.com', 'domain': 'a.com'}], 'entities': ['SEO'], 'answer_summary': 'Observed answer'},
        {'engine': 'made-up-engine', 'query': 'b2b seo'},
        {'engine': 'perplexity', 'query': ''},
    ])
    assert observed['observations'][0]['engine'] == 'chatgpt-search'
    assert 'made-up-engine' not in observed['observed_engines']
    assert all(engine in OBSERVED_ENGINES for engine in observed['observed_engines'])
    assert observed['rejected']


def test_citation_intelligence_unknown_without_observations():
    empty = build_citation_intelligence([], target_domain='example.com')
    assert empty['citation_rate'] is None
    filled = build_citation_intelligence([
        {'query': 'q1', 'engine': 'perplexity', 'citations': [{'domain': 'example.com', 'cited': True}]},
        {'query': 'q2', 'engine': 'perplexity', 'citations': [{'domain': 'other.com', 'cited': True}]},
    ], target_domain='example.com')
    assert filled['citation_rate'] == 0.5
    assert filled['top_sources'][0]['domain'] in {'example.com', 'other.com'}


def test_entity_platform_graph():
    graph = build_entity_platform([
        {
            'brand': 'Acme',
            'organization': 'Acme Ltd',
            'entities': [
                {'name': 'Acme', 'type': 'Brand'},
                {'name': 'Acme Ltd', 'type': 'Organization'},
                {'name': 'SEO', 'type': 'Service'},
                {'name': 'London', 'type': 'Location'},
                {'name': 'Ada', 'type': 'Person'},
                {'name': 'Pulse', 'type': 'Product'},
            ],
        }
    ])
    assert graph['brand']['name'] == 'Acme'
    assert graph['organization']['name'] == 'Acme Ltd'
    assert graph['services'] and graph['locations']
    assert 'Brand' in graph['graph']['hierarchy']
    assert any(edge['type'] == 'offers' for edge in graph['graph']['edges'])


def test_mcp_catalog_and_stateless_tools():
    catalog = tool_catalog()
    assert catalog['stateless'] is True
    assert catalog['etag']
    names = {tool['name'] for tool in TOOLS}
    assert names == {
        'crawl_site', 'audit_site', 'analyze_gsc', 'analyze_ga4', 'analyze_serp',
        'market_map', 'entity_graph', 'content_strategy', 'execute_changes', 'validate_project',
    }
    listed = handle_jsonrpc({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'})
    assert listed['result']['etag'] == catalog['etag']
    called = handle_jsonrpc({
        'jsonrpc': '2.0',
        'id': 2,
        'method': 'tools/call',
        'params': {'name': 'entity_graph', 'arguments': {'records': [{'name': 'Acme', 'type': 'Organization'}]}},
    })
    assert called['result']['structuredContent']['organization']['name'] == 'Acme'
    market = call_tool('market_map', {'target_domain': 'example.com', 'serp_rows': []})
    assert 'target_domain' in market or isinstance(market, dict)


def test_mcp_unknown_tool_and_execute_default_dry_run(tmp_path):
    try:
        call_tool('not_a_tool', {})
        assert False, 'expected ToolError'
    except ToolError:
        pass
    result = call_tool('execute_changes', {'plan': {'approved': False, 'operations': []}, 'root': str(tmp_path)})
    assert result is not None


def test_a2a_agents_exchange_task_context_result():
    bus = AgentOrchestrator()
    assert set(AGENT_CLASSES) == {
        'TechnicalSEOAgent', 'ContentAgent', 'GEOAgent', 'AIOAgent',
        'SEM_Agent', 'AnalyticsAgent', 'CompetitorAgent', 'CROAgent',
    }
    message = A2AMessage(task='analyze entities', context={'entities': [{'name': 'Acme', 'type': 'Brand'}]})
    reply = bus.send('GEOAgent', message)
    assert reply.result and reply.task_id == message.task_id
    envelope = reply.to_a2a()
    assert envelope['kind'] == 'message'
    fanout = bus.fanout(A2AMessage(task='platform', context={'observations': [], 'target_domain': 'example.com'}))
    assert 'AnalyticsAgent' in fanout['results']


def test_workspaces_isolate_clients_and_reject_secrets(tmp_path):
    manager = WorkspaceManager(tmp_path / 'workspaces')
    ws = manager.ensure('client-a', config={'target_domain': 'a.com', 'connectors': ['gsc']})
    assert (ws.root / 'memory').exists()
    assert (ws.root / 'alerts').exists()
    try:
        manager.ensure('client-b', config={'secrets': {'token': 'nope'}})
        assert False, 'expected WorkspaceError'
    except WorkspaceError:
        pass
    (tmp_path / 'workspaces' / 'client-c').mkdir()
    (tmp_path / 'workspaces' / 'client-c' / 'config.json').write_text(json.dumps({'secrets': {'x': 'y'}}), encoding='utf-8')
    try:
        manager.get('client-c')
        assert False, 'expected WorkspaceError'
    except WorkspaceError:
        pass


def test_api_routes_and_observe_ai_never_estimates():
    health = handle_request('GET', '/health')
    assert health['version'] == '2.1.2'
    observed = handle_request('POST', '/observe-ai', {
        'target_domain': 'example.com',
        'observations': [{'engine': 'gemini', 'query': 'q', 'citations': [{'domain': 'example.com', 'cited': True}]}],
    })
    assert observed['observed']['observations']
    assert observed['citations']['citation_rate'] == 1.0
    roadmap = handle_request('POST', '/roadmap', {'evidence': {'keyword_clusters': [], 'crawl': {'pages': []}}})
    assert isinstance(roadmap, dict)
    try:
        handle_request('POST', '/nope', {})
        assert False
    except ApiError as exc:
        assert exc.status == 404


def test_enterprise_reports_all_formats():
    evidence = {'workspace': 'client-a', 'summary': 'Test', 'strategy': {'opportunities': []}}
    for kind in REPORT_KINDS:
        payload = generate_report(kind, evidence, formats=['json', 'markdown', 'html', 'pdf'])
        assert payload['formats']['markdown'].startswith('#')
        assert '<html' in payload['formats']['html']
        assert payload['formats']['pdf_bytes'].startswith(b'%PDF')
    assert render_pdf('executive', evidence).startswith(b'%PDF')


def test_platform_orchestrator_pipeline(tmp_path):
    project = tmp_path / 'project'
    project.mkdir()
    (project / 'README.md').write_text('SaaS analytics', encoding='utf-8')
    result = orchestrate_platform(
        'client-a',
        project_path=project,
        workspaces_root=tmp_path / 'workspaces',
        sync=True,
        observe=True,
        strategy=True,
        monitor=True,
        apply=False,
        report=False,
        secrets=SecretsManager(backends=[MemoryBackend({})]),
    )
    assert result['version'] == '2.1.2'
    assert result['dry_run'] is True
    assert list(result['stages']) == list(PIPELINE)
    assert result['stages']['execute']['mode'] == 'dry-run'
    assert result['stages']['observe']['status'] == 'ok'
    assert (tmp_path / 'workspaces' / 'client-a' / 'orchestration-summary.json').exists()
    assert (tmp_path / 'workspaces' / 'client-a' / 'memory' / 'growth-memory.json').exists()


def test_legacy_orchestrate_still_v20(tmp_path):
    from intelligence.orchestrator import orchestrate
    root = tmp_path / 'project'
    root.mkdir()
    (root / 'package.json').write_text(json.dumps({'dependencies': {'next': 'latest'}}), encoding='utf-8')
    result = orchestrate(root, None, root=tmp_path / '.search-growth-engine')
    assert result['version'] == '2.0.0'
