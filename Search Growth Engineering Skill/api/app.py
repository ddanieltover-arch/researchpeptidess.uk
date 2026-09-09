from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

from connectors.secrets import secret


class ApiError(RuntimeError):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _auth(headers: dict[str, str] | None) -> None:
    token = secret('SGE_API_TOKEN')
    if not token:
        return
    supplied = {k.lower(): v for k, v in (headers or {}).items()}.get('authorization', '')
    if supplied != f'Bearer {token}':
        raise ApiError('Unauthorized', 401)


def handle_request(method: str, path: str, body: dict[str, Any] | None = None, *, headers: dict[str, str] | None = None) -> dict[str, Any]:
    _auth(headers)
    payload = dict(body or {})
    route = urlparse(path).path.rstrip('/') or '/'
    key = f'{method.upper()} {route}'
    if key in {'GET /health', 'GET /'}:
        return {'status': 'ok', 'version': '2.1.2', 'service': 'search-growth-api', 'release': 'production-alpha'}
    if key == 'POST /audit':
        from intelligence.crawl.site import crawl_site
        from intelligence.audit.technical import audit_crawl
        url = payload.get('url')
        if not url:
            raise ApiError('url is required')
        crawl = crawl_site(url, int(payload.get('max_pages', 50)), float(payload.get('delay', 0.15)))
        return {'crawl': crawl, 'audit': audit_crawl(crawl)}
    if key == 'POST /strategy':
        from intelligence.strategy import build_strategy
        return build_strategy(payload.get('evidence') or payload)
    if key == 'POST /roadmap':
        from intelligence.strategy import build_strategy
        return build_strategy(payload.get('evidence') or payload).get('roadmap', {})
    if key == 'POST /monitor':
        from intelligence.monitor import run_monitor
        from pathlib import Path
        import tempfile
        root = payload.get('root') or '.search-growth-engine'
        dry_run = payload.get('dry_run', True)
        config_path = payload.get('config_path')
        if not config_path:
            tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
            json.dump(payload.get('config') or payload, tmp)
            tmp.close()
            config_path = tmp.name
        return run_monitor(config_path, root, dry_run=bool(dry_run))
    if key == 'POST /report':
        from reporting import generate_report
        kind = payload.get('kind') or 'executive'
        formats = payload.get('formats') or ['json', 'markdown']
        result = generate_report(kind, payload.get('evidence') or payload, formats=formats)
        result['formats'].pop('pdf_bytes', None)
        return result
    if key == 'POST /observe-ai':
        from intelligence.ai_search.observe import observe_ai_search
        from intelligence.citations import build_citation_intelligence
        observed = observe_ai_search(payload.get('observations') or payload.get('rows') or [])
        citations = build_citation_intelligence(observed['observations'], target_domain=payload.get('target_domain'))
        return {'observed': observed, 'citations': citations}
    if key == 'POST /market-map':
        from intelligence.competitors.market_map import build_market_map
        target = payload.get('target_domain')
        if not target:
            raise ApiError('target_domain is required')
        return build_market_map(payload.get('serp_rows') or [], target, payload.get('ai_observations') or [], payload.get('paid_rows') or [])
    raise ApiError(f'Unknown route: {key}', 404)


class ApiHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        return

    def _read_body(self) -> dict[str, Any]:
        length = int(self.headers.get('Content-Length') or 0)
        if not length:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        try:
            data = json.loads(raw.decode('utf-8'))
        except json.JSONDecodeError as exc:
            raise ApiError(f'Invalid JSON: {exc}', 400)
        return data if isinstance(data, dict) else {'value': data}

    def _write(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self._dispatch('GET')

    def do_POST(self) -> None:
        self._dispatch('POST')

    def _dispatch(self, method: str) -> None:
        try:
            body = self._read_body() if method == 'POST' else {}
            result = handle_request(method, self.path, body, headers={k: v for k, v in self.headers.items()})
            self._write(200, result)
        except ApiError as exc:
            self._write(exc.status, {'error': str(exc)})


def serve(host: str = '127.0.0.1', port: int = 8787) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), ApiHandler)
    server.serve_forever()
    return server
