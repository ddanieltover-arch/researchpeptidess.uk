# Competitor Intelligence Commands — v1.8

## Build market map
```bash
python -m intelligence.cli market-map competitor-evidence.json --target-domain example.com
```

Input fields may include:
- `serp_rows`
- `ai_observations`
- `paid_rows`

## Keyword gaps
```bash
python -m intelligence.cli keyword-gaps keyword-rows.json --target-domain example.com
```

## Paid/organic overlap
```bash
python -m intelligence.cli paid-organic-overlap organic.json paid.json --target-domain example.com
```

## AI-source competitors
```bash
python -m intelligence.cli ai-competitors ai-observations.json --target-domain example.com
```

## Competitive change detection
```bash
python -m intelligence.cli competitor-changes previous-market-map.json current-market-map.json
```
