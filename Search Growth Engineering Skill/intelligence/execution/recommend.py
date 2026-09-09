from __future__ import annotations
from typing import Iterable

def operations_from_findings(findings: Iterable[dict]) -> list[dict]:
    ops=[]; n=0
    for f in findings:
        typ=f.get('type'); url=f.get('url','')
        if typ=='MISSING_TITLE' and url.startswith('/'):
            n+=1; ops.append({'id':f'auto-{n:03d}','type':'manual_review','title':'Missing title','url':url,'reason':f.get('message',''),'risk':'low'})
        elif typ=='MISSING_META_DESCRIPTION':
            n+=1; ops.append({'id':f'auto-{n:03d}','type':'manual_review','title':'Missing meta description','url':url,'reason':f.get('message',''),'risk':'low'})
    return ops
