# SERP Intelligence Connector

Use an authorized SERP API through `SERP_API_ENDPOINT` and `SERP_API_KEY`.

This skill does not directly scrape Google/Bing result pages. The connector is provider-neutral because search-result providers differ in schemas, quotas and commercial terms.

Normalize responses into:
- position
- title
- URL
- domain
- SERP feature metadata when supplied

Keep provider payload as raw evidence and analysis as a separate derived object.
