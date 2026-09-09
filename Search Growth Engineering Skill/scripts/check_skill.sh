#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

required=("SKILL.md" "AGENTS.md" "schemas/project-profile.json" "schemas/audit-result.json" "schemas/implementation-plan.json")
for f in "${required[@]}"; do
  test -f "$ROOT/$f" || { echo "Missing: $f" >&2; exit 1; }
done

python3 - <<PY
import json, pathlib
root=pathlib.Path(r"$ROOT")
for p in root.glob("schemas/*.json"):
    json.load(open(p, encoding="utf-8"))
    print("OK", p.relative_to(root))
PY

echo "Skill package structure OK"
