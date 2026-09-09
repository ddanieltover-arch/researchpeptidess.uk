# Google AI Studio evaluation protocol

Use AI Studio to test the reasoning layer against fixed evidence fixtures. Feed the model:

1. project-profile.json
2. crawl.json
3. audit.json
4. first-party analytics/Search Console exports when available

Evaluate:
- correct module selection
- correct distinction between verified/inferred/hypothesis
- correct prioritization
- avoidance of fabricated metrics
- useful implementation recommendations
- refusal to recommend manipulative SEO tactics

Prefer structured output matching the schemas in `schemas/`.
