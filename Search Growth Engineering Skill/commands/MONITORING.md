# Monitoring & Autonomous Growth Loop

## Monitor

```bash
python -m intelligence.cli monitor config/monitor.json
```

Collects configured crawl evidence, merges optional metrics, compares to the nearest baseline, writes the latest snapshot, records a run, and writes `alerts-latest.json` when alerts exist.

## Growth loop

```bash
python -m intelligence.cli growth-loop config/monitor.json
```

Runs monitoring first, then builds strategy/execution context. Use `--apply` only when autonomous implementation is explicitly authorized.

## Scheduler examples

Linux/macOS cron:

```cron
0 7 * * * cd /path/to/project && python -m intelligence.cli monitor config/monitor.json >> .search-growth-engine/monitor.log 2>&1
```

Windows Task Scheduler: schedule the equivalent Python command daily or hourly, depending on the project's volatility.

CI: invoke the command as a scheduled workflow and fail the job only if your CI policy treats `status=alert` as a deployment blocker.
