from __future__ import annotations

from .protocol import A2AMessage, Agent


class AnalyticsAgent(Agent):
    name = 'AnalyticsAgent'
    description = 'Summarizes first-party GSC/GA4 evidence and preserves missing-data caveats.'
    skills = ('gsc', 'ga4')

    def handle(self, message: A2AMessage) -> A2AMessage:
        from intelligence.analytics import parse_gsc_rows, summarize_gsc, parse_ga4_rows, summarize_ga4
        gsc = message.context.get('gsc') or {}
        ga4 = message.context.get('ga4') or {}
        gsc_rows = parse_gsc_rows(gsc) if gsc else []
        ga4_rows = parse_ga4_rows(ga4) if ga4 else []
        return self.reply(message, {
            'gsc_summary': summarize_gsc(gsc_rows) if gsc_rows else None,
            'ga4_summary': summarize_ga4(ga4_rows) if ga4_rows else None,
            'notes': [] if (gsc_rows or ga4_rows) else ['No first-party analytics rows were supplied. Missing data is not zero.'],
        })
