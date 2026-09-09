from __future__ import annotations
from .strategy import build_strategy, build_30_60_90


def test_strategy_finds_content_gap_and_cannibalization():
    evidence = {
        'crawl': {'pages': [
            {'url': 'https://example.com/', 'title': 'Home', 'word_count': 500},
            {'url': 'https://example.com/services', 'title': 'Services', 'word_count': 700},
        ]},
        'keyword_clusters': [
            {'cluster_id': 'cluster-001', 'keywords': ['web design company'], 'representative': 'web design company', 'intent': 'commercial-investigation'},
            {'cluster_id': 'cluster-002', 'keywords': ['how to improve seo'], 'representative': 'how to improve seo', 'intent': 'informational'},
        ],
        'cannibalization': [
            {'query': 'seo agency', 'pages': ['https://example.com/a', 'https://example.com/b'], 'page_count': 2}
        ],
    }
    result = build_strategy(evidence)
    types = {x['type'] for x in result['opportunities']}
    assert 'content-gap' in types
    assert 'cannibalization' in types
    assert result['roadmap']['0-30_days'] or result['roadmap']['31-60_days'] or result['roadmap']['61-90_days']


def test_roadmap_is_ranked():
    items = [
        {'title': 'A', 'priority_score': 90, 'type': 'technical'},
        {'title': 'B', 'priority_score': 40, 'type': 'content'},
    ]
    roadmap = build_30_60_90(items)
    assert any(x['title'] == 'A' for x in roadmap['0-30_days'])
