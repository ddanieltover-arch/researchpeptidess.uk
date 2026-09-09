from __future__ import annotations

from typing import Any

from ...protocol import Connector, SyncResult, skipped_sync


class GoogleAdsConnectorAdapter(Connector):
    connector_id = 'google-ads'
    display_name = 'Google Ads'
    capabilities = ('search-stream', 'campaigns', 'search-terms')
    required_secrets = ('GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_ACCESS_TOKEN')
    optional_secrets = ('GOOGLE_ADS_LOGIN_CUSTOMER_ID',)

    def sync(self, **kwargs: Any) -> SyncResult:
        if self._missing_required():
            return skipped_sync('google-ads', reason='Google Ads is not configured', source='google-ads')
        from intelligence.connectors.google_ads import GoogleAdsConnector
        query = kwargs.get('query') or 'SELECT campaign.id, campaign.name FROM campaign LIMIT 10'
        inner = GoogleAdsConnector(
            customer_id=self.secret('GOOGLE_ADS_CUSTOMER_ID'),
            developer_token=self.secret('GOOGLE_ADS_DEVELOPER_TOKEN'),
            access_token=self.secret('GOOGLE_ADS_ACCESS_TOKEN'),
            login_customer_id=self.secret('GOOGLE_ADS_LOGIN_CUSTOMER_ID'),
        )
        envelope = inner.search_stream(query)
        return SyncResult(connector_id='google-ads', status='ok', source='google-ads', evidence=envelope.to_dict())
