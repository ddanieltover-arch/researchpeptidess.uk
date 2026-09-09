# Search Growth Engineering v2.1.0 — Search Growth Platform

v2.1 turns the v2.0 orchestrator into a production platform architecture (SGOS): connectors, secret resolution, MCP tools, A2A agents, live SERP/AI observation, workspaces, an HTTP API, and enterprise reporting.

```text
v2.0 = Search Growth Orchestrator
v2.1 = Search Growth Platform
```

## Flagship command

```bash
python -m sge orchestrate --workspace client-a --sync --observe --strategy --monitor
```

Equivalent:

```bash
python -m intelligence.cli orchestrate . --workspace client-a --sync --observe --strategy --monitor
```

Dry-run is the default. `--apply` is still required for mutation.

## Pipeline

Connect → Sync → Observe → Analyze → Model → Prioritize → Execute → Validate → Monitor → Learn

## Compatibility

`python -m intelligence.cli orchestrate . --url https://example.com` still runs the v2.0 local orchestrator and writes `.search-growth-engine/` artifacts with `version: 2.0.0`.
