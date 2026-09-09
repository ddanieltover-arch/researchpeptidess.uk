from __future__ import annotations

from .protocol import A2AMessage, Agent


class GEOAgent(Agent):
    name = 'GEOAgent'
    description = 'Builds entity graphs and GEO retrieval foundations from observed entities and facts.'
    skills = ('entity-graph', 'geo')

    def handle(self, message: A2AMessage) -> A2AMessage:
        from intelligence.entities import build_entity_platform
        records = message.context.get('records') or message.context.get('entities') or message.context.get('entity_graph') or []
        graph = build_entity_platform(records)
        return self.reply(message, {'entity_platform': graph, 'promise': 'No AI inclusion or citation is guaranteed.'})
