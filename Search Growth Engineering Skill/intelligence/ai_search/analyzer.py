from __future__ import annotations
from dataclasses import dataclass, asdict
from collections import Counter, defaultdict
from typing import Any

@dataclass
class AIObservation:
    engine: str
    query: str
    rank: int | None = None
    cited: bool = False
    source_url: str | None = None
    source_domain: str | None = None
    answer_surface: str | None = None
    observed_at: str | None = None
    evidence_source: str | None = None
    notes: str | None = None

    def to_dict(self): return asdict(self)

def normalize_observations(rows: list[dict[str, Any]]) -> list[AIObservation]:
    out=[]
    for r in rows:
        out.append(AIObservation(
            engine=str(r.get('engine','unknown')),
            query=str(r.get('query','')),
            rank=int(r['rank']) if r.get('rank') not in (None,'') else None,
            cited=bool(r.get('cited',False)),
            source_url=r.get('source_url'),
            source_domain=r.get('source_domain'),
            answer_surface=r.get('answer_surface'),
            observed_at=r.get('observed_at'),
            evidence_source=r.get('evidence_source'),
            notes=r.get('notes')
        ))
    return out

def analyze_observations(obs: list[AIObservation], target_domain: str | None = None) -> dict[str, Any]:
    total=len(obs)
    cited=sum(1 for x in obs if x.cited)
    ranks=[x.rank for x in obs if x.rank is not None]
    domains=Counter(x.source_domain for x in obs if x.source_domain)
    engine_counts=Counter(x.engine for x in obs)
    query_presence=Counter(x.query for x in obs if x.query)
    target_cites=sum(1 for x in obs if target_domain and x.source_domain and x.source_domain==target_domain and x.cited)
    target_rankings=sum(1 for x in obs if target_domain and x.source_domain and x.source_domain==target_domain and x.rank is not None)
    return {
        'total_observations': total,
        'citation_rate': round(cited/total,4) if total else 0,
        'target_domain_citation_rate': round(target_cites/total,4) if total and target_domain else None,
        'target_domain_observed_rank_rate': round(target_rankings/total,4) if total and target_domain else None,
        'average_observed_rank': round(sum(ranks)/len(ranks),2) if ranks else None,
        'engines': dict(engine_counts),
        'top_source_domains': domains.most_common(20),
        'query_coverage': len(query_presence),
        'queries': sorted(query_presence),
    }

def detect_source_gaps(obs: list[AIObservation], target_domain: str) -> list[dict[str, Any]]:
    by_query=defaultdict(list)
    for x in obs: by_query[x.query].append(x)
    gaps=[]
    for q, rows in by_query.items():
        cited=any(r.cited and r.source_domain==target_domain for r in rows)
        competing=sorted({r.source_domain for r in rows if r.source_domain and r.source_domain!=target_domain})
        if not cited and competing:
            gaps.append({'query':q,'competitor_sources':competing[:10],'evidence_count':len(rows)})
    return gaps
