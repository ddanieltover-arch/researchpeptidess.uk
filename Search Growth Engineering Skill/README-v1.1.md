# Search Growth Engineering v1.1 — Intelligence Layer

This release adds a deterministic evidence layer and CLI around the existing skill.

## Commands

```bash
python -m intelligence.cli discover . --json out/project-profile.json
python -m intelligence.cli crawl https://example.com --max-pages 100 --out out/crawl.json
python -m intelligence.cli audit https://example.com --max-pages 100 --out out/audit.json
python -m intelligence.cli priority out/opportunities.json
```

## Design

- **Discovery** inspects the repository and classifies the project.
- **Crawler** collects first-party evidence from a public website.
- **Audit** derives technical/search findings from deterministic observations.
- **Priority** scores opportunities without inventing metrics.
- The model remains responsible for interpretation, strategy and approved implementation.

The CLI is intentionally dependency-light and uses Python's standard library where practical.
