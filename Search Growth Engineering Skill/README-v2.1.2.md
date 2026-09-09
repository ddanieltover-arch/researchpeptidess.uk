# v2.1.2 — Field-driven stabilization after the first real-client pilot

```text
SGOS v2.1.2
Production Alpha
Real Client Pilot Ready
Feature Freeze
```

This patch stays inside the v2.1.x freeze. It does not add engines or open v2.2. It fixes the strategic failures the EL-HUB VENTURES audit/strategy pilot made concrete: classification, module gating, insufficient-data strategy, crawl identity, MIME-aware auditing, JSON-LD entity graphs, connector ready-state, unified reports, and audit artifact persistence.

## What changed

1. **Classification context weighting** — homepage, services, conversion routes and organization identity outrank content topics and filenames. Project technology, business offering, content topics and case-study stacks are recorded separately. An agency that delivers Flutter for clients is not a Flutter/ASO product.
2. **Evidence-aware module gating** — ecommerce, marketplace, ASO, programmatic SEO and SEM require first-party thresholds (checkout architecture, store listings, template scale, Ads data or explicit authorization). Weak lexical hits no longer activate those engines.
3. **Discovery-constrained strategy** — when GSC/SERP/keyword evidence is missing, SGOS records `search_data_status: insufficient` and emits required-data + unknown opportunities instead of promoting every technical lint item.
4. **Redirect / final-URL normalization** — crawl records keep `requested_url`, `final_url` and `redirect_chain`. Duplicate and canonical analysis uses the canonical resource identity.
5. **Content-type-aware auditing** — PDF/image/JSON/XML/CSS/JS are not treated as HTML documents. A crawlable PDF is flagged for indexability review, not missing `<title>`/`<h1>`.
6. **JSON-LD entity graph** — Organization, Person, Service, Location, Article and FAQ nodes are ingested from crawl JSON-LD, including person-role collisions.
7. **Connector ready-state** — certification distinguishes installed / configured / authenticated / validated / ready. Screaming Frog is not ready without an export path.
8. **Unified report model** — JSON, Markdown, HTML and PDF render Project, Evidence, Findings, Opportunities, Priorities, Roadmap, Limitations and Provenance. `sge report` reads engine artifacts so Target is not `n/a`.
9. **Audit artifact persistence** — `--mode audit` writes `engine/project-profile.json`, `engine/evidence.json`, `engine/audit.json` and `engine/limitations.json`.
10. **Chrome-aware word counts and information-gain explanations** — nav/header/footer are excluded from body word counts; information-gain scores stay a heuristic floor, not a quality claim.

## Validation

```bash
python -m pytest intelligence/test_*.py
python scripts/check_regression_baseline.py
```

The v2.1.1 regression floor remains 54 tests. v2.1.2 adds tests; it must not drop below that floor.

Do not treat this patch as a production-readiness claim. Status stays **Production Alpha — Real Client Pilot Ready**. After this lands, the before/after validation is a fresh EL-HUB `--mode audit` then `--mode strategy` run — not a new engine series.
