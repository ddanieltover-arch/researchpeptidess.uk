import json, tempfile
from pathlib import Path
from .ai_search.analyzer import normalize_observations, analyze_observations, detect_source_gaps
from .ai_search.entity_graph import build_entity_graph, detect_entity_gaps
from .ai_search.opportunities import build_ai_opportunities

def test_ai_observation_analysis_and_gap():
    rows=[
      {'engine':'chatgpt','query':'seo agency','cited':False,'source_domain':'competitor.com','rank':1},
      {'engine':'chatgpt','query':'seo agency','cited':True,'source_domain':'example.com','rank':2},
      {'engine':'google-ai-overview','query':'seo agency price','cited':False,'source_domain':'competitor.com','rank':1}
    ]
    obs=normalize_observations(rows)
    a=analyze_observations(obs,'example.com')
    assert a['total_observations']==3 and a['target_domain_citation_rate'] == 0.3333
    gaps=detect_source_gaps(obs,'example.com')
    assert gaps and gaps[0]['query']=='seo agency price'

def test_ai_opportunities():
    a={'total_observations':10,'target_domain_citation_rate':0.1,'top_source_domains':[]}
    gaps=[{'query':'q','competitor_sources':['a.com']}]
    ops=build_ai_opportunities(a,gaps,[{'type':'Service','name':'Missing Service'}])
    assert len(ops)>=2

def test_entity_graph_and_gaps():
    graph=build_entity_graph([{'source':'about','entities':[{'name':'Example Co','type':'Organization'},{'name':'SEO','type':'Service'}], 'relationships':[{'from':'Example Co','to':'SEO','type':'offers'}]}])
    assert len(graph['nodes'])==2 and len(graph['edges'])==1
    missing=detect_entity_gaps(graph,[{'type':'Organization','name':'Example Co'},{'type':'Product','name':'Product X'}])
    assert len(missing)==1 and missing[0]['name']=='Product X'
