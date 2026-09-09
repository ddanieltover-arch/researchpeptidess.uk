from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
import json
from typing import Any

class BaselineManager:
    def __init__(self, root: str = '.search-growth-engine'):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.path = self.root / 'baseline.json'

    def load(self) -> dict[str, Any]:
        if not self.path.exists():
            return {'version': 1, 'snapshots': []}
        return json.loads(self.path.read_text(encoding='utf-8'))

    def save_snapshot(self, metrics: dict[str, Any], label: str = 'snapshot') -> dict[str, Any]:
        data = self.load()
        snap = {
            'id': f"snap-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
            'label': label,
            'collected_at': datetime.now(timezone.utc).isoformat(),
            'metrics': metrics,
        }
        data.setdefault('snapshots', []).append(snap)
        self.path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
        return snap

    def compare_latest(self, current: dict[str, Any]) -> dict[str, Any]:
        data = self.load(); snaps = data.get('snapshots', [])
        if not snaps:
            return {'has_baseline': False, 'changes': []}
        previous = snaps[-1].get('metrics', {})
        changes=[]
        keys=set(previous) | set(current)
        for key in sorted(keys):
            a,b=previous.get(key),current.get(key)
            if isinstance(a,(int,float)) and isinstance(b,(int,float)):
                delta=b-a
                pct=(delta/a*100) if a else None
                changes.append({'metric':key,'previous':a,'current':b,'delta':delta,'percent_change':pct})
            elif a != b:
                changes.append({'metric':key,'previous':a,'current':b,'delta':'changed'})
        return {'has_baseline': True, 'previous_collected_at': snaps[-1].get('collected_at'), 'changes': changes}
