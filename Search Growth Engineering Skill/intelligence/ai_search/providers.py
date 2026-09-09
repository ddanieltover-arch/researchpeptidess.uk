from __future__ import annotations
import json, os
from dataclasses import dataclass, asdict
from typing import Any
from urllib.request import Request, urlopen

class AISearchProviderError(RuntimeError): pass

@dataclass
class ProviderResult:
    provider: str
    rows: list[dict[str, Any]]
    source: str
    retrieved_at: str
    metadata: dict[str, Any]
    def to_dict(self): return asdict(self)

def load_json(path: str, provider: str='file') -> ProviderResult:
    with open(path, encoding='utf-8') as f: data=json.load(f)
    if isinstance(data, dict): rows=data.get('rows',data.get('results',[])); meta={k:v for k,v in data.items() if k not in ('rows','results')}
    elif isinstance(data,list): rows=data; meta={}
    else: raise AISearchProviderError('AI-search input must be a JSON object or array')
    from datetime import datetime, timezone
    return ProviderResult(provider, rows, path, datetime.now(timezone.utc).isoformat(), meta)

def fetch_json(url: str, provider: str='http-json', timeout: int=30) -> ProviderResult:
    req=Request(url, headers={'User-Agent':'SearchGrowthEngine/1.7'})
    try:
        with urlopen(req, timeout=timeout) as resp: data=json.load(resp)
    except Exception as e: raise AISearchProviderError(str(e)) from e
    if isinstance(data, dict): rows=data.get('rows',data.get('results',[])); meta={k:v for k,v in data.items() if k not in ('rows','results')}
    elif isinstance(data,list): rows=data; meta={}
    else: raise AISearchProviderError('Endpoint did not return JSON rows')
    from datetime import datetime, timezone
    return ProviderResult(provider, rows, url, datetime.now(timezone.utc).isoformat(), meta)
