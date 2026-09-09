# Search Growth Engineering v1.8.0 — Competitor Intelligence & Search Market Mapping

Adds the competitor/search-market layer on top of v1.7 AI-search intelligence.

## New capabilities
- Search-market mapping across organic SERP, paid and AI-source evidence
- SERP competitor discovery and normalized competitor profiles
- Keyword gap analysis
- Ranking-gap analysis
- Paid/organic overlap
- AI-source competitor analysis
- Competitive change detection
- Strategy-layer integration for market map and competitor gaps

## Commands
```bash
python -m intelligence.cli market-map competitor-evidence.json --target-domain example.com
python -m intelligence.cli keyword-gaps keyword-rows.json --target-domain example.com
python -m intelligence.cli paid-organic-overlap organic.json paid.json --target-domain example.com
python -m intelligence.cli ai-competitors ai-observations.json --target-domain example.com
python -m intelligence.cli competitor-changes previous-market-map.json current-market-map.json
```

## Evidence rules
Competitors are classified separately as:
- business competitors
- organic/SERP competitors
- paid competitors
- AI-source competitors

Repeated presence is evidence of search competition, not proof of market share or business rivalry.

## Keyword gaps
The engine distinguishes:
- true coverage gaps where competitors rank and the target does not
- ranking gaps where both rank but a competitor materially outranks the target
- competitive wins where the target materially outranks competitors

## AI source competition
Observed AI citations are stored separately from traditional SERP rankings. The system does not claim permanent placement, influence or causality from a single observation.

## Change monitoring
Market maps can be compared over time to detect new competitors, disappeared competitors and changes in organic/AI/paid presence.

## Testing
Run the full test suite plus `test_v18.py` before release.
