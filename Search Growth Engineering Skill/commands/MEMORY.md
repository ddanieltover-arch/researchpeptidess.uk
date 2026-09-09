# Growth Memory Commands

## Snapshot
`python -m intelligence.cli memory snapshot metrics.json`

Appends a time-stamped KPI observation. Never overwrite historical snapshots.

## Compare
`python -m intelligence.cli memory compare metrics.json`

Compares current metrics to the latest snapshot or `--baseline-id`.

## Health
`python -m intelligence.cli memory health metrics.json`

Runs deterministic regression checks. Alerts require investigation; they are not causal explanations.

## Digest
`python -m intelligence.cli memory digest`

Returns recent changes, active experiments, insights and runs for agent context.

## Change
`python -m intelligence.cli memory change --title "..." --type technical --status completed`

Records an implementation/deployment/change event.

## Experiment
`python -m intelligence.cli memory experiment --name "..." --hypothesis "..." --metric "..." --status running`

Records an experiment hypothesis and target metric.
