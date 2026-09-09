from __future__ import annotations

from typing import Any

from .protocol import A2AMessage, Agent
from .technical_seo import TechnicalSEOAgent
from .content import ContentAgent
from .geo import GEOAgent
from .aio import AIOAgent
from .sem import SEM_Agent
from .analytics import AnalyticsAgent
from .competitor import CompetitorAgent
from .cro import CROAgent

AGENT_CLASSES = {
    'TechnicalSEOAgent': TechnicalSEOAgent,
    'ContentAgent': ContentAgent,
    'GEOAgent': GEOAgent,
    'AIOAgent': AIOAgent,
    'SEM_Agent': SEM_Agent,
    'AnalyticsAgent': AnalyticsAgent,
    'CompetitorAgent': CompetitorAgent,
    'CROAgent': CROAgent,
}

DEFAULT_FANOUT = ('TechnicalSEOAgent', 'ContentAgent', 'GEOAgent', 'AIOAgent', 'AnalyticsAgent', 'CompetitorAgent')


class AgentOrchestrator:
    def __init__(self, agents: dict[str, Agent] | None = None):
        self.agents = agents or {name: cls() for name, cls in AGENT_CLASSES.items()}

    def cards(self) -> list[dict[str, Any]]:
        return [agent.card() for agent in self.agents.values()]

    def send(self, agent_name: str, message: A2AMessage | dict[str, Any]) -> A2AMessage:
        if agent_name not in self.agents:
            raise KeyError(f'Unknown agent: {agent_name}')
        payload = message if isinstance(message, A2AMessage) else A2AMessage.from_dict(message)
        return self.agents[agent_name].handle(payload)

    def fanout(self, message: A2AMessage | dict[str, Any], names: tuple[str, ...] | None = None) -> dict[str, Any]:
        payload = message if isinstance(message, A2AMessage) else A2AMessage.from_dict(message)
        selected = names or DEFAULT_FANOUT
        results = {}
        for name in selected:
            if name in self.agents:
                results[name] = self.send(name, payload).to_dict()
        return {
            'task': payload.task,
            'context_id': payload.context_id,
            'task_id': payload.task_id,
            'results': results,
        }
