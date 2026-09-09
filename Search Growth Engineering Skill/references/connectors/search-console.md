# Google Search Console Connector

Use the official Search Console API for first-party search performance data. The API supports Search Analytics queries grouped by dimensions such as query, page, country, device and search appearance, plus sitemap management. It requires authorization and has row/data availability limits.

## Required environment
- `GSC_SITE_URL`: URL-prefix property or `sc-domain:example.com` domain property
- `GSC_ACCESS_TOKEN` or `GOOGLE_APPLICATION_CREDENTIALS`

The collector stores collection timestamp, source, dimensions and data state. Treat fresh/incomplete data as provisional when requested.

## Interpretation rules
- Never call missing rows “zero traffic”. They may be below API reporting limits.
- Preserve the requested date range and data state in evidence.
- Separate branded vs non-branded analysis using explicit query filters or downstream classification.
