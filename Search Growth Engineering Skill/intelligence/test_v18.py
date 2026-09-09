from .competitors.market_map import build_market_map
from .competitors.gaps import keyword_gap_analysis, paid_organic_overlap
from .competitors.ai_competitors import ai_source_competitor_analysis
from .competitors.changes import detect_competitor_changes


def test_market_map_and_gaps():
    serp=[
        {'query':'seo agency','position':1,'url':'https://alpha.example/seo','domain':'alpha.example'},
        {'query':'seo agency','position':7,'url':'https://target.test/seo','domain':'target.test'},
        {'query':'seo audit','position':2,'url':'https://alpha.example/audit','domain':'alpha.example'},
        {'query':'seo audit','position':4,'url':'https://target.test/audit','domain':'target.test'},
    ]
    m=build_market_map(serp,'target.test')
    assert m['competitors'][0]['domain']=='alpha.example'
    gaps=keyword_gap_analysis(serp,'target.test')
    assert gaps['ranking_gap_count']==1
    assert gaps['gap_count']==0


def test_paid_organic_overlap():
    r=paid_organic_overlap(
        [{'query':'seo agency','domain':'target.test','url':'https://target.test/seo'}],
        [{'query':'seo agency','keyword':'seo agency'},{'query':'seo consultant'}],
        'target.test')
    assert r['overlap_count']==1
    assert r['paid_only_queries']==['seo consultant']


def test_ai_competitors():
    rows=[
        {'query':'best seo agency','cited':True,'source_domain':'alpha.example'},
        {'query':'best seo agency','cited':True,'source_domain':'target.test'},
        {'query':'seo pricing','cited':True,'source_domain':'alpha.example'},
    ]
    out=ai_source_competitor_analysis(rows,'target.test')
    assert out['target_citation_count']==1
    assert out['top_ai_source_competitors'][0]['domain']=='alpha.example'
    assert any(x['query']=='seo pricing' for x in out['query_source_gaps'])


def test_competitor_changes():
    prev={'competitors':[{'domain':'alpha.example','organic_serp_occurrences':5,'top_10_count':3,'ai_citations':1,'paid_result_occurrences':0}]}
    cur={'competitors':[{'domain':'alpha.example','organic_serp_occurrences':7,'top_10_count':4,'ai_citations':2,'paid_result_occurrences':1},{'domain':'beta.example','organic_serp_occurrences':2,'top_10_count':1,'ai_citations':0,'paid_result_occurrences':0}]}
    out=detect_competitor_changes(prev,cur)
    assert out['new_competitors']==['beta.example']
    assert out['changed_competitors'][0]['domain']=='alpha.example'


def test_market_map_excludes_target_subdomains():
    out = build_market_map([
        {'query':'x','position':1,'url':'https://www.target.test/x','domain':'target.test'},
        {'query':'x','position':2,'url':'https://blog.target.test/x','domain':'blog.target.test'},
        {'query':'x','position':3,'url':'https://alpha.example/x','domain':'alpha.example'},
    ], 'target.test')
    assert [x['domain'] for x in out['competitors']] == ['alpha.example']
