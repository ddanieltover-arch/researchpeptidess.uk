from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json
import uuid


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class GrowthMemory:
    """Persistent, append-only growth ledger for SEO/search operations."""
    def __init__(self, root: str | Path = '.search-growth-engine'):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.path = self.root / 'growth-memory.json'

    def load(self) -> dict[str, Any]:
        if not self.path.exists():
            return {
                'schema_version': '1.5',
                'project': {},
                'snapshots': [],
                'changes': [],
                'experiments': [],
                'insights': [],
                'runs': [],
            }
        return json.loads(self.path.read_text(encoding='utf-8'))

    def save(self, data: dict[str, Any]) -> None:
        tmp = self.path.with_suffix('.tmp')
        tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
        tmp.replace(self.path)

    def record_run(self, kind: str, status: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
        data = self.load()
        row = {'id': f'run-{uuid.uuid4().hex[:12]}', 'kind': kind, 'status': status, 'created_at': _now(), 'details': details or {}}
        data['runs'].append(row)
        self.save(data)
        return row

    def snapshot(self, metrics: dict[str, Any], label: str = 'snapshot', source: str = 'unknown', observed_at: str | None = None) -> dict[str, Any]:
        data = self.load()
        row = {
            'id': f'snap-{uuid.uuid4().hex[:12]}',
            'label': label,
            'source': source,
            'observed_at': observed_at or _now(),
            'recorded_at': _now(),
            'metrics': metrics,
        }
        data['snapshots'].append(row)
        self.save(data)
        return row

    def changes_since(self, current: dict[str, Any], baseline_id: str | None = None) -> dict[str, Any]:
        data = self.load()
        snaps = data.get('snapshots', [])
        if not snaps:
            return {'has_baseline': False, 'baseline_id': None, 'changes': [], 'alerts': []}
        base = next((s for s in snaps if s['id'] == baseline_id), snaps[-1]) if baseline_id else snaps[-1]
        changes = []
        alerts = []
        keys = sorted(set(base.get('metrics', {})) | set(current))
        for key in keys:
            a, b = base.get('metrics', {}).get(key), current.get(key)
            if isinstance(a, (int, float)) and isinstance(b, (int, float)):
                delta = b - a
                pct = (delta / a * 100) if a else None
                changes.append({'metric': key, 'previous': a, 'current': b, 'delta': delta, 'percent_change': pct})
            elif a != b:
                changes.append({'metric': key, 'previous': a, 'current': b, 'delta': 'changed'})
        return {'has_baseline': True, 'baseline_id': base['id'], 'previous_observed_at': base.get('observed_at'), 'changes': changes, 'alerts': alerts}

    def record_change(self, change_type: str, title: str, details: dict[str, Any] | None = None, status: str = 'planned', occurred_at: str | None = None) -> dict[str, Any]:
        data = self.load()
        row = {'id': f'change-{uuid.uuid4().hex[:12]}', 'type': change_type, 'title': title, 'status': status, 'occurred_at': occurred_at or _now(), 'details': details or {}}
        data['changes'].append(row)
        self.save(data)
        return row

    def record_experiment(self, name: str, hypothesis: str, metric: str, baseline: Any = None, status: str = 'planned', details: dict[str, Any] | None = None) -> dict[str, Any]:
        data = self.load()
        row = {
            'id': f'exp-{uuid.uuid4().hex[:12]}', 'name': name, 'hypothesis': hypothesis, 'metric': metric,
            'baseline': baseline, 'status': status, 'started_at': _now(), 'updated_at': _now(), 'details': details or {}
        }
        data['experiments'].append(row)
        self.save(data)
        return row

    def update_experiment(self, experiment_id: str, **updates: Any) -> dict[str, Any]:
        data = self.load()
        for exp in data['experiments']:
            if exp['id'] == experiment_id:
                exp.update(updates); exp['updated_at'] = _now(); self.save(data); return exp
        raise KeyError(f'Experiment not found: {experiment_id}')

    def add_insight(self, statement: str, evidence: list[dict[str, Any]], confidence: float, action: str | None = None) -> dict[str, Any]:
        data = self.load()
        row = {'id': f'insight-{uuid.uuid4().hex[:12]}', 'statement': statement, 'confidence': max(0.0, min(1.0, confidence)), 'evidence': evidence, 'action': action, 'created_at': _now()}
        data['insights'].append(row)
        self.save(data)
        return row

    def digest(self, limit: int = 10) -> dict[str, Any]:
        data = self.load()
        return {
            'latest_snapshot': data['snapshots'][-1] if data['snapshots'] else None,
            'recent_changes': data['changes'][-limit:],
            'active_experiments': [x for x in data['experiments'] if x.get('status') in {'planned', 'running'}],
            'recent_insights': data['insights'][-limit:],
            'recent_runs': data['runs'][-limit:],
        }
