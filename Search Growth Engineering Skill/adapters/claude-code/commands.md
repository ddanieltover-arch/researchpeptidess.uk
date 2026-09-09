# Claude Code command mapping

Primary full-project command:

```bash
python -m sge orchestrate --workspace <client-id> --mode audit
python -m sge orchestrate --workspace <client-id> --mode strategy
```

Equivalent flag form: `--sync --observe --strategy --monitor`.

Local orchestrator:

```bash
python -m intelligence.cli orchestrate . --url <TARGET_URL>
```

Focused commands remain available for isolated subsystem work. Prefer dry-run, inspect the execution plan, then use `--apply` only when the user has authorized implementation.

