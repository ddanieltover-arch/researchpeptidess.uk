from __future__ import annotations
from typing import Any


def _domain(value: str | None) -> str:
    return (value or '').lower().replace('https://','').replace('http://','').split('/')[0].removeprefix('www.')


def _index(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out={}
    for x in items:
        d=_domain(x.get('domain') or x.get('url'))
        if d: out[d]=x
    return out


def detect_competitor_changes(previous: dict[str, Any], current: dict[str, Any]) -> dict[str, Any]:
    p=_index(previous.get('competitors') or previous.get('market_domains') or [])
    c=_index(current.get('competitors') or current.get('market_domains') or [])
    new=sorted(set(c)-set(p)); disappeared=sorted(set(p)-set(c)); changed=[]
    for d in sorted(set(p)&set(c)):
        keys=['organic_serp_occurrences','top_10_count','ai_citations','paid_result_occurrences']
        diffs={k:(p[d].get(k),c[d].get(k)) for k in keys if p[d].get(k)!=c[d].get(k)}
        if diffs: changed.append({'domain':d,'changes':diffs})
    return {'new_competitors':new,'disappeared_competitors':disappeared,'changed_competitors':changed}
