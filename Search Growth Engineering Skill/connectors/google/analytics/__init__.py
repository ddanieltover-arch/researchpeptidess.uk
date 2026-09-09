from __future__ import annotations

from typing import Any

from ...protocol import Connector, SyncResult, skipped_sync


class GA4ConnectorAdapter(Connector):
    connector_id = 'ga4'
    display_name = 'Google Analytics 4'
    capabilities = ('run-report', 'organic-landing-pages')
    required_secrets = ('GA4_PROPERTY_ID',)
    optional_secrets = ('GA4_ACCESS_TOKEN', 'GOOGLE_APPLICATION_CREDENTIALS')
    alternative_secret_groups = (('GA4_ACCESS_TOKEN',), ('GOOGLE_APPLICATION_CREDENTIALS',))

    def sync(self, **kwargs: Any) -> SyncResult:
        if self._missing_required():
            return skipped_sync('ga4', reason='GA4 is not configured', source='google-analytics-4')
        from intelligence.connectors.ga4 import GA4Connector
        from intelligence.connectors.gsc import default_date_window
        start, end = kwargs.get('start'), kwargs.get('end')
        if not start or not end:
            start, end = default_date_window(int(kwargs.get('days', 28)))
        inner = GA4Connector(property_id=self.secret('GA4_PROPERTY_ID'), token=self.secret('GA4_ACCESS_TOKEN'))
        if kwargs.get('landing_pages'):
            envelope = inner.organic_landing_pages(start, end)
        else:
            envelope = inner.run_report(
                start, end,
                kwargs.get('dimensions') or ['sessionDefaultChannelGroup'],
                kwargs.get('metrics') or ['sessions', 'engagedSessions', 'conversions', 'totalRevenue'],
            )
        return SyncResult(connector_id='ga4', status='ok', source='google-analytics-4', evidence=envelope.to_dict())
