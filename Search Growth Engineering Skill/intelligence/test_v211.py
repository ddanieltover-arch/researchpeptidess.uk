from __future__ import annotations

from connectors import ConnectorRegistry
from connectors.certify import CERT_STEPS
from connectors.retry import is_transient, sanitize_error, with_retry
from connectors.protocol import ConnectorError
from connectors.secrets import MemoryBackend, SecretsManager
from intelligence.provenance import provenance, stamp
from intelligence.ai_search.observe import observe_ai_search
from sge.modes import resolve_mode
from sge.orchestrator import orchestrate_platform
from workspaces import IsolationError, WorkspaceManager
from .pilots import (
    PILOT_CLIENTS,
    REGRESSION_FLOOR,
    SCORECARD_AREAS,
    compare_baselines,
    count_regression_tests,
    empty_baseline,
    override_rate,
)


def test_connector_certification_contract():
    registry = ConnectorRegistry(secrets=SecretsManager(backends=[MemoryBackend({})]))
    cert = registry.certify('gsc')
    assert set(cert['steps']) == set(CERT_STEPS)
    assert cert['connector'] == 'gsc'
    assert cert['status'] == 'unconfigured'
    assert cert['records'] is None
    assert cert['last_sync'] == ''
    assert 'search-analytics' in cert['capabilities']
    frog = registry.certify('screamingfrog')
    assert frog['status'] == 'unconfigured'
    assert frog['readiness']['ready'] is False
    assert frog['readiness']['installed'] is True
    assert all(frog['steps'][name]['ok'] for name in CERT_STEPS)


def test_retry_recovers_and_sanitizes_secrets():
    calls = {'n': 0}

    def flaky():
        calls['n'] += 1
        if calls['n'] < 3:
            raise ConnectorError('HTTP 503 Bearer super-secret-token failed')
        return 'ok'

    assert with_retry(flaky, attempts=3, delay_s=0) == 'ok'
    assert calls['n'] == 3
    assert is_transient(ConnectorError('HTTP 429 slow down'))
    assert '[redacted]' in sanitize_error('Authorization Bearer abc.def')
    recovered = ConnectorRegistry(secrets=SecretsManager(backends=[MemoryBackend({})])).certify('gsc', retry_probe=True)
    assert recovered['steps']['retry']['recovered'] is True


def test_evidence_provenance_types():
    observed = provenance('google_search_console', evidence_type='observed')
    assert observed['source'] == 'google_search_console'
    assert observed['confidence'] == 1.0
    inferred = stamp({'title': 'Create a page'}, 'sgos.strategy', evidence_type='inferred')
    assert inferred['evidence_type'] == 'inferred'
    assert inferred['provenance']['evidence_type'] == 'inferred'
    ai = observe_ai_search([{'engine': 'chatgpt-search', 'query': 'q', 'citations': [{'domain': 'a.com'}]}])
    assert ai['observations'][0]['evidence_type'] == 'observed'
    assert ai['observations'][0]['source'] == 'chatgpt_search'


def test_workspace_client_a_cannot_read_client_b(tmp_path):
    manager = WorkspaceManager(tmp_path / 'workspaces')
    a = manager.ensure('client-a')
    b = manager.ensure('client-b')
    secret_file = b.write_json('memory/private.json', {'token': 'nope'})
    try:
        a.read_json(secret_file)
        assert False, 'expected IsolationError'
    except IsolationError:
        pass
    try:
        a.resolve('../client-b/memory/private.json')
        assert False, 'expected IsolationError'
    except IsolationError:
        pass
    assert a.read_json('memory/private.json') is None


def test_orchestrator_modes(tmp_path):
    project = tmp_path / 'project'
    project.mkdir()
    (project / 'README.md').write_text('Local services', encoding='utf-8')
    audit = orchestrate_platform(
        'client-a',
        project_path=project,
        workspaces_root=tmp_path / 'workspaces',
        mode='audit',
        report=False,
        secrets=SecretsManager(backends=[MemoryBackend({})]),
    )
    assert audit['mode'] == 'audit'
    assert audit['version'] == '2.1.2'
    assert audit['stages']['analyze']['status'] == 'ok'
    assert audit['stages']['execute']['status'] == 'skipped'
    spec = resolve_mode('growth')
    assert spec['monitor'] is True and spec['recommend'] is True and spec['execute'] is False
    growth = orchestrate_platform(
        'client-a',
        project_path=project,
        workspaces_root=tmp_path / 'workspaces',
        mode='growth',
        report=False,
        secrets=SecretsManager(backends=[MemoryBackend({})]),
    )
    assert growth['stages']['monitor']['status'] in {'ok', 'alert'}
    assert 'recommendations' in growth['stages']['monitor']


def test_override_rate_unknown_when_unreviewed():
    result = override_rate([])
    assert result['reviewed'] == 0
    assert result['overridden'] == 0
    assert result['rate_pct'] is None
    ignored = override_rate([{'id': 'opp-1', 'title': 'placeholder'}])
    assert ignored['rate_pct'] is None


def test_override_rate_computed_when_reviewed():
    result = override_rate([
        {'decision': 'accept'},
        {'decision': 'override'},
        {'decision': 'OVERRIDE'},
        {'decision': 'defer'},
        {'decision': 'pending'},
    ])
    assert result['reviewed'] == 4
    assert result['overridden'] == 2
    assert result['accepted'] == 1
    assert result['deferred'] == 1
    assert result['rate_pct'] == 50.0


def test_compare_baselines_is_correlation_only():
    before = empty_baseline()
    after = empty_baseline()
    after['metrics']['organic_clicks'] = 150
    before['metrics']['organic_clicks'] = 100
    result = compare_baselines(before, after)
    assert result['causal_claim'] == 'correlation_only'
    clicks = next(row for row in result['changes'] if row['metric'] == 'organic_clicks')
    assert clicks['delta'] == 50
    missing = next(row for row in result['changes'] if row['metric'] == 'revenue')
    assert missing['delta'] is None
    assert missing['previous'] is None


def test_regression_floor_is_preserved():
    assert REGRESSION_FLOOR == 54
    assert count_regression_tests() >= REGRESSION_FLOOR


def test_pilot_clients_cover_four_project_types():
    ids = [row['workspace'] for row in PILOT_CLIENTS]
    assert ids == ['vees-airbnb', 'couples-retreat', 'moore-business', 'research-peptides-uk']
    assert set(SCORECARD_AREAS) == {
        'classification', 'technical', 'search', 'content', 'competitors',
        'geo_aio', 'prioritization', 'implementation', 'reporting', 'efficiency',
    }
