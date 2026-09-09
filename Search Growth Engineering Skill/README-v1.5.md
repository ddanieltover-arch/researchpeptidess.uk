# Search Growth Engineering v1.5.0 — Continuous Optimization & Growth Memory

v1.5 adds persistent longitudinal memory to the v1.0-v1.4 system. The skill can now preserve and interpret project history instead of treating each audit as an isolated event.

## New capabilities

- Persistent growth ledger in `.search-growth-engine/growth-memory.json`
- KPI snapshots with source and timestamps
- Like-for-like change comparison
- Health alerts for material clicks, conversion and technical-error declines
- Implementation/change history
- Experiment registry
- Evidence-backed insight registry
- Compact historical digest for agent context

## CLI

```bash
python -m intelligence.cli memory snapshot metrics.json
python -m intelligence.cli memory compare metrics.json
python -m intelligence.cli memory health metrics.json
python -m intelligence.cli memory digest
python -m intelligence.cli memory change --title "Fix canonical conflict" --type technical --status completed
python -m intelligence.cli memory experiment --name "Category title test" --hypothesis "Specific titles improve CTR" --metric "organic_ctr" --status running
python -m intelligence.cli memory insight insight.json
```

### Health behavior

Health alerts are deterministic flags, not causal diagnoses. The AI must investigate seasonality, platform changes, deployments, tracking changes, data completeness and other confounders before claiming why a KPI moved.

## Longitudinal operating loop

`Observe → Compare → Diagnose → Prioritize → Act → Validate → Record → Reassess`

This version intentionally stores append-only history and does not silently delete or overwrite prior observations.
