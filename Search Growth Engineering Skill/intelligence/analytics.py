from __future__ import annotations
from typing import Any

def parse_gsc_rows(envelope: dict[str, Any]) -> list[dict[str, Any]]:
    data=envelope.get('data', envelope)
    return data.get('rows', []) if isinstance(data, dict) else []

def summarize_gsc(rows: list[dict[str, Any]]) -> dict[str, Any]:
    clicks=sum(float(r.get('clicks',0) or 0) for r in rows)
    impressions=sum(float(r.get('impressions',0) or 0) for r in rows)
    ctr=clicks/impressions if impressions else 0
    weighted=sum(float(r.get('position',0) or 0)*float(r.get('impressions',0) or 0) for r in rows)
    return {'rows':len(rows),'clicks':clicks,'impressions':impressions,'ctr':ctr,'weighted_position':(weighted/impressions if impressions else None)}

def parse_ga4_rows(envelope: dict[str, Any]) -> list[dict[str, Any]]:
    data=envelope.get('data', envelope)
    if not isinstance(data, dict): return []
    dims=[x.get('name') for x in data.get('dimensionHeaders', [])]
    mets=[x.get('name') for x in data.get('metricHeaders', [])]
    rows=[]
    for row in data.get('rows', []):
        obj={}
        for k,v in zip(dims,row.get('dimensionValues', [])): obj[k]=v.get('value')
        for k,v in zip(mets,row.get('metricValues', [])):
            val=v.get('value');
            try: val=float(val) if '.' in str(val) else int(val)
            except (ValueError,TypeError): pass
            obj[k]=val
        rows.append(obj)
    return rows

def summarize_ga4(rows: list[dict[str, Any]]) -> dict[str, Any]:
    def total(key): return sum(float(r.get(key,0) or 0) for r in rows)
    return {'rows':len(rows),'sessions':total('sessions'),'engagedSessions':total('engagedSessions'),'conversions':total('conversions'),'totalRevenue':total('totalRevenue')}
