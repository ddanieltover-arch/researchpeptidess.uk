# Real-client pilot protocol

```text
SGOS v2.1.2
Production Alpha
Real Client Pilot Ready
Feature Freeze
```

SGOS is feature-frozen at v2.1.1. v2.1.2 is a field-driven stabilization patch. Pilots validate usefulness in real environments. They do not add architecture.

## Sequence

Run each client through the same sequence:

```text
1. CONNECT
2. AUDIT
3. STRATEGY
4. REVIEW OPPORTUNITIES
5. IMPLEMENT SELECTED ITEMS
6. VALIDATE
7. MONITOR
8. COMPARE OUTCOMES
```

1. CONNECT — secrets via `secret()`, certify connectors, never put credentials in workspace config.
2. AUDIT — `python -m sge orchestrate --workspace <client> --mode audit`
3. STRATEGY — `python -m sge orchestrate --workspace <client> --mode strategy`
4. REVIEW OPPORTUNITIES — fill `pilots/templates/review.json`; compute strategist override rate.
5. IMPLEMENT SELECTED ITEMS — only accepted items; `--apply` only with approval.
6. VALIDATE — tests, collectors, and `implementation` mode dry-run first.
7. MONITOR — `--mode growth`. Alerts are signals, not diagnoses.
8. COMPARE OUTCOMES — baseline vs later snapshot. Causal claims stay conservative.

The critical artifact is not finding count. It is whether the system consistently identifies **high-value, defensible actions** that an experienced SEO strategist would agree with.

## First pass

```bash
python -m sge orchestrate --workspace <client> --mode audit
python -m sge orchestrate --workspace <client> --mode strategy
```

Copy `pilots/workspaces/<id>/config.json` into `workspaces/<id>/` and set `target_url` from first-party knowledge. Do not invent rankings or traffic.

## Four workspaces

| Workspace | Type |
|---|---|
| vees-airbnb | Hospitality / local / transactional |
| couples-retreat | Hospitality / local / booking-oriented |
| moore-business | Automotive / bilingual / inventory + services |
| research-peptides-uk | Competitive / commercial / compliance-sensitive |

Research Peptides UK is compliance-sensitive: no fabricated health claims, fake entities, or scaled doorway pages.

## Scorecard and override rate

```bash
python -m sge pilot protocol
python -m sge pilot scorecard --workspace <client>
python -m sge pilot baseline
python -m sge pilot override-rate --input pilots/templates/review.json
python -m sge pilot compare --before pilots/templates/baseline.json --after <later-snapshot.json>
```

Override rate:

```text
overridden recommendations
──────────────────────────── × 100
total recommendations reviewed
```

Unreviewed rate is `null`, not zero. A declining rate across pilots is a stronger validation signal than recommendation volume.

Do not judge a pilot only by rankings. Capture a baseline covering organic clicks, impressions, CTR, average position, organic sessions, leads/signups, conversions, revenue where available, indexed pages, technical errors, important commercial query coverage, and AI-search observations where measurable. Missing values stay `null`.

A traffic increase after an SEO change is correlation, not automatic proof of causation.

## Field observations

Log bugs, false positives, missing evidence, bad prioritization, connector issues, and UX/reporting issues. Those feed v2.1.x stabilization. Do not open v2.2 until after a production release.

## Regression freeze

The v2.1.1 suite has a floor of **54** tests. Bug fixes may add tests. They must not drop below 54.

```bash
python scripts/check_regression_baseline.py
```
