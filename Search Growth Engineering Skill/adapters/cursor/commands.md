# Cursor command mapping

Use the Search Growth Platform for full-project work:

```bash
python -m sge orchestrate --workspace <client-id> --mode audit
python -m sge orchestrate --workspace <client-id> --mode strategy
```

Equivalent flag form: `--sync --observe --strategy --monitor`.

The v2.0 local orchestrator remains available:

```bash
python -m intelligence.cli orchestrate . --url <TARGET_URL>
```

Use focused subsystem commands when requested: `crawl`, `audit`, `strategy`, `ai-search`, `live-serp`, `observe-ai`, `market-map`, `content-strategy`, `monitor`, and `memory`.

Never use `--apply` unless the user has authorized code changes for the current task.
