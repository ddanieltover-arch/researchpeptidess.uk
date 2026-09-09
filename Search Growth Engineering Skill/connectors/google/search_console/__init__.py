from __future__ import annotations

from typing import Any

from ...protocol import Connector, SyncResult, skipped_sync


class GoogleSearchConsoleConnector(Connector):
    connector_id = 'gsc'
    display_name = 'Google Search Console'
    capabilities = ('search-analytics', 'sitemaps', 'sites')
    required_secrets = ('GSC_SITE_URL',)
    optional_secrets = ('GSC_CLIENT_ID', 'GSC_ACCESS_TOKEN', 'GOOGLE_APPLICATION_CREDENTIALS')
    alternative_secret_groups = (('GSC_ACCESS_TOKEN',), ('GOOGLE_APPLICATION_CREDENTIALS',))

    def sync(self, **kwargs: Any) -> SyncResult:
        if self._missing_required():
            return skipped_sync('gsc', reason='GSC is not configured', source='google-search-console')
        from intelligence.connectors.gsc import SearchConsoleConnector, default_date_window
        start, end = kwargs.get('start'), kwargs.get('end')
        if not start or not end:
            start, end = default_date_window(int(kwargs.get('days', 28)))
        inner = SearchConsoleConnector(site_url=self.secret('GSC_SITE_URL'), token=self.secret('GSC_ACCESS_TOKEN'))
        envelope = inner.search_analytics(
            start, end,
            kwargs.get('dimensions'),
            int(kwargs.get('row_limit', 25000)),
            str(kwargs.get('data_state', 'final')),
        )
        return SyncResult(connector_id='gsc', status='ok', source='google-search-console', evidence=envelope.to_dict())
