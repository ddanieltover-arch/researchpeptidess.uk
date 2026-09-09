from __future__ import annotations

from typing import Any

ENTITY_TYPES = ('Brand', 'Organization', 'Person', 'Product', 'Service', 'Location')
GRAPH_ORDER = ('Brand', 'Organization', 'Service', 'Location')


def _normalize_entity(item: Any, default_type: str = 'Organization') -> dict[str, Any] | None:
    if isinstance(item, str):
        name = item.strip()
        return {'name': name, 'type': default_type} if name else None
    if not isinstance(item, dict):
        return None
    name = str(item.get('name') or item.get('id') or '').strip()
    if not name:
        return None
    kind = str(item.get('type') or item.get('kind') or default_type)
    kind = next((t for t in ENTITY_TYPES if t.lower() == kind.lower()), kind)
    return {
        'name': name,
        'type': kind,
        'id': item.get('id') or f'{kind}:{name}'.lower(),
        'properties': item.get('properties') or {},
        'same_as': item.get('same_as') or item.get('sameAs') or [],
    }


def build_entity_platform(records: list[Any] | dict[str, Any] | None = None) -> dict[str, Any]:
    raw_records: list[Any]
    if records is None:
        raw_records = []
    elif isinstance(records, dict):
        raw_records = records.get('records') or records.get('entities') or [records]
    else:
        raw_records = list(records)

    nodes: dict[str, dict[str, Any]] = {}
    edges: list[dict[str, str]] = []
    buckets: dict[str, list[dict[str, Any]]] = {kind: [] for kind in ENTITY_TYPES}

    def add_entity(item: Any, default_type: str = 'Organization') -> dict[str, Any] | None:
        entity = _normalize_entity(item, default_type)
        if not entity:
            return None
        key = entity['id']
        if key not in nodes:
            nodes[key] = {**entity, 'sources': []}
            if entity['type'] in buckets:
                buckets[entity['type']].append(nodes[key])
        return nodes[key]

    for record in raw_records:
        if isinstance(record, dict) and any(k in record for k in ('entities', 'relationships', 'brand', 'organization')):
            source = str(record.get('source') or 'project')
            if record.get('brand'):
                add_entity(record['brand'] if not isinstance(record['brand'], str) else {'name': record['brand'], 'type': 'Brand'})
            if record.get('organization'):
                add_entity(record['organization'] if not isinstance(record['organization'], str) else {'name': record['organization'], 'type': 'Organization'})
            for ent in record.get('entities') or []:
                node = add_entity(ent)
                if node and source not in node['sources']:
                    node['sources'].append(source)
            for rel in record.get('relationships') or []:
                if isinstance(rel, dict) and rel.get('from') and rel.get('to'):
                    edges.append({'from': str(rel['from']), 'to': str(rel['to']), 'type': str(rel.get('type') or 'related_to')})
            continue
        add_entity(record)

    brands = buckets['Brand']
    orgs = buckets['Organization']
    if brands and orgs:
        edges.append({'from': brands[0]['name'], 'to': orgs[0]['name'], 'type': 'identifies'})
    for org in orgs:
        for service in buckets['Service']:
            edges.append({'from': org['name'], 'to': service['name'], 'type': 'offers'})
        for location in buckets['Location']:
            edges.append({'from': org['name'], 'to': location['name'], 'type': 'operates_at'})

    unique_edges = []
    seen = set()
    for edge in edges:
        key = (edge['from'], edge['to'], edge['type'])
        if key in seen:
            continue
        seen.add(key)
        unique_edges.append(edge)

    return {
        'brand': brands[0] if brands else None,
        'organization': orgs[0] if orgs else None,
        'services': buckets['Service'],
        'locations': buckets['Location'],
        'people': buckets['Person'],
        'products': buckets['Product'],
        'entities': list(nodes.values()),
        'graph': {
            'nodes': list(nodes.values()),
            'edges': unique_edges,
            'hierarchy': list(GRAPH_ORDER),
        },
        'counts': {kind: len(items) for kind, items in buckets.items()},
    }
