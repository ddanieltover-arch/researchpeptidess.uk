# Search Growth Engineering v1.9.0 — Content & Topic Authority Intelligence

v1.9 adds an evidence-driven content intelligence layer that turns keyword, crawl, entity, competitor and analytics evidence into topical authority analysis and actionable content strategy.

## Core capabilities

- Topic maps from keyword clusters, pages and entities
- Operational topical-authority scoring (a prioritization heuristic, not a search-engine metric)
- Internal-link graph analysis, including orphan pages and hub candidates
- Content gaps and competitor content gaps
- Content decay detection using comparable current/previous performance rows
- Information-gain scoring using first-party evidence, original sources and differentiation signals
- Content-brief generation
- Integration into the main `strategy` pipeline and 30/60/90 roadmap

## Commands

```bash
python -m intelligence.cli topic-map <input.json>
python -m intelligence.cli content-strategy <input.json>
python -m intelligence.cli content-decay <current.json> <previous.json>
python -m intelligence.cli information-gain <input.json>
```

## Evidence discipline

Scores are operational heuristics for prioritization. They do not claim that a search engine computes the same score.

Content decay is a signal to investigate, not proof of a content-quality problem. Before refreshing content, check search-intent changes, seasonality, competition, technical regressions and tracking changes.

Information gain should be based on real original data, first-party experience, demonstrations, proprietary evidence or meaningful synthesis. Never manufacture uniqueness.

## Integrated strategy output

`python -m intelligence.cli strategy <evidence.json>` now returns:

- `content_intelligence.topic_map`
- `content_intelligence.internal_link_graph`
- `content_intelligence.content_gaps`
- `content_intelligence.content_decay`
- `content_intelligence.information_gain`
- `content_intelligence.content_briefs`
- content-derived opportunities merged into the main ranked strategy queue

## Validation

The full v1.1–v1.9 test suite passes.

## Test result

`29 passed` across the complete regression suite.
