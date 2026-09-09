from pathlib import Path
from .execution.engine import ExecutionEngine, ExecutionError
from .execution.validators import ValidationRunner

def test_dry_run_does_not_mutate(tmp_path):
    f=tmp_path/'index.txt'; f.write_text('title=Old\n')
    plan={'schema_version':'1.4','mode':'dry-run','requires_approval':False,'operations':[{'id':'1','type':'text_replace','file':'index.txt','find':'title=Old','replace':'title=New','expected_count':1}]}
    out=ExecutionEngine(tmp_path).apply(plan, apply=False)
    assert out['results'][0]['status']=='planned'
    assert f.read_text()=='title=Old\n'

def test_apply_requires_approval(tmp_path):
    f=tmp_path/'index.txt'; f.write_text('title=Old\n')
    plan={'schema_version':'1.4','mode':'apply','requires_approval':True,'operations':[{'id':'1','type':'text_replace','file':'index.txt','find':'title=Old','replace':'title=New','expected_count':1}]}
    try:
        ExecutionEngine(tmp_path).apply(plan, apply=True)
        assert False
    except ExecutionError:
        assert f.read_text()=='title=Old\n'

def test_apply_creates_backup(tmp_path):
    f=tmp_path/'index.txt'; f.write_text('title=Old\n')
    plan={'schema_version':'1.4','mode':'apply','requires_approval':True,'approved':True,'operations':[{'id':'1','type':'text_replace','file':'index.txt','find':'title=Old','replace':'title=New','expected_count':1}]}
    out=ExecutionEngine(tmp_path).apply(plan, apply=True)
    assert out['results'][0]['status']=='applied'
    assert f.read_text()=='title=New\n'
    assert out['results'][0]['backup']

def test_validation_runner_passes(tmp_path):
    out=ValidationRunner(tmp_path).run(['python -c "print(1)"'])
    assert out['status']=='passed'
