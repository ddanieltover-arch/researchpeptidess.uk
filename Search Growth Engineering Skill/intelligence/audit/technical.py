from __future__ import annotations

from collections import Counter, defaultdict
from urllib.parse import urlparse

from .mime import classify_document
from intelligence.crawl.site import normalize_url, resource_identity


def _f(ftype, priority, url, message, evidence, confidence, business_value, *, technical_severity=None, business_relevance=None, search_significance=None):
    tech = technical_severity if technical_severity is not None else {"P0": 1.0, "P1": 0.85, "P2": 0.6, "P3": 0.35}.get(priority, 0.5)
    relevance = business_relevance if business_relevance is not None else min(1.0, float(business_value))
    significance = search_significance if search_significance is not None else round(tech * relevance * confidence, 4)
    return {
        "type": ftype,
        "priority": priority,
        "url": url,
        "message": message,
        "evidence": {"status": "verified", "value": evidence},
        "confidence": confidence,
        "business_value": business_value,
        "technical_severity": tech,
        "business_relevance": relevance,
        "search_significance": significance,
    }


def _document_class(page: dict) -> str:
    if page.get("document_class"):
        return page["document_class"]
    return classify_document(page.get("content_type"), page.get("final_url") or page.get("url") or "")


def audit_crawl(crawl: dict) -> dict:
    pages = crawl.get("pages", [])
    findings = []
    titles = Counter()
    canonicals = defaultdict(list)
    inbound = Counter()
    identity_titles: dict[str, str] = {}
    html_pages = []

    for page in pages:
        identity = resource_identity(page) or page.get("url")
        for link in page.get("internal_links", []):
            inbound[normalize_url(link)] += 1
            inbound[link] += 1
        kind = _document_class(page)
        url = page.get("url")
        if page.get("status", 0) >= 400 or page.get("status") == 0:
            findings.append(_f(
                "CRAWL_STATUS",
                "P0" if page.get("status") == 0 else "P1",
                url,
                "Page failed to return a successful HTTP response.",
                page.get("error") or f"HTTP {page.get('status')}",
                0.98,
                0.95,
                business_relevance=0.95,
            ))

        if kind == "pdf":
            findings.append(_f(
                "CRAWLABLE_DOCUMENT",
                "P2",
                url,
                "PDF discovered and crawlable; assess whether this document should be publicly indexable.",
                f"content_type={page.get('content_type') or 'application/pdf'}",
                0.95,
                0.55,
                business_relevance=0.55,
            ))
            continue
        if kind in {"image", "css", "js", "json", "xml", "text", "other", "redirect-alias"}:
            if kind == "redirect-alias":
                findings.append(_f(
                    "REDIRECT_ALIAS",
                    "P3",
                    url,
                    "Request URL resolved to an already-crawled canonical resource. Duplicate HTML checks were skipped.",
                    f"final_url={page.get('final_url')} identity={identity}",
                    0.9,
                    0.15,
                    business_relevance=0.15,
                ))
            continue
        if kind != "html":
            continue

        html_pages.append(page)
        title = (page.get("title") or "").strip()
        if title:
            titles[title.lower()] += 1
            identity_titles[identity] = title.lower()
        if page.get("canonical"):
            canonicals[normalize_url(page["canonical"])].append(identity)
        if not page.get("title"):
            findings.append(_f("MISSING_TITLE", "P1", url, "HTML page has no title element.", "title=null", 0.99, 0.9, business_relevance=0.85))
        if page.get("h1_count", 0) != 1:
            findings.append(_f("H1_COUNT", "P2", url, "HTML page does not have exactly one H1.", f"h1_count={page.get('h1_count')}", 0.97, 0.45, business_relevance=0.4))
        if page.get("meta_description") is None:
            findings.append(_f("MISSING_META_DESCRIPTION", "P2", url, "HTML page has no meta description.", "meta_description=null", 0.99, 0.45, business_relevance=0.4))
        if page.get("images_missing_alt", 0) > 0:
            findings.append(_f(
                "MISSING_IMAGE_ALT",
                "P2",
                url,
                "Content images are missing alternative text (chrome/header/footer images excluded).",
                f"{page['images_missing_alt']}/{page.get('images_total', 0)}",
                0.9,
                0.25,
                business_relevance=0.2,
            ))
        robots = page.get("robots_meta") or ""
        start_identity = normalize_url(crawl.get("start_url"))
        if "noindex" in robots.lower() and identity == start_identity:
            findings.append(_f("NOINDEX_ENTRY", "P0", url, "The crawl entry point is marked noindex.", robots, 0.99, 0.95, business_relevance=0.95))
        body_words = page.get("body_word_count")
        if body_words is None:
            body_words = page.get("word_count", 0)
        if body_words < 200 and page.get("status", 0) == 200:
            findings.append(_f(
                "THIN_TEXT",
                "P2",
                url,
                "Page has a low amount of extractable main-content text after excluding nav/header/footer; investigate intent before adding content.",
                f"body_word_count={body_words}",
                0.8,
                0.4,
                business_relevance=0.35,
            ))

    seen_title_identities: set[str] = set()
    title_identities: dict[str, set[str]] = defaultdict(set)
    for page in html_pages:
        title = (page.get("title") or "").strip().lower()
        if title:
            title_identities[title].add(resource_identity(page) or page.get("url"))
    for title, identities in title_identities.items():
        if len(identities) > 1:
            for page in html_pages:
                if (page.get("title") or "").strip().lower() == title:
                    ident = resource_identity(page) or page.get("url")
                    if ident in seen_title_identities:
                        continue
                    seen_title_identities.add(ident)
                    findings.append(_f(
                        "DUPLICATE_TITLE",
                        "P2",
                        page.get("url"),
                        "Distinct canonical resources share the same title.",
                        f"count={len(identities)}",
                        0.99,
                        0.65,
                        business_relevance=0.6,
                    ))

    for canon, identities in canonicals.items():
        unique = {item for item in identities if item}
        if len(unique) > 1:
            findings.append(_f(
                "CANONICAL_CONCENTRATION",
                "P2",
                canon,
                "Multiple distinct resources declare the same canonical target; verify that consolidation is intentional.",
                f"sources={len(unique)}",
                0.98,
                0.55,
                business_relevance=0.5,
            ))

    start = normalize_url(crawl.get("start_url"))
    seen_orphans: set[str] = set()
    for page in html_pages:
        ident = resource_identity(page) or page.get("url")
        if ident == start or ident in seen_orphans:
            continue
        if inbound.get(ident, 0) == 0 and inbound.get(page.get("url"), 0) == 0 and inbound.get(page.get("final_url"), 0) == 0 and page.get("status") == 200:
            seen_orphans.add(ident)
            findings.append(_f(
                "POSSIBLE_ORPHAN",
                "P2",
                page.get("url"),
                "HTML resource has no inbound link from another crawled page.",
                "inbound_count=0",
                0.75,
                0.45,
                business_relevance=0.4,
            ))

    alt_pages = [p for p in html_pages if p.get("images_missing_alt", 0) > 0]
    if len(alt_pages) >= 4:
        findings.append(_f(
            "SITEWIDE_MISSING_IMAGE_ALT",
            "P2",
            crawl.get("start_url"),
            "Missing content-image alt text appears on many URLs; treat as a template issue rather than per-URL SEO work unless unique content images are affected.",
            f"pages={len(alt_pages)}",
            0.85,
            0.3,
            business_relevance=0.25,
        ))

    summary = {
        "pages_crawled": len(pages),
        "html_pages": len(html_pages),
        "successful_pages": sum(1 for p in pages if p.get("status") == 200),
        "errors": sum(1 for p in pages if p.get("status", 0) >= 400 or p.get("status") == 0),
        "finding_count": len(findings),
        "finding_types": dict(Counter(f["type"] for f in findings)),
        "document_classes": dict(Counter(_document_class(p) for p in pages)),
    }
    return {"summary": summary, "findings": findings}
