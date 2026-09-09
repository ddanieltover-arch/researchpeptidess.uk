from __future__ import annotations

from typing import Any

from .catalog import TOOLS, tool_catalog


class ToolError(RuntimeError):
    pass


DISK_TOOLS = {'analyze_serp', 'execute_changes', 'validate_project'}


def _workspace_from_headers(headers: dict[str, str] | None) -> str | None:
    if not headers:
        return None
    lowered = {str(k).lower(): str(v) for k, v in headers.items()}
    return lowered.get('x-sge-workspace') or lowered.get('mcp-workspace')


def _require_auth(headers: dict[str, str] | None) -> None:
    from connectors.secrets import secret
    token = secret('SGE_MCP_TOKEN')
    if not token:
        return
    lowered = {str(k).lower(): str(v) for k, v in (headers or {}).items()}
    supplied = lowered.get('authorization', '')
    expected = f'Bearer {token}'
    if supplied != expected:
        raise ToolError('Unauthorized MCP request')


def call_tool(name: str, arguments: dict[str, Any] | None = None, *, headers: dict[str, str] | None = None) -> dict[str, Any]:
    """Stateless tool invocation. Catalog is cacheable; routing uses request headers."""
    _require_auth(headers)
    known = {tool['name'] for tool in TOOLS}
    if name not in known:
        raise ToolError(f'Unknown tool: {name}. Known: {sorted(known)}')
    args = dict(arguments or {})
    workspace = args.pop('workspace', None) or _workspace_from_headers(headers)
    if workspace and name in DISK_TOOLS:
        from workspaces import WorkspaceManager
        try:
            ws = WorkspaceManager().get(workspace)
        except Exception as exc:
            raise ToolError(f'Workspace isolation: {exc}') from exc
        args.setdefault('root', str(ws.root))
        args.setdefault('store_root', str(ws.root))
    try:
        return _invoke(name, args, workspace)
    except ToolError:
        raise
    except Exception as exc:
        from connectors.retry import sanitize_error
        raise ToolError(sanitize_error(str(exc))) from exc


def _invoke(name: str, args: dict[str, Any], workspace: str | None) -> dict[str, Any]:
    if name == 'crawl_site':
        from intelligence.crawl.site import crawl_site
        return crawl_site(args['url'], int(args.get('max_pages', 50)), float(args.get('delay', 0.15)))
    if name == 'audit_site':
        from intelligence.crawl.site import crawl_site
        from intelligence.audit.technical import audit_crawl
        crawl = crawl_site(args['url'], int(args.get('max_pages', 50)), float(args.get('delay', 0.15)))
        return {'crawl': crawl, 'audit': audit_crawl(crawl)}
    if name == 'analyze_gsc':
        from connectors import ConnectorRegistry
        from intelligence.analytics import parse_gsc_rows, summarize_gsc
        sync = ConnectorRegistry().sync('gsc', **{k: v for k, v in args.items() if k not in {'root', 'store_root'}})
        payload = {'sync': sync.to_dict()}
        if sync.status == 'ok' and sync.evidence:
            rows = parse_gsc_rows(sync.evidence)
            payload['summary'] = summarize_gsc(rows)
            payload['row_count'] = len(rows)
        return payload
    if name == 'analyze_ga4':
        from connectors import ConnectorRegistry
        from intelligence.analytics import parse_ga4_rows, summarize_ga4
        sync = ConnectorRegistry().sync('ga4', **{k: v for k, v in args.items() if k not in {'root', 'store_root'}})
        payload = {'sync': sync.to_dict()}
        if sync.status == 'ok' and sync.evidence:
            rows = parse_ga4_rows(sync.evidence)
            payload['summary'] = summarize_ga4(rows)
            payload['row_count'] = len(rows)
        return payload
    if name == 'analyze_serp':
        from intelligence.live_serp import collect_live_serp
        return collect_live_serp(
            args['query'],
            location=args.get('location'),
            device=args.get('device'),
            limit=int(args.get('limit', 100)),
            workspace=workspace,
            store_root=args.get('store_root'),
        )
    if name == 'market_map':
        from intelligence.competitors.market_map import build_market_map
        return build_market_map(
            args.get('serp_rows') or [],
            args['target_domain'],
            args.get('ai_observations') or [],
            args.get('paid_rows') or [],
        )
    if name == 'entity_graph':
        from intelligence.entities import build_entity_platform
        records = args.get('records') or args.get('entities') or []
        return build_entity_platform(records)
    if name == 'content_strategy':
        from intelligence.content.strategy import build_content_strategy
        return build_content_strategy(args)
    if name == 'execute_changes':
        from intelligence.execution.engine import ExecutionEngine
        apply = bool(args.get('apply', False))
        return ExecutionEngine(args.get('root', '.')).apply(args['plan'], apply=apply)
    if name == 'validate_project':
        from intelligence.execution.validators import ValidationRunner
        commands = args.get('commands') or []
        if not commands:
            return {'status': 'skipped', 'notes': ['No validation commands supplied.']}
        return ValidationRunner(args.get('root', '.')).run(commands)
    raise ToolError(f'Unknown tool: {name}')


def list_tools() -> dict[str, Any]:
    return tool_catalog()
