# Search Growth Engineering v1.4.0 — Autonomous Implementation & Validation Engine

v1.4 adds a controlled execution layer on top of v1.1 evidence, v1.2 search intelligence and v1.3 strategy.

## Execution lifecycle

Plan → Approve → Backup → Patch → Test → Re-audit → Report

### Dry run (default)

```bash
python -m intelligence.cli execution-plan evidence-or-strategy.json --root . --out execution-plan.json
python -m intelligence.cli execute execution-plan.json
```

### Apply an approved plan

Set `approved: true` in the plan and explicitly use `--apply`:

```bash
python -m intelligence.cli execute execution-plan.json --root . --apply --out execution-report.json
```

### Validation

```bash
python -m intelligence.cli validate --root . --commands "npm run lint;;npm test;;npm run build"
```

## Supported safe patch operations

- `text_replace`
- `metadata_patch`
- `json_file_update`

Each text operation validates its expected match count before changing anything. Each applied file is backed up under `.search-growth-engine/backups/`.

## Restricted operations

Redirects, robots rules, dependencies, production configuration, databases, authentication, payments and arbitrary shell commands require explicit per-operation approval.

## Design principle

The skill does not equate "command completed" with "SEO improvement succeeded." It must validate the affected software behavior and re-run relevant search evidence collectors before reporting success.
