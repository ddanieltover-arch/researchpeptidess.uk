# Search Growth Engineering v2.0.0 — Full Search Growth Orchestrator

v2.0 is the first unified orchestration release. It coordinates the v1.x engines into a single evidence-first workflow:

**Discover → Evidence → Intelligence → Strategy → Plan → Execute → Validate → Remember**

## Unified command

```bash
python -m intelligence.cli orchestrate . --url https://example.com
```

Dry-run is the default. For explicitly approved implementation:

```bash
python -m intelligence.cli orchestrate . --url https://example.com --apply
```

Optional config:

```bash
python -m intelligence.cli orchestrate . --url https://example.com --config config/orchestrator.example.json
```

## Produced artifacts

The run writes machine-readable artifacts under `.search-growth-engine/`:

- `project-profile.json`
- `evidence.json`
- `strategy.json`
- `execution-plan.json`
- `execution-report.json`
- `validation-report.json`
- `orchestration-summary.json`

The orchestrator does not fabricate external search/analytics evidence. External connectors remain opt-in and require credentials/configuration.

## Safety

- Dry-run by default.
- Explicit `--apply` required for mutation.
- Existing execution engine approval and backup protections remain active.
- Validation is optional/configurable.
- External providers are never treated as authoritative without source metadata.
