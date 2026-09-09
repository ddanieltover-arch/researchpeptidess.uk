from .content.authority import build_topic_map, internal_link_graph
from .content.decay import detect_content_decay
from .content.information_gain import score_information_gain
from .content.strategy import build_content_strategy


def test_topic_authority_and_internal_links():
    pages=[
        {'url':'https://x.test/seo','title':'SEO services','h1_count':1,'word_count':1000,'internal_links':[{'url':'https://x.test/seo-guide'}]},
        {'url':'https://x.test/seo-guide','title':'SEO guide','h1_count':1,'word_count':900,'internal_links':[]},
    ]
    clusters=[{'cluster_id':'c1','representative':'seo services','intent':'transactional','keywords':['seo services','seo agency']}]
    tm=build_topic_map(clusters,pages)
    assert tm['topic_count']==1
    assert tm['topics'][0]['topical_authority_score'] > 0
    g=internal_link_graph(pages)
    assert 'https://x.test/seo-guide' not in g['orphan_pages']


def test_content_decay():
    prev=[{'page':'https://x.test/a','clicks':100,'impressions':1000}]
    cur=[{'page':'https://x.test/a','clicks':60,'impressions':700}]
    out=detect_content_decay(cur,prev,0.25)
    assert len(out)==1
    assert 'clicks' in out[0]['metrics']


def test_information_gain_prefers_first_party_evidence():
    rows=[
        {'url':'https://x.test/a','text':'common content','unique_facts':0,'original_sources':0},
        {'url':'https://x.test/b','text':'common content proprietary case-study evidence','unique_facts':4,'original_sources':2},
    ]
    out=score_information_gain(rows)
    assert out[0]['url']=='https://x.test/b'
    assert out[0]['heuristic_floor'] == 20.0
    assert 'not a claim about content quality' in out[0]['explanation']


def test_content_strategy_integrates_gaps_decay_and_briefs():
    evidence={
        'keyword_clusters':[{'cluster_id':'c1','representative':'seo pricing','intent':'commercial-investigation','keywords':['seo pricing','seo cost']}],
        'crawl':{'pages':[{'url':'https://x.test/home','title':'Home','h1_count':1,'word_count':300,'internal_links':[]}]},
        'competitor_gaps':{'true_content_gaps':[{'query':'seo pricing','competitor_domains':['a.test']}]},
        'current_content_metrics':[{'page':'https://x.test/home','clicks':50}],
        'previous_content_metrics':[{'page':'https://x.test/home','clicks':100}],
    }
    out=build_content_strategy(evidence)
    assert out['version']=='1.9.0'
    assert out['content_briefs']
    assert out['content_decay']
    assert out['opportunities']
