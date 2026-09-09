#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python -m pytest -q intelligence/test_smoke.py intelligence/test_v12.py
python -m intelligence.cli --help >/dev/null
printf 'v1.2 checks passed\n'
