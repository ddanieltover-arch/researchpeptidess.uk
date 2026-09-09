from __future__ import annotations

from .protocol import A2AMessage, Agent


class SEM_Agent(Agent):
    name = 'SEM_Agent'
    description = 'Reviews paid-search evidence, landing-page fit and paid/organic overlap without fabricating economics.'
    skills = ('sem', 'paid-organic-overlap')

    def handle(self, message: A2AMessage) -> A2AMessage:
        paid = message.context.get('paid_rows') or message.context.get('ads') or []
        organic = message.context.get('organic_rows') or message.context.get('keyword_rows') or []
        target = message.context.get('target_domain') or ''
        overlap = []
        if paid and organic and target:
            from intelligence.competitors.gaps import paid_organic_overlap
            overlap = paid_organic_overlap(organic, paid, target)
        notes = []
        if not paid:
            notes.append('No first-party ad rows were supplied. CPC, spend, CTR and ROAS were not estimated.')
        return self.reply(message, {'paid_row_count': len(paid), 'overlap': overlap, 'notes': notes})
