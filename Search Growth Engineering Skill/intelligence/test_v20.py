from __future__ import annotations

import json
from pathlib import Path

from .orchestrator import orchestrate


def _make_project(tmp_path: Path) -> tuple[Path, str]:
    root = tmp_path / 'project'
    root.mkdir()
    (root / 'package.json').write_text(json.dumps({'dependencies': {'next': 'latest'}}), encoding='utf-8')
    (root / 'README.md').write_text('SaaS pricing dashboard', encoding='utf-8')
    return root, 'https://example.com'


def test_orchestrator_produces_core_artifacts(tmp_path):
    root, url = _make_project(tmp_path)
    out = tmp_path / '.search-growth-engine'
    result = orchestrate(root, url, root=out)
    assert result['version'] == '2.0.0'
    assert 'project' in result and 'evidence' in result and 'strategy' in result
    assert (out / 'project-profile.json').exists()
    assert (out / 'orchestration-summary.json').exists()


def test_orchestrator_is_dry_run_by_default(tmp_path):
    root, url = _make_project(tmp_path)
    before = sorted(p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file())
    orchestrate(root, url, root=tmp_path / '.search-growth-engine')
    after = sorted(p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file())
    assert before == after


def test_orchestrator_approved_apply_still_requires_supported_operations(tmp_path):
    root, url = _make_project(tmp_path)
    result = orchestrate(root, url, root=tmp_path / '.search-growth-engine', apply=True)
    assert result['execution_plan']['approved'] is True
    assert result['execution'] is not None


def test_orchestrator_records_memory_run(tmp_path):
    root, url = _make_project(tmp_path)
    out = tmp_path / '.search-growth-engine'
    result = orchestrate(root, url, root=out)
    assert result['growth_memory'] is not None
    assert (out / 'growth-memory.json').exists()
