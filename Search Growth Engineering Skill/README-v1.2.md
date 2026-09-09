# Search Growth Engineering v1.2.0 — Search Intelligence Layer

This release adds first-party search/analytics connectors, provider-neutral SERP intelligence, keyword clustering, cannibalization diagnostics and persistent baselines.

## Core commands

```bash
python -m intelligence.cli discover .
python -m intelligence.cli crawl https://example.com --max-pages 100
python -m intelligence.cli audit https://example.com --max-pages 100
python -m intelligence.cli priority audit.json
```

## Search intelligence

### Google Search Console

```bash
python -m intelligence.cli gsc --days 28 --dimensions query,page --out evidence/gsc.json
```

Environment:
- `GSC_SITE_URL`
- `GSC_ACCESS_TOKEN` or `GOOGLE_APPLICATION_CREDENTIALS`

### Google Analytics 4

```bash
python -m intelligence.cli ga4 --days 28 --landing-pages --out evidence/ga4.json
```

Environment:
- `GA4_PROPERTY_ID`
- `GA4_ACCESS_TOKEN` or `GOOGLE_APPLICATION_CREDENTIALS`

### Google Ads

```bash
python -m intelligence.cli google-ads --query "SELECT campaign.id, metrics.impressions FROM campaign"
```

Environment:
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_ACCESS_TOKEN`
- optional `GOOGLE_ADS_LOGIN_CUSTOMER_ID`

### SERP API

```bash
python -m intelligence.cli serp "best project management software" --country US --target-domain example.com
```

Environment:
- `SERP_API_ENDPOINT`
- `SERP_API_KEY`

The skill intentionally does not scrape search-engine result pages directly.

## Keyword intelligence

Input JSON:

```json
{"keywords":["seo audit","technical seo audit","best seo audit"]}
```

Run:

```bash
python -m intelligence.cli keywords keywords.json
```

For cannibalization diagnostics, include rows such as:

```json
{"rows":[{"query":"seo audit","page":"/seo-audit"},{"query":"seo audit","page":"/services/seo"}]}
```

## Baseline and memory

Save a snapshot:

```bash
python -m intelligence.cli baseline save metrics.json --label "pre-launch"
```

Compare new metrics:

```bash
python -m intelligence.cli baseline compare metrics.json
```

Baseline data is stored under `.search-growth-engine/baseline.json` by default. Keep it out of version control if it contains sensitive business data.

## Optional dependency

For service-account authentication:

```bash
pip install -r requirements-connectors.txt
```

## Current evidence model

Every connector response is wrapped with:
- source
- collection timestamp
- verification flag
- raw data
- notes

This allows the AI to distinguish measured evidence from analysis and hypothesis.
