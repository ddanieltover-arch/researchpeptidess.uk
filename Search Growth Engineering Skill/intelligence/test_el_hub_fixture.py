from __future__ import annotations

import json
from pathlib import Path

import pytest

from intelligence.discovery.project import discover_project

FORBIDDEN_TYPES = {'ecommerce', 'marketplace', 'saas', 'mobile-app', 'documentation'}
FORBIDDEN_MODULES = {'aso', 'ecommerce', 'marketplace', 'programmatic-seo', 'sem', 'mobile-app'}


def _el_hub_root() -> Path | None:
    skill = Path(__file__).resolve().parents[1]
    site = skill.parent
    if (site / 'lib' / 'site.ts').is_file() and (site / 'package.json').is_file():
        return site
    return None


def _expected() -> dict:
    path = Path(__file__).resolve().parents[1] / 'pilots' / 'fixtures' / 'el-hub-ventures' / 'expected.json'
    return json.loads(path.read_text(encoding='utf-8'))


def test_el_hub_repo_classification_fixture():
    root = _el_hub_root()
    if root is None:
        pytest.skip('EL-HUB website root is not adjacent to the skill package')
    expected = _expected()['classification']
    profile = discover_project(root)
    types = set(profile['project_types'])
    assert types == set(expected['project_types'])
    assert profile['business_model'] == expected['business_model']
    assert set(profile['frameworks']) == set(expected['frameworks'])
    assert not (types & set(expected['forbidden_types']))
    assert 'Flutter' not in profile['frameworks']


def test_el_hub_module_gates_fixture():
    root = _el_hub_root()
    if root is None:
        pytest.skip('EL-HUB website root is not adjacent to the skill package')
    expected = _expected()['modules']
    profile = discover_project(root)
    modules = set(profile['activated_modules'])
    assert modules >= set(expected['required_active'])
    assert not (modules & set(expected['forbidden_active']))
    assert not (modules & FORBIDDEN_MODULES)
    assert not (set(profile['project_types']) & FORBIDDEN_TYPES)


def test_el_hub_strategy_invariants_are_frozen():
    path = Path(__file__).resolve().parents[1] / 'pilots' / 'fixtures' / 'el-hub-ventures' / 'v2.1.2-strategy-summary.json'
    if not path.exists():
        pytest.skip('Frozen EL-HUB v2.1.2 strategy summary is missing')
    expected = _expected()['strategy_invariants']
    run = json.loads(path.read_text(encoding='utf-8'))
    assert run['search_data_status'] == expected['search_data_status']
    assert run['required_data'] == expected['required_data']
    assert not set(run['opportunity_types']) & set(expected['forbidden_opportunity_types'])
    assert 'required-data' in run['opportunity_types']
    assert run['technical_findings_count'] > 0
    assert run['lint_in_opportunities'] == []
    assert run['lint_in_roadmap_0_30'] == []
