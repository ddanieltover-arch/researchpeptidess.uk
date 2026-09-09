from __future__ import annotations
from collections import defaultdict
from typing import Any

def build_entity_graph(records: list[dict[str, Any]]) -> dict[str, Any]:
    nodes={}; edges=[]
    for r in records:
        src=str(r.get('source','project'))
        for ent in r.get('entities',[]):
            if isinstance(ent,str): name=ent; kind='unknown'
            else: name=str(ent.get('name','')); kind=str(ent.get('type','unknown'))
            if not name: continue
            key=f'{kind}:{name}'.lower()
            nodes[key]={'id':key,'name':name,'type':kind,'sources':sorted(set(nodes.get(key,{}).get('sources',[])+[src]))}
        for rel in r.get('relationships',[]):
            if isinstance(rel,dict) and rel.get('from') and rel.get('to'):
                edges.append({'from':rel['from'],'to':rel['to'],'type':rel.get('type','related_to')})
    return {'nodes':list(nodes.values()),'edges':edges}

def detect_entity_gaps(graph: dict[str,Any], required: list[dict[str,str]]) -> list[dict[str,str]]:
    existing={(n.get('type','').lower(),n.get('name','').lower()) for n in graph.get('nodes',[])}
    return [r for r in required if (r.get('type','').lower(),r.get('name','').lower()) not in existing]
