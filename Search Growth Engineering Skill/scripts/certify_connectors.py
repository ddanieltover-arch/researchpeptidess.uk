#!/usr/bin/env python
"""Certify every catalog connector: connect, validate, sync, rate limit, retry, errors, disconnect."""
from __future__ import annotations
import json
import sys
from connectors import ConnectorRegistry
from connectors.certify import CERT_STEPS

def main():
    registry = ConnectorRegistry()
    rows = registry.certify()
    print(json.dumps(rows, indent=2, default=str))
    failed = [row for row in rows if not set(CERT_STEPS) <= set(row.get('steps', {}))]
    return 1 if failed else 0

if __name__ == '__main__':
    raise SystemExit(main())
