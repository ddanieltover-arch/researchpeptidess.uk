from __future__ import annotations
import re
from collections import defaultdict

COMMERCIAL = {'buy','price','pricing','cost','quote','hire','service','services','agency','company','software','tool','best','top','compare','comparison','alternative','alternatives','review','reviews'}
TRANSACTIONAL = {'buy','purchase','order','book','reserve','download','subscribe','sign up','signup','hire','quote','pricing','price'}
INFORMATIONAL = {'how','what','why','when','where','who','guide','tutorial','learn','tips','meaning','definition','examples','vs','versus'}
NAVIGATIONAL = {'login','sign in','signin','official','website','contact','support'}

def _tokens(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 1}

def classify_intent(query: str) -> str:
    q = query.lower()
    toks = _tokens(q)
    if any(term in q for term in TRANSACTIONAL): return 'transactional'
    if any(term in q for term in NAVIGATIONAL): return 'navigational'
    if any(term in q for term in INFORMATIONAL): return 'informational'
    if toks & COMMERCIAL: return 'commercial-investigation'
    return 'mixed-or-unclear'

def cluster_keywords(keywords: list[str], overlap_threshold: float = 0.45) -> list[dict]:
    clusters: list[dict] = []
    for kw in keywords:
        tokens = _tokens(kw)
        best = None; best_score = 0.0
        for cluster in clusters:
            score = len(tokens & cluster['tokens']) / max(1, len(tokens | cluster['tokens']))
            if score > best_score:
                best, best_score = cluster, score
        if best and best_score >= overlap_threshold:
            best['keywords'].append(kw)
            best['tokens'] = best['tokens'] | tokens
        else:
            clusters.append({'cluster_id': f'cluster-{len(clusters)+1:03d}', 'keywords': [kw], 'tokens': tokens})
    for c in clusters:
        c['representative'] = max(c['keywords'], key=lambda x: (len(_tokens(x)), -len(x)))
        c['intent'] = classify_intent(c['representative'])
        c['tokens'] = sorted(c['tokens'])
    return clusters

def detect_cannibalization(rows: list[dict]) -> list[dict]:
    """Rows should contain query and page. Returns queries ranking across multiple distinct pages."""
    pages_by_query = defaultdict(set)
    for r in rows:
        q = r.get('query'); p = r.get('page')
        if q and p: pages_by_query[q].add(p)
    findings = []
    for q, pages in pages_by_query.items():
        if len(pages) > 1:
            findings.append({'query': q, 'pages': sorted(pages), 'page_count': len(pages), 'type': 'possible-cannibalization'})
    return sorted(findings, key=lambda x: x['page_count'], reverse=True)
