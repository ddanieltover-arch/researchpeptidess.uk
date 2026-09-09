from __future__ import annotations

from pathlib import Path
from typing import Any

from intelligence.storage.json_store import write_json


def snapshot_id(query: str, location: str, device: str, date: str) -> str:
    key = '|'.join([query.strip().lower(), location or '', device or '', date or ''])
    return hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]


def persist_live_serp(snapshot: dict[str, Any], raw: Any | None, root: str | Path) -> dict[str, str]:
    base = Path(root)
    live = base / 'intelligence' / 'live-serp'
    raw_dir = live / 'raw'
    live.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)
    ident = snapshot_id(snapshot.get('query', ''), snapshot.get('location', ''), snapshot.get('device', ''), snapshot.get('date', ''))
    derived = live / f"{snapshot.get('date', 'undated')}-{ident}.json"
    raw_path = raw_dir / f"{snapshot.get('date', 'undated')}-{ident}.json"
    write_json(derived, snapshot)
    if raw is not None:
        write_json(raw_path, raw)
    return {'snapshot': str(derived), 'raw': str(raw_path) if raw is not None else ''}
