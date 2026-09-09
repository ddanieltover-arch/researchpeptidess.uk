from __future__ import annotations
PRIORITY_MAP={"P0":1.0,"P1":0.85,"P2":0.6,"P3":0.35}

def score_finding(f):
    impact=float(f.get("impact", f.get("business_value",0.5)))
    confidence=float(f.get("confidence",0.5))
    effort=float(f.get("effort",0.5))
    urgency=float(f.get("urgency",PRIORITY_MAP.get(f.get("priority"),0.5)))
    business=float(f.get("business_value",0.5))
    score=100*(0.28*impact+0.24*business+0.18*confidence+0.18*urgency+0.12*(1-effort))
    return round(max(0,min(100,score)),2)

def rank_findings(findings):
    out=[]
    for f in findings:
        x=dict(f); x["priority_score"]=score_finding(x); out.append(x)
    return sorted(out,key=lambda x:x["priority_score"],reverse=True)
