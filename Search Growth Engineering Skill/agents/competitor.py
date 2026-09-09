from __future__ import annotations

from .protocol import A2AMessage, Agent


class CompetitorAgent(Agent):
    name = 'CompetitorAgent'
    description = 'Maps observed SERP, paid and AI-source competitors without inferring business competition from rank alone.'
    skills = ('market-map', 'keyword-gaps')

    def handle(self, message: A2AMessage) -> A2AMessage:
        from intelligence.competitors.market_map import build_market_map
        target = message.context.get('target_domain') or ''
        market = build_market_map(
            message.context.get('serp_rows') or [],
            target,
            message.context.get('ai_observations') or [],
            message.context.get('paid_rows') or [],
        )
        return self.reply(message, {'market_map': market})
