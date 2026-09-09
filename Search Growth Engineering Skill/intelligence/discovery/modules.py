from __future__ import annotations

import re
from pathlib import Path
from typing import Any

ECOMMERCE_ROUTE_HINTS = ("cart", "checkout", "product", "products", "collection", "collections", "shop")
MARKETPLACE_HINTS = ("sellers", "vendors", "multi-vendor", "marketplace-listing")
APP_STORE_HINTS = ("apps.apple.com", "play.google.com/store", "itunes.apple.com", "app-ads.txt")
SAAS_PRODUCT_HINTS = ("app. ", "/login", "/signup", "workspace", "subscription billing")
PROGRAMMATIC_HINTS = ("[slug]", "[id]", "generateStaticParams", "getstaticpaths")


def _haystack(profile: dict[str, Any], extra: str = "") -> str:
    layers = profile.get("classification_layers") or {}
    parts = [
        extra,
        " ".join(profile.get("project_types") or []),
        " ".join(profile.get("frameworks") or []),
        str(layers.get("identity_text") or ""),
        " ".join(layers.get("app_routes") or []),
        " ".join(layers.get("schema_types") or []),
    ]
    return " ".join(parts).lower()


def _has_any(text: str, needles: tuple[str, ...] | list[str]) -> bool:
    return any(n.lower() in text for n in needles)


def module_gates(profile: dict[str, Any], *, ads_authorized: bool = False, ads_connected: bool = False) -> dict[str, dict[str, Any]]:
    """Activate vertical modules only when evidence thresholds are met."""
    types = set(profile.get("project_types") or [])
    layers = profile.get("classification_layers") or {}
    identity = _haystack(profile)
    offerings = {item.lower() for item in (layers.get("business_offering") or [])}
    routes = " ".join(layers.get("app_routes") or []).lower()
    schema = {item.lower() for item in (layers.get("schema_types") or [])}
    agency = bool(types & {"b2b-service", "professional-services", "agency"})

    def gate(active: bool, reason: str) -> dict[str, Any]:
        return {"active": active, "reason": reason}

    ecommerce = (
        not agency
        and _has_any(routes, ECOMMERCE_ROUTE_HINTS)
        and (_has_any(identity, ("product", "sku", "cart", "checkout")) or "product" in schema or "offer" in schema)
    )
    marketplace = (not agency) and _has_any(identity + " " + routes, MARKETPLACE_HINTS)
    aso = bool(layers.get("app_store_urls")) or _has_any(identity, APP_STORE_HINTS)
    saas = (not agency) and _has_any(routes + identity, ("/login", "/signup", "subscription", "workspace")) and "saas" in types
    programmatic = bool(layers.get("programmatic_templates")) and int(layers.get("indexable_template_estimate") or 0) >= 50
    local = "local-business" in types or bool(layers.get("nap_present"))
    sem = bool(ads_connected or ads_authorized)

    return {
        "technical-seo": gate(True, "Public web property; technical eligibility always in scope."),
        "on-page-seo": gate(True, "HTML documents exist or are expected."),
        "content": gate(True, "Content and intent mapping applies to public sites."),
        "semantic-entity": gate(True, "Entity clarity applies to organizations and services."),
        "geo-aio": gate(True, "Machine-understanding work is an extension of technical and entity foundations."),
        "local-seo": gate(local, "NAP or LocalBusiness evidence present." if local else "No local-business identity or NAP evidence."),
        "ecommerce": gate(ecommerce, "Checkout/product architecture observed." if ecommerce else "No first-party catalog/checkout architecture. Client-delivery ecommerce copy is not enough."),
        "marketplace": gate(marketplace, "Multi-seller architecture observed." if marketplace else "No multi-seller inventory model on this property."),
        "aso": gate(aso, "Store listing or app identifier observed." if aso else "No first-party app store listing."),
        "saas": gate(saas, "First-party product login/subscription surfaces observed." if saas else "SaaS mentioned as a service offering is not SaaS-product SEO."),
        "programmatic-seo": gate(programmatic, "Large repeatable template set observed." if programmatic else "Page volume is not a programmatic SEO system."),
        "sem": gate(sem, "Ads data connected or paid-search strategy authorized." if sem else "Google Ads is not connected and paid search was not authorized."),
        "mobile-app": gate(aso, "ASO/app evidence only." if aso else "Building mobile apps for clients is not ASO."),
    }


def select_modules(profile: dict[str, Any], **kwargs: Any) -> list[str]:
    gates = module_gates(profile, **kwargs)
    profile["module_gates"] = gates
    return sorted(name for name, row in gates.items() if row.get("active"))
