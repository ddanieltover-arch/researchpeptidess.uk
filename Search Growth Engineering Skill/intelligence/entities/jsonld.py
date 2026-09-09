from __future__ import annotations

from typing import Any


SCHEMA_TO_ENTITY = {
    "organization": "Organization",
    "professionalservice": "Organization",
    "localbusiness": "Organization",
    "corporation": "Organization",
    "brand": "Brand",
    "person": "Person",
    "service": "Service",
    "product": "Product",
    "place": "Location",
    "postaladdress": "Location",
    "city": "Location",
    "country": "Location",
    "blogposting": "Article",
    "article": "Article",
    "faqpage": "FAQ",
    "question": "FAQ",
}


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _walk(payload: Any) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    if isinstance(payload, list):
        for item in payload:
            nodes.extend(_walk(item))
        return nodes
    if not isinstance(payload, dict):
        return nodes
    nodes.append(payload)
    if "@graph" in payload:
        nodes.extend(_walk(payload["@graph"]))
    return nodes


def _name_of(node: dict[str, Any]) -> str:
    for key in ("name", "headline", "legalName"):
        value = node.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict) and value.get("name"):
            return str(value["name"]).strip()
    return ""


def _types_of(node: dict[str, Any]) -> list[str]:
    raw = node.get("@type")
    return [str(item) for item in _as_list(raw) if item]


def entities_from_jsonld(blocks: list[Any] | None) -> dict[str, Any]:
    entities: list[dict[str, Any]] = []
    relationships: list[dict[str, str]] = []
    people: list[str] = []
    orgs: list[str] = []
    seen: set[tuple[str, str]] = set()
    for node in _walk(blocks or []):
        name = _name_of(node)
        for schema_type in _types_of(node):
            mapped = SCHEMA_TO_ENTITY.get(schema_type.lower())
            if not mapped or not name:
                continue
            key = (mapped, name.lower())
            if key in seen:
                continue
            seen.add(key)
            if mapped not in {"Brand", "Organization", "Person", "Product", "Service", "Location", "Article", "FAQ"}:
                continue
            entities.append({"name": name, "type": mapped, "schema_type": schema_type})
            if mapped == "Person":
                people.append(name)
            if mapped == "Organization":
                orgs.append(name)
            employee = node.get("worksFor") or node.get("affiliation")
            if mapped == "Person" and isinstance(employee, dict) and _name_of(employee):
                relationships.append({"from": name, "to": _name_of(employee), "type": "works_for"})
            if mapped == "Person" and isinstance(employee, str) and employee.strip():
                relationships.append({"from": name, "to": employee.strip(), "type": "works_for"})

    collisions = detect_person_collisions(entities, blocks or [])
    return {"entities": entities, "relationships": relationships, "collisions": collisions, "people": people, "organizations": orgs}


def detect_person_collisions(entities: list[dict[str, Any]], blocks: list[Any]) -> list[dict[str, Any]]:
    """Flag the same person name used in multiple unrelated roles (staff vs review vs client)."""
    roles: dict[str, set[str]] = {}
    for entity in entities:
        if entity.get("type") != "Person":
            continue
        roles.setdefault(entity["name"].lower(), set()).add(str(entity.get("schema_type") or "Person"))
    for node in _walk(blocks):
        for field in ("author", "reviewer", "creator"):
            value = node.get(field)
            for item in _as_list(value):
                name = item if isinstance(item, str) else _name_of(item) if isinstance(item, dict) else ""
                if name:
                    roles.setdefault(name.lower(), set()).add(field)
        review = node.get("review")
        for item in _as_list(review):
            if not isinstance(item, dict):
                continue
            author = item.get("author")
            name = author if isinstance(author, str) else _name_of(author) if isinstance(author, dict) else ""
            if name:
                roles.setdefault(name.lower(), set()).add("review_author")
    collisions = []
    for name, found in roles.items():
        if len(found) >= 2 and ("review_author" in found or "author" in found) and "Person" in found:
            collisions.append({
                "name": name,
                "roles": sorted(found),
                "message": "The same person name appears as staff and as a review/testimonial author. Verify this is not an entity collision.",
            })
    return collisions


def entities_from_crawl(pages: list[dict[str, Any]] | None) -> dict[str, Any]:
    blocks: list[Any] = []
    for page in pages or []:
        blocks.extend(page.get("jsonld") or [])
    return entities_from_jsonld(blocks)
