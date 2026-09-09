from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class BingWebmasterConnector(HttpApiConnector):
    connector_id = 'bing-webmaster'
    display_name = 'Bing Webmaster Tools'
    capabilities = ('search-performance', 'crawl', 'sitemaps')
    required_secrets = ('BING_API_KEY', 'BING_SITE_URL')
    default_endpoint = 'https://ssl.bing.com/webmaster/api.svc/json'
    key_secret = 'BING_API_KEY'
    auth_header = 'Ocp-Apim-Subscription-Key'
    auth_scheme = ''

    def sync(self, **kwargs: Any) -> SyncResult:
        site = self.secret('BING_SITE_URL')
        if not site:
            return skipped_sync(self.connector_id, reason='Set BING_SITE_URL', source=self.connector_id)
        path = kwargs.get('path') or f'GetRankAndTrafficStats?siteUrl={site}'
        return super().sync(path=path, **{k: v for k, v in kwargs.items() if k != 'path'})
