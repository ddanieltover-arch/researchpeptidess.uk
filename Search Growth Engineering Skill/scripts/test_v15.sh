#!/usr/bin/env bash
set -euo pipefail
python -m pytest -q intelligence/test_smoke.py intelligence/test_v12.py intelligence/test_v13.py intelligence/test_v14.py intelligence/test_v15.py
