# Content & Topic Authority Commands

## Topic map
`python -m intelligence.cli topic-map <input.json>`

Build a topic map from keyword clusters, crawl pages and optional entities.

## Content strategy
`python -m intelligence.cli content-strategy <input.json>`

Build topical authority, internal-link, gap, decay, information-gain and content-brief outputs in one run.

## Content decay
`python -m intelligence.cli content-decay <current.json> <previous.json> [--threshold 0.25]`

Detect material page-level performance declines using comparable metric rows.

## Information gain
`python -m intelligence.cli information-gain <input.json>`

Score differentiation signals from first-party facts, original sources and unique-term signals.
