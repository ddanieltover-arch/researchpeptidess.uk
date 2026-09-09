import tempfile, json
from pathlib import Path
from .discovery.project import discover_project
from .scoring.priority import rank_findings

def test_discovery():
    with tempfile.TemporaryDirectory() as d:
        p=Path(d); (p/'package.json').write_text(json.dumps({'dependencies':{'next':'latest','react':'latest'}}))
        r=discover_project(p); assert 'Next.js' in r['frameworks']; assert r['project_types']

def test_priority():
    r=rank_findings([{'priority':'P1','impact':.9,'business_value':.9,'confidence':.9,'effort':.2,'urgency':.9}]); assert r[0]['priority_score']>80
