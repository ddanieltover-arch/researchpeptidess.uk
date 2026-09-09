# Claude Code adapter

Use the skill with Claude Code as a repository-level search-growth workflow. The Python intelligence layer can be invoked from the terminal, while Claude interprets evidence, plans changes and executes approved work.

Useful commands:
```bash
python -m intelligence.cli discover .
python -m intelligence.cli audit https://example.com
python -m intelligence.cli gsc --days 28
python -m intelligence.cli ga4 --days 28 --landing-pages
```

Do not hardcode credentials. Prefer environment variables or a secret manager.
