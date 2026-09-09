from .memory import GrowthMemory, summarize_health


def test_memory_snapshot_and_compare(tmp_path):
    m=GrowthMemory(tmp_path)
    m.snapshot({'organic_clicks':100,'organic_conversions':10,'technical_errors':2}, label='baseline', source='gsc+ga4')
    out=m.changes_since({'organic_clicks':120,'organic_conversions':8,'technical_errors':15})
    assert out['has_baseline'] is True
    changes={x['metric']:x for x in out['changes']}
    assert changes['organic_clicks']['percent_change']==20.0
    assert changes['organic_conversions']['percent_change']==-20.0


def test_health_flags_regression(tmp_path):
    m=GrowthMemory(tmp_path)
    m.snapshot({'organic_clicks':100,'organic_conversions':10,'technical_errors':1})
    compare=m.changes_since({'organic_clicks':80,'organic_conversions':8,'technical_errors':12})
    health=summarize_health(compare)
    assert health['status']=='alert'
    assert len(health['alerts'])>=2


def test_digest_tracks_experiment_and_change(tmp_path):
    m=GrowthMemory(tmp_path)
    ch=m.record_change('implementation','Fix metadata',status='completed')
    exp=m.record_experiment('Title test','Specific titles improve CTR','organic_ctr',status='running')
    d=m.digest()
    assert d['recent_changes'][-1]['id']==ch['id']
    assert d['active_experiments'][-1]['id']==exp['id']


def test_insight_confidence_is_bounded(tmp_path):
    m=GrowthMemory(tmp_path)
    row=m.add_insight('Traffic improved after release',[{'source':'gsc'}],1.5,'investigate')
    assert row['confidence']==1.0
