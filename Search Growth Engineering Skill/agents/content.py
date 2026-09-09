from __future__ import annotations

from .protocol import A2AMessage, Agent


class ContentAgent(Agent):
    name = 'ContentAgent'
    description = 'Builds topic maps, content gaps, briefs and information-gain priorities from evidence.'
    skills = ('content-strategy', 'topic-map')

    def handle(self, message: A2AMessage) -> A2AMessage:
        from intelligence.content.strategy import build_content_strategy
        return self.reply(message, build_content_strategy(message.context))
