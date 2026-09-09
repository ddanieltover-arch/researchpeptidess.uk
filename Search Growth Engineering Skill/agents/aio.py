from __future__ import annotations

from .protocol import A2AMessage, Agent


class AIOAgent(Agent):
    name = 'AIOAgent'
    description = 'Analyzes observed AI-search answers and citations. Never estimates visibility.'
    skills = ('ai-search', 'citations')

    def handle(self, message: A2AMessage) -> A2AMessage:
        from intelligence.ai_search.observe import observe_ai_search
        from intelligence.ai_search.analyzer import analyze_observations, normalize_observations
        from intelligence.citations import build_citation_intelligence
        rows = message.context.get('observations') or message.context.get('ai_observations') or []
        observed = observe_ai_search(rows)
        analysis = analyze_observations(normalize_observations(observed['observations']), message.context.get('target_domain'))
        citations = build_citation_intelligence(observed['observations'], target_domain=message.context.get('target_domain'))
        return self.reply(message, {'observed': observed, 'analysis': analysis, 'citations': citations})
