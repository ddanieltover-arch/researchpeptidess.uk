from __future__ import annotations
import json
import urllib.error
import urllib.request
from typing import Any

from .base import ConnectorError

def request_json(url: str, *, method: str = 'GET', headers: dict[str, str] | None = None,
                 body: dict[str, Any] | None = None, timeout: int = 30) -> Any:
    payload = None
    req_headers = {'Accept': 'application/json', **(headers or {})}
    if body is not None:
        payload = json.dumps(body).encode('utf-8')
        req_headers.setdefault('Content-Type', 'application/json')
    req = urllib.request.Request(url, data=payload, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return json.loads(raw.decode('utf-8')) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='replace')
        raise ConnectorError(f'HTTP {exc.code} for {url}: {detail[:1000]}') from exc
    except urllib.error.URLError as exc:
        raise ConnectorError(f'Network error for {url}: {exc.reason}') from exc
