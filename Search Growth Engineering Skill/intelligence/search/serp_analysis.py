from __future__ import annotations
from urllib.parse import urlparse
from collections import Counter

def analyze_serp_results(results: list[dict], target_domain: str | None = None) -> dict:
    rows=[]
    domains=[]
    for idx, r in enumerate(results, 1):
        url=r.get('link') or r.get('url') or r.get('target') or ''
        title=r.get('title') or r.get('name') or ''
        domain=urlparse(url).netloc.lower() if url else ''
        domains.append(domain)
        rows.append({'position': r.get('position', idx), 'title': title, 'url': url, 'domain': domain})
    target = target_domain.lower().replace('www.','') if target_domain else None
    target_positions=[row['position'] for row in rows if target and row['domain'].replace('www.','').endswith(target)]
    return {
        'result_count': len(rows),
        'results': rows,
        'domain_frequency': Counter(domains).most_common(),
        'target_domain_positions': target_positions,
        'detected_competitor_domains': [d for d,_ in Counter(domains).most_common() if d and (not target or not d.endswith(target))][:10],
    }
