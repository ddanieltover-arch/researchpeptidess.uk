#!/usr/bin/env bash
set -euo pipefail
python -m pytest -q intelligence/test_smoke.py
