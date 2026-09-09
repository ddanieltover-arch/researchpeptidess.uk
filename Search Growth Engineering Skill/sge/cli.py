from __future__ import annotations

import argparse
import json
from intelligence.storage.json_store import write_json
from .orchestrator import orchestrate_platform


def _print(data, path=None):
    if path:
        write_json(path, data)
    print(json.dumps(data, indent=2, ensure_ascii=False, default=str))


def main(argv=None):
    parser = argparse.ArgumentParser(prog='sge')
    sub = parser.add_subparsers(dest='cmd', required=True)

    orch = sub.add_parser('orchestrate')
    orch.add_argument('--workspace', required=True)
    orch.add_argument('--path', default='.')
    orch.add_argument('--url')
    orch.add_argument('--sync', action='store_true')
    orch.add_argument('--observe', action='store_true')
    orch.add_argument('--strategy', action='store_true')
    orch.add_argument('--monitor', action='store_true')
    orch.add_argument('--mode', choices=['audit', 'strategy', 'implementation', 'growth'])
    orch.add_argument('--apply', action='store_true')
    orch.add_argument('--workspaces-root')
    orch.add_argument('--out')

    conn = sub.add_parser('connectors')
    conn.add_argument('action', choices=['discover', 'health', 'validate', 'sync', 'certify'])
    conn.add_argument('--id')
    conn.add_argument('--out')

    ws = sub.add_parser('workspace')
    ws.add_argument('action', choices=['list', 'ensure'])
    ws.add_argument('--id')
    ws.add_argument('--root')
    ws.add_argument('--out')

    rep = sub.add_parser('report')
    rep.add_argument('--kind', default='executive')
    rep.add_argument('--workspace', required=True)
    rep.add_argument('--workspaces-root')
    rep.add_argument('--out')

    api = sub.add_parser('serve-api')
    api.add_argument('--host', default='127.0.0.1')
    api.add_argument('--port', type=int, default=8787)

    mcp = sub.add_parser('serve-mcp')
    mcp.add_argument('--host', default='127.0.0.1')
    mcp.add_argument('--port', type=int, default=8765)

    pilot = sub.add_parser('pilot')
    pilot.add_argument('action', choices=['protocol', 'scorecard', 'override-rate', 'compare', 'baseline'])
    pilot.add_argument('--workspace', default='')
    pilot.add_argument('--input')
    pilot.add_argument('--before')
    pilot.add_argument('--after')
    pilot.add_argument('--out')

    args = parser.parse_args(argv)

    if args.cmd == 'orchestrate':
        result = orchestrate_platform(
            args.workspace,
            project_path=args.path,
            url=args.url,
            sync=args.sync,
            observe=args.observe,
            strategy=args.strategy,
            monitor=args.monitor,
            apply=args.apply,
            mode=args.mode,
            workspaces_root=args.workspaces_root,
        )
        _print(result, args.out)
        return
    if args.cmd == 'connectors':
        from connectors import ConnectorRegistry
        registry = ConnectorRegistry()
        if args.action == 'discover':
            result = registry.discover()
        elif args.action == 'health':
            health = registry.health(args.id) if args.id else registry.health()
            result = [row.to_dict() for row in health] if isinstance(health, list) else health.to_dict()
        elif args.action == 'validate':
            if not args.id:
                raise SystemExit('--id is required for validate')
            result = registry.validate(args.id).to_dict()
        elif args.action == 'certify':
            result = registry.certify(args.id) if args.id else registry.certify()
            if isinstance(result, list):
                result = [row for row in result]
        else:
            if not args.id:
                raise SystemExit('--id is required for sync')
            result = registry.sync(args.id).to_dict()
        _print(result, args.out)
        return
    if args.cmd == 'workspace':
        from workspaces import WorkspaceManager
        manager = WorkspaceManager(args.root)
        if args.action == 'list':
            result = {'workspaces': manager.list()}
        else:
            if not args.id:
                raise SystemExit('--id is required for ensure')
            result = manager.ensure(args.id).to_dict()
        _print(result, args.out)
        return
    if args.cmd == 'report':
        from workspaces import WorkspaceManager
        from reporting import generate_report, REPORT_KINDS, load_workspace_report_evidence
        ws = WorkspaceManager(args.workspaces_root).get(args.workspace)
        evidence = load_workspace_report_evidence(ws)
        if args.kind not in REPORT_KINDS:
            raise SystemExit(f'Unknown kind. Choose from {REPORT_KINDS}')
        result = generate_report(args.kind, evidence, formats=['json', 'markdown'])
        result.get('formats', {}).pop('pdf_bytes', None)
        _print(result, args.out)
        return
    if args.cmd == 'serve-api':
        from api.app import serve
        serve(args.host, args.port)
        return
    if args.cmd == 'serve-mcp':
        from mcp.server import serve
        serve(args.host, args.port)
        return
    if args.cmd == 'pilot':
        from intelligence.pilots import PILOT_SEQUENCE, compare_baselines, empty_baseline, override_rate, scorecard_template
        from intelligence.storage.json_store import read_json
        if args.action == 'protocol':
            result = {'sequence': list(PILOT_SEQUENCE), 'first_commands': [
                'python -m sge orchestrate --workspace <client> --mode audit',
                'python -m sge orchestrate --workspace <client> --mode strategy',
            ]}
        elif args.action == 'scorecard':
            result = scorecard_template(args.workspace)
        elif args.action == 'baseline':
            result = empty_baseline()
        elif args.action == 'override-rate':
            if not args.input:
                raise SystemExit('--input is required for override-rate')
            data = read_json(args.input)
            rows = data.get('reviews', data if isinstance(data, list) else [])
            result = override_rate(rows if isinstance(rows, list) else [])
        else:
            if not args.before or not args.after:
                raise SystemExit('--before and --after are required for compare')
            result = compare_baselines(read_json(args.before), read_json(args.after))
        _print(result, args.out)
        return


if __name__ == '__main__':
    main()
