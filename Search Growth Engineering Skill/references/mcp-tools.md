# MCP tools

The MCP layer is stateless. The tool catalog is cacheable (`ETag`). Workspace routing uses `X-SGE-Workspace`. If `SGE_MCP_TOKEN` is set, require `Authorization: Bearer`.

Tools: `crawl_site`, `audit_site`, `analyze_gsc`, `analyze_ga4`, `analyze_serp`, `market_map`, `entity_graph`, `content_strategy`, `execute_changes`, `validate_project`.

```bash
python -m sge serve-mcp --host 127.0.0.1 --port 8765
```

`execute_changes` is dry-run unless `apply=true`.
