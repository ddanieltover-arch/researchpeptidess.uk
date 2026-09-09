from __future__ import annotations
import json, os, shutil, subprocess, time
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime, timezone

class ExecutionError(RuntimeError):
    pass

@dataclass
class OperationResult:
    id: str
    type: str
    status: str
    files: list[str]
    message: str
    backup: str | None = None
    diff: str | None = None
    stdout: str | None = None
    stderr: str | None = None

class ExecutionEngine:
    def __init__(self, root='.', backup_dir='.search-growth-engine/backups'):
        self.root=Path(root).resolve()
        self.backup_dir=(self.root/backup_dir).resolve()

    def _safe_path(self, rel):
        p=(self.root/rel).resolve()
        try: p.relative_to(self.root)
        except ValueError: raise ExecutionError(f'Path escapes project root: {rel}')
        return p

    def _backup(self, p):
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        target=self.backup_dir/f'{stamp}__{p.relative_to(self.root).as_posix().replace("/","__")}'
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p,target)
        return str(target)

    def _text_replace(self, op):
        p=self._safe_path(op['file'])
        if not p.exists(): raise ExecutionError(f'File not found: {op["file"]}')
        text=p.read_text(encoding='utf-8')
        old=op['find']; new=op['replace']
        count=text.count(old)
        expected=op.get('expected_count',1)
        if count != expected:
            raise ExecutionError(f'Expected {expected} matches in {op["file"]}, found {count}')
        updated=text.replace(old,new)
        return p,text,updated

    def _json_update(self, op):
        p=self._safe_path(op['file'])
        if not p.exists(): raise ExecutionError(f'File not found: {op["file"]}')
        data=json.loads(p.read_text(encoding='utf-8'))
        cur=data
        path=op.get('path',[])
        if not path: data=op['value']
        else:
            for key in path[:-1]: cur=cur[key]
            cur[path[-1]]=op['value']
        return p,data

    def apply(self, plan: dict, apply=False):
        results=[]
        if apply and plan.get('requires_approval',True) and plan.get('approved') is not True:
            raise ExecutionError('Plan requires explicit approval: set approved=true.')
        for op in plan.get('operations',[]):
            oid=op.get('id','unknown'); typ=op.get('type','')
            if typ in {'command','redirect_change','robots_change','package_change'} and not op.get('approved',False):
                results.append(OperationResult(oid,typ,'blocked',[], 'Risky operation requires explicit per-operation approval.'))
                continue
            try:
                if typ=='text_replace':
                    p,old,updated=self._text_replace(op)
                    backup=None
                    if apply:
                        backup=self._backup(p); p.write_text(updated,encoding='utf-8')
                    diff=self._diff(str(p),old,updated)
                    results.append(OperationResult(oid,typ,'applied' if apply else 'planned',[str(p.relative_to(self.root))],'Text replacement validated.' ,backup,diff))
                elif typ=='metadata_patch':
                    p,old,updated=self._text_replace(op)
                    backup=None
                    if apply:
                        backup=self._backup(p); p.write_text(updated,encoding='utf-8')
                    diff=self._diff(str(p),old,updated)
                    results.append(OperationResult(oid,typ,'applied' if apply else 'planned',[str(p.relative_to(self.root))],'Metadata patch validated.',backup,diff))
                elif typ in {'json_file_update','schema_file_update'}:
                    p,data=self._json_update(op)
                    old=p.read_text(encoding='utf-8'); updated=json.dumps(data,indent=2,ensure_ascii=False)+'\n'; backup=None
                    if apply:
                        backup=self._backup(p); p.write_text(updated,encoding='utf-8')
                    results.append(OperationResult(oid,typ,'applied' if apply else 'planned',[str(p.relative_to(self.root))],'JSON update validated.',backup,self._diff(str(p),old,updated)))
                elif typ=='command':
                    cmd=op['command']; cp=subprocess.run(cmd,cwd=self.root,shell=True,text=True,capture_output=True,timeout=int(op.get('timeout',300)))
                    status='applied' if cp.returncode==0 else 'failed'
                    results.append(OperationResult(oid,typ,status,[],f'Command exited {cp.returncode}.',stdout=cp.stdout,stderr=cp.stderr))
                    if cp.returncode!=0 and op.get('fail_on_error',True):
                        raise ExecutionError(f'Command failed: {cmd}')
                else:
                    results.append(OperationResult(oid,typ,'skipped',[],f'Unsupported operation type: {typ}'))
            except Exception as exc:
                results.append(OperationResult(oid,typ,'failed',[],str(exc)))
                if apply:
                    break
        return {'schema_version':'1.4','executed_at':datetime.now(timezone.utc).isoformat(),'mode':'apply' if apply else 'dry-run','results':[asdict(r) for r in results]}

    def _diff(self,path,old,new):
        import difflib
        return ''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile=path+' (before)',tofile=path+' (after)'))

    def rollback_report(self, report):
        restored=[]
        for r in report.get('results',[]):
            if r.get('backup'):
                restored.append(r['backup'])
        return {'rollback_available':bool(restored),'backups':restored}
