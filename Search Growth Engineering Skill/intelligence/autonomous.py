from __future__ import annotations
from pathlib import Path
from typing import Any
import json

from .monitor import run_monitor
from .memory import GrowthMemory
from .strategy import build_strategy
from .execution.engine import ExecutionEngine
from .execution.planner import build_execution_plan


def run_growth_loop(config_path: str | Path, root: str | Path = '.search-growth-engine', *, apply: bool = False) -> dict[str, Any]:
    root_path = Path(root)
    monitor = run_monitor(config_path, root_path, dry_run=not apply)
    digest = GrowthMemory(root_path).digest()

    strategy_input = monitor.get('strategy_input')
    strategy = build_strategy(strategy_input) if isinstance(strategy_input, dict) else {'opportunities': [], 'roadmap': []}
    execution = None
    if strategy.get('opportunities'):
        plan = build_execution_plan(strategy, str(root_path.parent if root_path.name == '.search-growth-engine' else '.'))
        execution = ExecutionEngine(plan.get('root', '.')).apply(plan, apply=apply)

    return {
        'version': '1.6.0',
        'monitor': monitor,
        'growth_memory': digest,
        'strategy': strategy,
        'execution': execution,
    }
