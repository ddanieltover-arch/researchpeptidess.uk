import json
from pathlib import Path
from .search.keywords import classify_intent, cluster_keywords, detect_cannibalization
from .search.serp_analysis import analyze_serp_results
from .baseline.manager import BaselineManager
from .analytics import summarize_gsc, parse_ga4_rows, summarize_ga4


def test_search_intelligence():
    assert classify_intent('best project management software') == 'commercial-investigation'
    assert classify_intent('how to fix canonical tags') == 'informational'
    clusters = cluster_keywords(['seo audit', 'technical seo audit', 'best seo audit', 'how to cook rice'])
    assert len(clusters) >= 2
    cann = detect_cannibalization([{'query':'seo audit','page':'/a'},{'query':'seo audit','page':'/b'}])
    assert cann and cann[0]['page_count'] == 2
    analysis = analyze_serp_results([{'position':1,'title':'A','link':'https://example.com/a'},{'position':2,'title':'B','link':'https://competitor.com/b'}], 'example.com')
    assert analysis['target_domain_positions'] == [1]

def test_analytics_and_baseline(tmp_path):
    gsc = summarize_gsc([{'clicks':10,'impressions':100,'position':4},{'clicks':5,'impressions':50,'position':8}])
    assert gsc['clicks'] == 15 and round(gsc['ctr'],2) == .10
    ga = {'dimensionHeaders':[{'name':'landingPagePlusQueryString'}], 'metricHeaders':[{'name':'sessions'},{'name':'conversions'}], 'rows':[{'dimensionValues':[{'value':'/'}],'metricValues':[{'value':'100'},{'value':'5'}]}]}
    rows=parse_ga4_rows(ga); summary=summarize_ga4(rows)
    assert summary['sessions'] == 100 and summary['conversions'] == 5
    manager=BaselineManager(tmp_path)
    manager.save_snapshot({'clicks':100,'conversions':10}, 'initial')
    diff=manager.compare_latest({'clicks':120,'conversions':8})
    assert diff['has_baseline'] and any(x['metric']=='clicks' and x['delta']==20 for x in diff['changes'])
