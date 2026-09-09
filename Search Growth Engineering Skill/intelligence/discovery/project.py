from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .modules import select_modules

FRAMEWORK_MARKERS = {
    "Next.js": ["next"],
    "React": ["react"],
    "Vue": ["vue"],
    "Nuxt": ["nuxt"],
    "Angular": ["@angular/core"],
    "Svelte": ["svelte"],
    "SvelteKit": ["@sveltejs/kit"],
    "Astro": ["astro"],
    "Vite": ["vite"],
    "WordPress": ["wp-content", "wordpress"],
    "Shopify": ["shopify"],
    "Laravel": ["laravel/framework"],
    "Django": ["django"],
    "Rails": ["rails"],
    "Flutter": ["flutter"],
    "React Native": ["react-native"],
}

SKIP_DIR_NAMES = {
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    "coverage",
    "search growth engineering skill",
    "skill-creator",
    "claude-api",
    "motion-ux-enhancement-expert",
    ".tmp",
    "vendor",
}

IDENTITY_FILES = (
    "package.json",
    "app/page.tsx",
    "app/page.jsx",
    "app/layout.tsx",
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "pages/index.tsx",
    "pages/index.jsx",
    "lib/site.ts",
    "lib/seo.ts",
    "src/lib/site.ts",
    "content/services.ts",
    "src/content/services.ts",
    "README.md",
    "readme.md",
)

AGENCY_PATTERNS = (
    r"professional.?service",
    r"digital agency",
    r"web (?:and|&) mobile",
    r"engineering (?:firm|partner|agency)",
    r"software (?:company|agency)",
    r"growth \+ seo retainer",
    r"calendly",
    r"contact form",
    r"retainer",
)

NAP_PATTERNS = (
    r"streetaddress",
    r"postalcode",
    r"localbusiness",
    r"google business profile",
    r"addresslocality",
)


def _read_text(path: Path, limit: int = 250_000) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")[:limit]
    except OSError:
        return ""


def _manifest_data(root: Path) -> tuple[dict[str, Any], list[str]]:
    deps: dict[str, Any] = {}
    files: list[str] = []
    for name in ("package.json", "pyproject.toml", "requirements.txt", "composer.json", "go.mod", "Cargo.toml"):
        path = root / name
        if path.exists():
            files.append(name)
            if name == "package.json":
                try:
                    obj = json.loads(_read_text(path))
                    deps.update({k: v for k, v in obj.get("dependencies", {}).items()})
                    deps.update({k: v for k, v in obj.get("devDependencies", {}).items()})
                except json.JSONDecodeError:
                    pass
            else:
                deps[name] = _read_text(path, 80_000)
    return deps, files


def _identity_text(root: Path) -> tuple[str, list[str]]:
    chunks: list[str] = []
    used: list[str] = []
    for relative in IDENTITY_FILES:
        path = root / relative
        if path.is_file():
            used.append(relative)
            chunks.append(_read_text(path, 80_000))
    return "\n".join(chunks), used


def _app_routes(root: Path) -> list[str]:
    routes: list[str] = []
    for base in ("app", "src/app", "pages", "src/pages"):
        folder = root / base
        if not folder.is_dir():
            continue
        for path in folder.rglob("*"):
            if not path.is_file():
                continue
            if any(part.lower() in SKIP_DIR_NAMES for part in path.parts):
                continue
            rel = path.relative_to(folder).as_posix().lower()
            routes.append(rel)
    return routes[:2000]


def _offering_topics(identity: str, routes: list[str]) -> list[str]:
    hay = f"{identity} {' '.join(routes)}".lower()
    topics = []
    mapping = {
        "web-development": ("web development", "next.js", "react"),
        "mobile-app-development": ("mobile app", "ios", "android", "flutter", "react native"),
        "seo": ("technical seo", "seo services", "search growth"),
        "cloud-devops": ("devops", "kubernetes", "aws"),
        "ui-ux": ("ui/ux", "ux design", "design system"),
        "ecommerce-build": ("e-commerce", "ecommerce", "storefront"),
        "saas-build": ("saas", "multi-tenant"),
    }
    for topic, needles in mapping.items():
        if any(n in hay for n in needles):
            topics.append(topic)
    return topics


def _case_study_tech(root: Path) -> list[str]:
    found: list[str] = []
    for relative in ("content/case-studies.ts", "lib/site.ts"):
        text = _read_text(root / relative, 40_000).lower()
        for token in ("flutter", "react native", "shopify", "marketplace", "stripe"):
            if token in text and token not in found:
                found.append(token)
    return found


def _nap_present(identity: str) -> bool:
    return any(re.search(pat, identity, re.I) for pat in NAP_PATTERNS)


def _is_agency(identity: str, routes: list[str]) -> bool:
    hay = identity.lower()
    if any(re.search(pat, hay, re.I) for pat in AGENCY_PATTERNS):
        return True
    joined = " ".join(f"/{route.lstrip('/')}" for route in routes)
    return "/contact" in joined and "/services" in joined and "/checkout" not in joined and "/cart" not in joined


def _programmatic_estimate(routes: list[str]) -> tuple[bool, int]:
    templates = sum(1 for route in routes if "[" in route or ":" in Path(route).stem)
    return templates >= 8, templates


def discover_project(root: str | Path) -> dict[str, Any]:
    root = Path(root).resolve()
    deps, manifests = _manifest_data(root)
    dep_names = " ".join(k.lower() for k in deps)
    identity, identity_files = _identity_text(root)
    routes = _app_routes(root)
    offerings = _offering_topics(identity, routes)
    case_tech = _case_study_tech(root)
    programmatic, template_count = _programmatic_estimate(routes)

    frameworks = []
    for framework, markers in FRAMEWORK_MARKERS.items():
        if any(marker.lower() in dep_names or (root / marker).exists() for marker in markers):
            if framework == "Flutter" and "flutter" not in dep_names and not (root / "pubspec.yaml").exists():
                continue
            if framework == "React Native" and "react-native" not in dep_names:
                continue
            frameworks.append(framework)

    project_types: list[str] = []
    agency = _is_agency(identity, routes)
    if agency:
        project_types.extend(["b2b-service", "professional-services"])
    if _nap_present(identity):
        project_types.append("local-business")
    route_blob = " ".join(routes)
    if not agency and any(token in route_blob for token in ("cart", "checkout", "product")):
        project_types.append("ecommerce")
    if not agency and any(token in identity.lower() for token in ("marketplace", "multi-vendor")):
        project_types.append("marketplace")
    if not agency and any(token in route_blob for token in ("login", "signup", "billing")):
        project_types.append("saas")
    if (root / "pubspec.yaml").exists() or "react-native" in dep_names:
        project_types.append("mobile-app")
    if not project_types:
        project_types = ["general-web-or-software-project"]

    rendering = "unknown"
    if any(x in dep_names for x in ("next", "nuxt", "sveltekit", "astro")):
        rendering = "framework-dependent; inspect routes/server/client boundaries"
    elif any(x in dep_names for x in ("react", "vue", "angular", "svelte")):
        rendering = "likely client-rendered; verify actual deployment and prerendering"

    profile = {
        "project_root": str(root),
        "project_types": sorted(set(project_types)),
        "business_model": "professional-services" if agency else (project_types[0] if project_types else "unknown"),
        "frameworks": sorted(set(frameworks)),
        "manifests": manifests,
        "rendering_architecture": rendering,
        "classification_layers": {
            "project_technology": sorted(set(frameworks)),
            "business_offering": offerings,
            "content_topics": [],
            "client_case_study_technology": case_tech,
            "identity_files": identity_files,
            "identity_text": identity[:4000],
            "app_routes": routes[:200],
            "nap_present": _nap_present(identity),
            "programmatic_templates": programmatic,
            "indexable_template_estimate": template_count,
            "app_store_urls": [m.group(0) for m in re.finditer(r"https?://(?:apps\.apple\.com|play\.google\.com/store)[^\s\"']+", identity)],
        },
        "evidence": {"verified_files": identity_files[:100] + [name for name in manifests if name not in identity_files]},
        "activated_modules": [],
        "confidence": "high" if identity_files else ("medium" if frameworks else "low"),
        "notes": [
            "Classification weights homepage, services, conversion routes and organization metadata above content topics and filenames.",
            "Project technology, business offering, content topics and case-study stacks are recorded separately.",
        ],
    }
    profile["activated_modules"] = select_modules(profile)
    return profile


def refine_classification(profile: dict[str, Any], crawl: dict[str, Any] | None = None) -> dict[str, Any]:
    """Fold live-page schema into classification without treating content topics as the business."""
    layers = profile.setdefault("classification_layers", {})
    schema: list[str] = []
    for page in (crawl or {}).get("pages") or []:
        schema.extend(str(item) for item in (page.get("structured_data_types") or []) if item)
    if schema:
        layers["schema_types"] = sorted(set(schema))
    lowered = {item.lower() for item in layers.get("schema_types") or []}
    types = set(profile.get("project_types") or [])
    if "professionalservice" in lowered and not (types & {"ecommerce", "marketplace"}):
        types.update({"b2b-service", "professional-services"})
        types.discard("general-web-or-software-project")
    if "localbusiness" in lowered:
        types.add("local-business")
    if types:
        profile["project_types"] = sorted(types)
        if "b2b-service" in types or "professional-services" in types:
            profile["business_model"] = "professional-services"
    profile["activated_modules"] = select_modules(profile)
    return profile
