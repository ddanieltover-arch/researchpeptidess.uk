# /orchestrate

Preferred (v2.1 platform):

```bash
python -m sge orchestrate --workspace client-a --sync --observe --strategy --monitor
```

Local v2.0 orchestrator:

```bash
python -m intelligence.cli orchestrate . --url https://example.com
```

Default behavior is a dry run. To permit approved execution add `--apply`.

The platform command produces workspace-scoped artifacts (memory, reports, intelligence, orchestration summary). The local command still writes `.search-growth-engine/`.
