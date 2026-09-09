from __future__ import annotations
import subprocess
from dataclasses import dataclass, asdict

@dataclass
class ValidationResult:
    command: str
    status: str
    returncode: int
    stdout: str
    stderr: str

class ValidationRunner:
    def __init__(self, root='.'):
        self.root=root

    def run(self, commands, timeout=300):
        results=[]; ok=True
        for cmd in commands:
            cp=subprocess.run(cmd,cwd=self.root,shell=True,text=True,capture_output=True,timeout=timeout)
            status='passed' if cp.returncode==0 else 'failed'; ok = ok and cp.returncode==0
            results.append(asdict(ValidationResult(cmd,status,cp.returncode,cp.stdout[-12000:],cp.stderr[-12000:])))
            if cp.returncode!=0: break
        return {'status':'passed' if ok else 'failed','results':results}
