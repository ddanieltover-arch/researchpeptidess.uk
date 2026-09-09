from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from .catalog import catalog_etag, tool_catalog
from .tools import ToolError, call_tool, list_tools

JSONRPC_ERRORS = {
    -32700: 'Parse error',
    -32600: 'Invalid Request',
    -32601: 'Method not found',
    -32602: 'Invalid params',
    -32603: 'Internal error',
    -32001: 'Unauthorized',
}


def handle_jsonrpc(payload: dict[str, Any], *, headers: dict[str, str] | None = None) -> dict[str, Any]:
    """Stateless JSON-RPC handler for MCP tools/list and tools/call."""
    rpc_id = payload.get('id')
    method = payload.get('method')
    params = payload.get('params') or {}
    try:
        if method in {'tools/list', 'tools.list'}:
            result = list_tools()
        elif method in {'tools/call', 'tools.call'}:
            name = params.get('name')
            arguments = params.get('arguments') or params.get('input') or {}
            if not name:
                return _error(rpc_id, -32602, 'Missing tool name')
            output = call_tool(name, arguments, headers=headers)
            result = {
                'content': [{'type': 'text', 'text': json.dumps(output, ensure_ascii=False)}],
                'structuredContent': output,
                'isError': False,
            }
        elif method in {'initialize', 'notifications/initialized'}:
            result = {
                'protocolVersion': tool_catalog()['protocolVersion'],
                'capabilities': {'tools': {'listChanged': False}},
                'serverInfo': {'name': 'search-growth-engine', 'version': '2.1.0'},
            }
        else:
            return _error(rpc_id, -32601, JSONRPC_ERRORS[-32601])
        return {'jsonrpc': '2.0', 'id': rpc_id, 'result': result}
    except ToolError as exc:
        code = -32001 if 'Unauthorized' in str(exc) else -32603
        return _error(rpc_id, code, str(exc))
    except Exception as exc:
        return _error(rpc_id, -32603, str(exc))


def _error(rpc_id: Any, code: int, message: str) -> dict[str, Any]:
    return {'jsonrpc': '2.0', 'id': rpc_id, 'error': {'code': code, 'message': message}}


class McpHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        return

    def _headers_dict(self) -> dict[str, str]:
        return {k: v for k, v in self.headers.items()}

    def do_GET(self) -> None:
        if self.path.rstrip('/') in {'/tools', '/mcp/tools'}:
            body = json.dumps(tool_catalog()).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'public, max-age=60')
            self.send_header('ETag', catalog_etag())
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_error(404)

    def do_POST(self) -> None:
        length = int(self.headers.get('Content-Length') or 0)
        raw = self.rfile.read(length) if length else b'{}'
        try:
            payload = json.loads(raw.decode('utf-8'))
        except json.JSONDecodeError:
            response = _error(None, -32700, 'Parse error')
            self._write(400, response)
            return
        if self.headers.get('If-None-Match') == catalog_etag() and payload.get('method') in {'tools/list', 'tools.list'}:
            self.send_response(304)
            self.send_header('ETag', catalog_etag())
            self.end_headers()
            return
        result = handle_jsonrpc(payload, headers=self._headers_dict())
        status = 401 if result.get('error', {}).get('code') == -32001 else 200
        self._write(status, result)

    def _write(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def serve(host: str = '127.0.0.1', port: int = 8765) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), McpHandler)
    server.serve_forever()
    return server
