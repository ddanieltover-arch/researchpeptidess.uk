from __future__ import annotations

import json
from pathlib import Path

from connectors.protocol import Connector
from connectors.secrets import MemoryBackend, SecretsManager
from connectors.seo.screamingfrog import ScreamingFrogConnector
from intelligence.audit.technical import audit_crawl
from intelligence.discovery.modules import module_gates, select_modules
from intelligence.discovery.project import discover_project
from intelligence.entities.jsonld import entities_from_jsonld
from intelligence.strategy import build_strategy, search_data_status
from reporting import canonical_report_model, generate_report, load_workspace_report_evidence, render_markdown
from sge.orchestrator import orchestrate_platform
from workspaces import WorkspaceManager


def _agency_fixture(root: Path) -> Path:
    (root / 'app' / 'services').mkdir(parents=True)
    (root / 'app' / 'contact').mkdir(parents=True)
    (root / 'lib').mkdir(parents=True)
    (root / 'content').mkdir(parents=True)
    (root / 'package.json').write_text(json.dumps({
        'name': 'el-hub-ventures',
        'dependencies': {'next': '15.0.0', 'react': '19.0.0'},
    }), encoding='utf-8')
    (root / 'app' / 'page.tsx').write_text('export default function Home() { return <main>EL-HUB VENTURES</main> }', encoding='utf-8')
    (root / 'app' / 'services' / 'page.tsx').write_text('export default function Services() { return <h1>Services</h1> }', encoding='utf-8')
    (root / 'app' / 'contact' / 'page.tsx').write_text('export default function Contact() { return <h1>Contact</h1> }', encoding='utf-8')
    (root / 'lib' / 'site.ts').write_text(
        """
export const site = {
  name: 'EL-HUB VENTURES',
  description: 'A digital agency providing professional services, web and mobile engineering, and a growth + SEO retainer.',
  address: { streetAddress: '1 Example Street', postalCode: 'EC1A 1AA', addressLocality: 'London' },
};
""",
        encoding='utf-8',
    )
    (root / 'content' / 'services.ts').write_text(
        """
export const services = [
  { title: 'Flutter apps', body: 'We build Flutter and React Native apps for clients.' },
  { title: 'Ecommerce', body: 'We implement Shopify marketplace and ecommerce storefronts.' },
];
""",
        encoding='utf-8',
    )
    (root / 'content' / 'case-studies.ts').write_text(
        "export const cases = [{ tech: 'flutter', marketplace: true, ecommerce: true }];",
        encoding='utf-8',
    )
    (root / 'README.md').write_text('EL-HUB VENTURES is a digital agency.', encoding='utf-8')
    return root


def test_agency_classification_ignores_client_tech_tokens(tmp_path):
    profile = discover_project(_agency_fixture(tmp_path / 'agency'))
    types = set(profile['project_types'])
    assert 'b2b-service' in types
    assert 'professional-services' in types
    assert 'local-business' in types
    assert 'ecommerce' not in types
    assert 'marketplace' not in types
    assert 'saas' not in types
    assert 'mobile-app' not in types
    assert 'Flutter' not in profile['frameworks']
    assert 'Next.js' in profile['frameworks']
    layers = profile['classification_layers']
    assert 'flutter' in layers['client_case_study_technology'] or 'flutter' in ' '.join(layers['business_offering'])
    modules = set(profile['activated_modules'])
    assert 'ecommerce' not in modules
    assert 'marketplace' not in modules
    assert 'aso' not in modules
    assert 'programmatic-seo' not in modules
    assert 'sem' not in modules
    assert 'mobile-app' not in modules
    assert 'technical-seo' in modules
    assert 'local-seo' in modules


def test_module_gates_require_evidence_thresholds():
    empty = {'project_types': ['general-web-or-software-project'], 'classification_layers': {}}
    gates = module_gates(empty)
    assert gates['ecommerce']['active'] is False
    assert gates['aso']['active'] is False
    assert gates['marketplace']['active'] is False
    assert gates['sem']['active'] is False
    aso = module_gates({
        'project_types': ['mobile-app'],
        'classification_layers': {'app_store_urls': ['https://apps.apple.com/app/id1']},
    })
    assert aso['aso']['active'] is True
    sem = module_gates(empty, ads_connected=True)
    assert sem['sem']['active'] is True
    assert 'ecommerce' not in select_modules(empty)


def test_pdf_is_not_audited_as_html():
    result = audit_crawl({'start_url': 'https://example.com/', 'pages': [
        {
            'url': 'https://example.com/deck.pdf',
            'final_url': 'https://example.com/deck.pdf',
            'content_type': 'application/pdf',
            'document_class': 'pdf',
            'status': 200,
            'title': None,
            'h1_count': 0,
            'internal_links': [],
        }
    ]})
    types = {row['type'] for row in result['findings']}
    assert 'CRAWLABLE_DOCUMENT' in types
    assert 'MISSING_TITLE' not in types
    assert 'H1_COUNT' not in types
    assert 'MISSING_META_DESCRIPTION' not in types


def test_duplicate_titles_use_final_identity_not_request_url():
    identity = 'https://www.example.com/foo'
    result = audit_crawl({'start_url': 'https://example.com/foo.html', 'pages': [
        {
            'url': 'https://example.com/foo.html',
            'requested_url': 'https://example.com/foo.html',
            'final_url': identity,
            'canonical': identity,
            'identity_url': identity,
            'title': 'Foo',
            'document_class': 'html',
            'status': 200,
            'h1_count': 1,
            'word_count': 400,
            'body_word_count': 400,
            'internal_links': [],
        },
        {
            'url': 'https://example.com/foo',
            'requested_url': 'https://example.com/foo',
            'final_url': identity,
            'canonical': identity,
            'identity_url': identity,
            'title': 'Foo',
            'document_class': 'redirect-alias',
            'status': 200,
            'h1_count': 1,
            'word_count': 400,
            'internal_links': [],
        },
    ]})
    types = {row['type'] for row in result['findings']}
    assert 'DUPLICATE_TITLE' not in types


def test_insufficient_search_data_does_not_promote_alt_text():
    evidence = {
        'crawl': {'pages': [{'url': 'https://example.com/', 'title': 'Home', 'word_count': 400}]},
        'audit': {'findings': [
            {'type': 'MISSING_IMAGE_ALT', 'message': 'alt missing', 'url': 'https://example.com/', 'business_value': 0.25, 'confidence': 0.9, 'priority': 'P2'},
            {'type': 'SITEWIDE_MISSING_IMAGE_ALT', 'message': 'many alts', 'url': 'https://example.com/', 'business_value': 0.3, 'confidence': 0.85, 'priority': 'P2'},
            {'type': 'CRAWLABLE_DOCUMENT', 'message': 'PDF discovered', 'url': 'https://example.com/a.pdf', 'business_value': 0.55, 'confidence': 0.95, 'priority': 'P2'},
        ]},
    }
    strategy = build_strategy(evidence)
    assert search_data_status(evidence) == 'insufficient'
    assert strategy['search_data_status'] == 'insufficient'
    types = {row['type'] for row in strategy['opportunities']}
    assert 'required-data' in types
    assert 'MISSING_IMAGE_ALT' not in types
    assert 'SITEWIDE_MISSING_IMAGE_ALT' not in types
    assert strategy['required_data']
    assert strategy['unknown_opportunities']
    assert 'Discovery-constrained' in strategy['provisional_strategy']
    assert strategy['version'] == '2.1.2'


def test_keyword_clusters_still_create_content_gaps():
    strategy = build_strategy({
        'keyword_clusters': [{
            'cluster_id': 'c1',
            'keywords': ['web design company'],
            'representative': 'web design company',
            'intent': 'commercial-investigation',
        }],
        'crawl': {'pages': [{'url': 'https://example.com/', 'title': 'Home', 'word_count': 200}]},
    })
    assert strategy['search_data_status'] == 'available'
    assert any(row['type'] == 'content-gap' for row in strategy['opportunities'])


def test_jsonld_builds_entity_graph():
    graph = entities_from_jsonld([
        {'@type': 'Organization', 'name': 'EL-HUB VENTURES'},
        {'@type': 'Person', 'name': 'Ada Example', 'worksFor': {'name': 'EL-HUB VENTURES'}},
        {'@type': 'FAQPage', 'name': 'Services FAQ'},
        {'@type': 'BlogPosting', 'headline': 'Case study'},
    ])
    types = {row['type'] for row in graph['entities']}
    names = {row['name'] for row in graph['entities']}
    assert 'Organization' in types
    assert 'Person' in types
    assert 'Article' in types
    assert 'FAQ' in types
    assert 'EL-HUB VENTURES' in names
    assert any(rel['type'] == 'works_for' for rel in graph['relationships'])


def test_screaming_frog_is_not_ready_without_export_path():
    conn = ScreamingFrogConnector(secrets=SecretsManager(backends=[MemoryBackend({})]))
    assert isinstance(conn, Connector)
    assert conn.validate().ok is False
    readiness = conn.readiness()
    assert readiness['installed'] is True
    assert readiness['configured'] is False
    assert readiness['ready'] is False
    assert 'SCREAMINGFROG_EXPORT_PATH' in readiness['missing']


def test_audit_mode_persists_engine_artifacts(tmp_path):
    project = tmp_path / 'project'
    project.mkdir()
    (project / 'README.md').write_text('Digital agency professional services', encoding='utf-8')
    result = orchestrate_platform(
        'client-a',
        project_path=project,
        workspaces_root=tmp_path / 'workspaces',
        mode='audit',
        report=False,
        secrets=SecretsManager(backends=[MemoryBackend({})]),
    )
    ws_root = tmp_path / 'workspaces' / 'client-a'
    assert (ws_root / 'engine' / 'project-profile.json').exists()
    assert (ws_root / 'engine' / 'evidence.json').exists()
    assert (ws_root / 'engine' / 'audit.json').exists()
    assert (ws_root / 'engine' / 'limitations.json').exists()
    assert result['artifacts']['engine/evidence.json']


def test_report_model_has_target_and_priorities(tmp_path):
    manager = WorkspaceManager(tmp_path / 'workspaces')
    ws = manager.ensure('client-a', config={'target_url': 'https://www.elhubventures.com'})
    ws.write_json('engine/strategy.json', {
        'opportunities': [{'title': 'Connect Google Search Console', 'type': 'required-data', 'priority_score': 91}],
        'top_opportunities': [{'title': 'Connect Google Search Console', 'type': 'required-data', 'priority_score': 91}],
        'search_data_status': 'insufficient',
        'provisional_strategy': 'Discovery-constrained',
        'limitations': {'search_data_status': 'insufficient'},
    })
    ws.write_json('engine/evidence.json', {'target_url': 'https://www.elhubventures.com', 'crawl': {'pages': []}})
    ws.write_json('orchestration-summary.json', {'workspace': {'client_id': 'client-a'}})
    evidence = load_workspace_report_evidence(ws)
    model = canonical_report_model(evidence)
    assert model['target_url'] == 'https://www.elhubventures.com'
    assert model['priorities']
    assert model['workspace'] == 'client-a'
    markdown = render_markdown('executive', evidence)
    assert 'Target: https://www.elhubventures.com' in markdown
    payload = generate_report('executive', evidence, formats=['json', 'markdown'])
    assert payload['formats']['json']['target_url'] == 'https://www.elhubventures.com'
    assert payload['formats']['json']['priorities']
