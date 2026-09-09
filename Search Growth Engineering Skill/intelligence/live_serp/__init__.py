from __future__ import annotations

from typing import Any

from .normalize import normalize_live_serp
from .store import persist_live_serp


def collect_live_serp(
    query: str,
    *,
    location: str | None = None,
    device: str | None = None,
    country: str | None = None,
    language: str | None = None,
    limit: int = 100,
    workspace: str | None = None,
    store_root: str | None = None,
    registry=None,
) -> dict[str, Any]:
    from connectors import ConnectorRegistry
    registry = registry or ConnectorRegistry()
    sync = registry.sync(
        'serpapi',
        query=query,
        country=country or location,
        language=language,
        limit=min(int(limit), 100),
    )
    if sync.status != 'ok' or not sync.evidence:
        return {
            'status': sync.status,
            'query': query,
            'location': location or '',
            'device': device or '',
            'date': '',
            'results': [],
            'notes': sync.notes + ['Live SERP collection did not fabricate rankings.'],
            'sync': sync.to_dict(),
        }
    snapshot = normalize_live_serp(
        sync.evidence,
        query=query,
        location=location or country,
        device=device,
        collected_at=sync.collected_at,
        source=sync.source,
    )
    snapshot['status'] = 'ok'
    root = store_root
    if workspace and not root:
        from workspaces import WorkspaceManager
        root = str(WorkspaceManager().get(workspace).root)
    if root:
        snapshot['artifacts'] = persist_live_serp(snapshot, sync.evidence, root)
    return snapshot
