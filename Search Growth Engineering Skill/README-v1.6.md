# Search Growth Engineering v1.6.0 — Monitoring, Alerts & Autonomous Growth Loop

v1.6 adds operational continuity: monitoring runs, deterministic alerts, scheduled-run friendly configuration, alert sinks, and an autonomous observe/compare/diagnose/prioritize/act/validate/record loop foundation.

## New capabilities

- Monitoring configuration for one or more crawl targets
- Deterministic KPI regression alerts
- Technical-health alerts from crawl results
- JSON alert sink for CI/cron integrations
- Optional webhook alert sink via `alert_webhook` or `SGE_ALERT_WEBHOOK`
- Dry-run monitoring mode
- Persistent monitor run records in growth memory
- Growth-loop orchestration that can chain monitor → strategy → execution
- Machine-readable monitoring output for CI/CD or external schedulers

## CLI

```bash
python -m intelligence.cli monitor config/monitor.example.json
python -m intelligence.cli monitor config/monitor.json --dry-run
python -m intelligence.cli growth-loop config/monitor.json
python -m intelligence.cli growth-loop config/monitor.json --apply
```

## Scheduling

The engine intentionally does not embed an OS-specific scheduler. Run `monitor` or `growth-loop` from:

- cron
- Windows Task Scheduler
- GitHub Actions
- GitLab CI
- a serverless scheduled job
- an enterprise scheduler

This keeps the skill portable across Cursor, Claude Code and CI environments.

## Alert thresholds

Defaults are deterministic and conservative:

- organic clicks/sessions/conversions/revenue: alert at or below -20%
- organic CTR: alert at or below -15%
- technical errors: alert at or above +50%

These are alerting thresholds, not causal explanations. The AI must investigate confounders such as seasonality, algorithm/platform changes, deployments and tracking changes before claiming why a metric moved.

## Operational loop

`Observe → Compare → Alert → Diagnose → Prioritize → Act → Validate → Record → Reassess`

v1.6 preserves human approval boundaries. Autonomous execution is available only when the caller explicitly enables `--apply` and the underlying execution plan is approved.
