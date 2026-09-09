from __future__ import annotations
from datetime import datetime, timezone

SAFE_TYPES = {'text_replace','json_file_update','metadata_patch','internal_link_patch'}
RISKY_TYPES = {'command','redirect_change','robots_change','schema_file_update','package_change'}


def build_execution_plan(strategy: dict, root: str = '.') -> dict:
    ops=[]
    for item in strategy.get('opportunities', []):
        score=float(item.get('priority_score',0) or 0)
        title=item.get('title','')
        typ=item.get('type','strategy')
        if score < 55:
            continue
        if typ == 'technical':
            ops.append({'id': f'opp-{len(ops)+1:03d}', 'type':'manual_review', 'title':title, 'reason':item.get('message',''), 'risk':'medium'})
        elif typ in {'content-gap','cannibalization','serp-competitor'}:
            ops.append({'id': f'opp-{len(ops)+1:03d}', 'type':'manual_review', 'title':title, 'reason':item.get('message',''), 'risk':'low'})
    return {
        'schema_version':'1.4',
        'generated_at':datetime.now(timezone.utc).isoformat(),
        'root':root,
        'mode':'dry-run',
        'requires_approval':True,
        'operations':ops,
        'acceptance_criteria':[
            'No unapproved files are changed.',
            'Every applied operation has a backup or is reversible.',
            'Relevant tests/lint/build checks pass.',
            'SEO validation is re-run after changes.',
            'A machine-readable execution report is written.'
        ],
        'risks':[
            'Redirect, robots, package, routing, payment, authentication and production configuration changes require explicit approval.',
            'Content changes should preserve business facts and existing functionality.'
        ]
    }
