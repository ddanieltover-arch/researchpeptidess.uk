# Search Growth Engineering v1.3.0 — Opportunity & Strategy Engine

This release adds the decision layer between evidence and implementation.

## New capabilities

- Keyword-cluster → URL mapping
- Content/page-gap discovery
- Possible search cannibalization opportunities
- SERP competitor opportunity signals
- Unified opportunity ranking using the existing deterministic priority scorer
- 30/60/90-day roadmap generation
- Machine-readable strategy output suitable for downstream agents and reports

## CLI

```bash
python -m intelligence.cli strategy evidence.json --out strategy.json
python -m intelligence.cli opportunities evidence.json
python -m intelligence.cli roadmap evidence.json
```

The input evidence JSON can combine crawl output, audit findings, keyword clusters, cannibalization findings and SERP analysis from v1.1/v1.2.

## Strategy output

The strategy engine returns:

- `opportunities` — ranked evidence-backed opportunities
- `keyword_url_map` — existing/new page candidates by cluster
- `roadmap` — 0–30, 31–60 and 61–90 day work queues
- `top_opportunities` — the highest-ranked opportunities

## Design principle

The model interprets evidence; deterministic collectors and scoring functions produce measurable facts. Content gaps are hypotheses until intent, business value and available coverage are validated.

## Tests

Run:

```bash
pytest -q intelligence/test_smoke.py intelligence/test_v12.py intelligence/test_v13.py
```

Expected: all tests pass.
