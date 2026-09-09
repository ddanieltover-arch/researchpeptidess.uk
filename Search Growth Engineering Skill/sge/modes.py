from __future__ import annotations

from typing import Any

MODES = ('audit', 'strategy', 'implementation', 'growth')

MODE_SPECS: dict[str, dict[str, Any]] = {
    'audit': {
        'description': 'Discover → Collect → Analyze → Report',
        'sync': True,
        'observe': False,
        'analyze': True,
        'strategy': False,
        'execute': False,
        'validate': False,
        'monitor': False,
        'recommend': False,
        'reports': ('executive', 'technical'),
    },
    'strategy': {
        'description': 'Audit → Market Map → Topic Map → Roadmap',
        'sync': True,
        'observe': True,
        'analyze': True,
        'strategy': True,
        'execute': False,
        'validate': False,
        'monitor': False,
        'recommend': False,
        'reports': ('executive', 'technical', 'content', 'geo', 'competitor'),
    },
    'implementation': {
        'description': 'Strategy → Execute → Validate',
        'sync': True,
        'observe': False,
        'analyze': True,
        'strategy': True,
        'execute': True,
        'validate': True,
        'monitor': False,
        'recommend': False,
        'reports': ('executive', 'technical', 'growth'),
    },
    'growth': {
        'description': 'Monitor → Learn → Alert → Recommend',
        'sync': False,
        'observe': False,
        'analyze': False,
        'strategy': False,
        'execute': False,
        'validate': False,
        'monitor': True,
        'recommend': True,
        'reports': ('executive', 'growth', 'ai-visibility'),
    },
}


def resolve_mode(
    mode: str | None,
    *,
    sync: bool = False,
    observe: bool = False,
    strategy: bool = False,
    monitor: bool = False,
) -> dict[str, Any]:
    if mode:
        key = mode.strip().lower()
        if key not in MODE_SPECS:
            raise ValueError(f'Unknown orchestrator mode: {mode}. Use {MODES}.')
        spec = dict(MODE_SPECS[key])
        spec['mode'] = key
        spec['sync'] = bool(spec['sync'] or sync)
        spec['observe'] = bool(spec['observe'] or observe)
        spec['strategy'] = bool(spec['strategy'] or strategy)
        spec['monitor'] = bool(spec['monitor'] or monitor)
        spec['analyze'] = bool(spec['analyze'] or spec['strategy'])
        return spec
    return {
        'mode': None,
        'description': 'Explicit pipeline flags',
        'sync': sync,
        'observe': observe,
        'analyze': strategy,
        'strategy': strategy,
        'execute': strategy,
        'validate': strategy,
        'monitor': monitor,
        'recommend': monitor,
        'reports': None,
    }
