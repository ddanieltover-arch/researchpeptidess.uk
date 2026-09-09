from __future__ import annotations

from .protocol import A2AMessage, Agent


class CROAgent(Agent):
    name = 'CROAgent'
    description = 'Surfaces conversion and landing-page investigation signals from crawl and analytics evidence.'
    skills = ('cro', 'landing-pages')

    def handle(self, message: A2AMessage) -> A2AMessage:
        pages = ((message.context.get('crawl') or {}).get('pages')) or message.context.get('pages') or []
        thin = [p.get('url') for p in pages if isinstance(p, dict) and int(p.get('word_count') or 0) < 200 and p.get('status') == 200]
        return self.reply(message, {
            'thin_or_template_pages': thin[:50],
            'page_count': len(pages),
            'notes': ['CRO suggestions are investigation signals, not guaranteed lift.'],
        })
