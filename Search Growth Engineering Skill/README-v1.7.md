# Search Growth Engineering v1.7.0 — Advanced GEO/AIO & AI Search Intelligence

Adds a dedicated AI-search intelligence layer for evidence-backed GEO/AIO analysis.

## New capabilities
- AI-answer observation normalization
- Target-domain citation/presence analysis
- Source-gap detection
- AI-search opportunity generation
- Entity graph construction and gap detection
- File and HTTP-JSON provider adapters
- New CLI commands

## Commands
```bash
python -m intelligence.cli ai-search ai-search-observations.json --target-domain example.com
python -m intelligence.cli ai-opportunities ai-search-analysis.json --target-domain example.com
python -m intelligence.cli entity-graph entities.json
```

## Evidence model
`OBSERVED` → `VERIFIED` → `INFERRED` → `HYPOTHESIS`.

The skill never promises AI citations or placement. It distinguishes first-party Google generative-AI reporting from independently observed AI-answer results and from strategic hypotheses.

## Current platform guidance
Google Search Central's 2026 updates include guidance for generative AI features and Search Console generative-AI performance reporting for a subset of sites, including AI Overviews and AI Mode. OpenAI's current publisher guidance states that public sites can appear in ChatGPT search and recommends allowing OAI-SearchBot for discoverability where publishers want it. These are eligibility/measurement signals, not ranking guarantees.

## Testing
Run the repository test suite and v1.7 AI-search tests before release.
