from __future__ import annotations

import hashlib
import json
from typing import Any

PROTOCOL_VERSION = '2026-07-28'

TOOLS: list[dict[str, Any]] = [
    {
        'name': 'crawl_site',
        'title': 'Crawl a site',
        'description': 'Deterministically crawl a URL and return page-level technical evidence.',
        'inputSchema': {
            'type': 'object',
            'required': ['url'],
            'properties': {
                'url': {'type': 'string'},
                'max_pages': {'type': 'integer', 'default': 50},
                'delay': {'type': 'number', 'default': 0.15},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'audit_site',
        'title': 'Audit a site',
        'description': 'Crawl and run the technical SEO audit. No code changes.',
        'inputSchema': {
            'type': 'object',
            'required': ['url'],
            'properties': {
                'url': {'type': 'string'},
                'max_pages': {'type': 'integer', 'default': 50},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'analyze_gsc',
        'title': 'Analyze Search Console',
        'description': 'Sync and summarize first-party Google Search Console evidence. Skips if unconfigured; never fabricates rows.',
        'inputSchema': {
            'type': 'object',
            'properties': {
                'days': {'type': 'integer', 'default': 28},
                'start': {'type': 'string'},
                'end': {'type': 'string'},
                'dimensions': {'type': 'array', 'items': {'type': 'string'}},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'analyze_ga4',
        'title': 'Analyze GA4',
        'description': 'Sync and summarize first-party GA4 evidence. Skips if unconfigured.',
        'inputSchema': {
            'type': 'object',
            'properties': {
                'days': {'type': 'integer', 'default': 28},
                'landing_pages': {'type': 'boolean', 'default': False},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'analyze_serp',
        'title': 'Analyze live SERP',
        'description': 'Collect authorized-provider SERP evidence for a query. Does not scrape search-engine HTML.',
        'inputSchema': {
            'type': 'object',
            'required': ['query'],
            'properties': {
                'query': {'type': 'string'},
                'location': {'type': 'string'},
                'device': {'type': 'string'},
                'limit': {'type': 'integer', 'default': 100},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'market_map',
        'title': 'Build market map',
        'description': 'Build a competitor market map from observed SERP, paid and AI-search evidence.',
        'inputSchema': {
            'type': 'object',
            'required': ['target_domain'],
            'properties': {
                'target_domain': {'type': 'string'},
                'serp_rows': {'type': 'array'},
                'ai_observations': {'type': 'array'},
                'paid_rows': {'type': 'array'},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'entity_graph',
        'title': 'Build entity graph',
        'description': 'Build the entity intelligence graph for Brand, Organization, Product, Service, Location and Person.',
        'inputSchema': {
            'type': 'object',
            'properties': {
                'records': {'type': 'array'},
                'entities': {'type': 'array'},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'content_strategy',
        'title': 'Build content strategy',
        'description': 'Produce an evidence-backed content strategy from crawl, keyword and entity inputs.',
        'inputSchema': {
            'type': 'object',
            'additionalProperties': True,
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'execute_changes',
        'title': 'Execute approved changes',
        'description': 'Run the execution engine. Dry-run by default; apply requires explicit approval.',
        'inputSchema': {
            'type': 'object',
            'required': ['plan'],
            'properties': {
                'plan': {'type': 'object'},
                'root': {'type': 'string', 'default': '.'},
                'apply': {'type': 'boolean', 'default': False},
            },
        },
        'outputSchema': {'type': 'object'},
    },
    {
        'name': 'validate_project',
        'title': 'Validate a project',
        'description': 'Run configured validation commands against a project root.',
        'inputSchema': {
            'type': 'object',
            'properties': {
                'root': {'type': 'string', 'default': '.'},
                'commands': {'type': 'array', 'items': {'type': 'string'}},
            },
        },
        'outputSchema': {'type': 'object'},
    },
]


def catalog_etag(tools: list[dict[str, Any]] | None = None) -> str:
    payload = json.dumps(tools or TOOLS, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(payload).hexdigest()


def tool_catalog() -> dict[str, Any]:
    tools = TOOLS
    return {
        'protocolVersion': PROTOCOL_VERSION,
        'stateless': True,
        'cacheable': True,
        'etag': catalog_etag(tools),
        'tools': tools,
        'extensions': ['header-routing', 'workspace', 'authorization'],
    }
