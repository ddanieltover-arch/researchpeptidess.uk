import json
from pathlib import Path

def write_json(path, data):
    p=Path(path); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding="utf-8")

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))
