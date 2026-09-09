from __future__ import annotations

from .protocol import A2AMessage, Agent


class TechnicalSEOAgent(Agent):
    name = 'TechnicalSEOAgent'
    description = 'Audits crawlability, indexability, metadata, canonicalization and technical eligibility.'
    skills = ('technical-audit', 'crawl')

    def handle(self, message: A2AMessage) -> A2AMessage:
        from intelligence.audit.technical import audit_crawl
        crawl = message.context.get('crawl') or {}
        if not crawl.get('pages') and message.context.get('url'):
            from intelligence.crawl.site import crawl_site
            crawl = crawl_site(message.context['url'], int(message.context.get('max_pages', 20)), 0.05)
        audit = audit_crawl(crawl) if crawl.get('pages') is not None else {'findings': [], 'summary': {'pages_crawled': 0}}
        return self.reply(message, {'crawl': crawl, 'audit': audit})
