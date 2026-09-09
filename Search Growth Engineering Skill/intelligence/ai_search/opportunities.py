from __future__ import annotations
from typing import Any

def build_ai_opportunities(analysis: dict[str,Any], source_gaps: list[dict[str,Any]], entity_gaps: list[dict[str,str]] | None=None) -> list[dict[str,Any]]:
    ops=[]
    rate=analysis.get('target_domain_citation_rate')
    if source_gaps:
        ops.append({'type':'source_gap','title':'Improve AI-search source coverage for uncited query themes','priority':'high','evidence_count':len(source_gaps),'queries':[x['query'] for x in source_gaps[:20]],'confidence':0.82})
    if rate is not None and rate < 0.2:
        ops.append({'type':'citation_visibility','title':'Strengthen source-worthy first-party evidence for AI search','priority':'high','citation_rate':rate,'confidence':0.74})
    if entity_gaps:
        ops.append({'type':'entity_gap','title':'Clarify missing core entities and relationships','priority':'medium','entities':entity_gaps[:20],'confidence':0.78})
    if not ops:
        ops.append({'type':'coverage','title':'Expand monitored AI-search query coverage before optimization','priority':'medium','confidence':0.65})
    return ops
