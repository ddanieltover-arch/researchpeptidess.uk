# Search Intelligence

The intelligence layer combines repository evidence, crawl evidence and first-party search/analytics evidence.

## Core entities
- query
- page
- keyword cluster
- search intent
- search appearance
- landing page
- competitor domain
- business KPI

## Required separation
1. Measured evidence
2. Derived analysis
3. Strategic recommendation

Never collapse these into one statement.

## Cannibalization
Flag possible cannibalization when one query is associated with multiple distinct pages. Treat this as a diagnostic signal, not automatic proof of a problem: intent overlap, SERP behavior and page purpose must be reviewed before consolidating URLs.

## Keyword clustering
Use token overlap as a deterministic baseline. For larger projects, an embedding/vector provider may improve semantic clustering, but the skill must label that result as model-derived rather than measured.

## SERP competitors
A search competitor is any domain repeatedly appearing for relevant queries. It does not have to be a direct commercial competitor.
