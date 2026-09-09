from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class WordPressConnector(HttpApiConnector):
    connector_id = 'wordpress'
    display_name = 'WordPress'
    capabilities = ('posts', 'pages', 'sitemap-hint')
    required_secrets = ('WORDPRESS_SITE_URL',)
    optional_secrets = ('WORDPRESS_APPLICATION_PASSWORD', 'WORDPRESS_USERNAME')
    key_secret = 'WORDPRESS_APPLICATION_PASSWORD'

    def _endpoint(self) -> str | None:
        site = self.secret('WORDPRESS_SITE_URL')
        return f'{site.rstrip("/")}/wp-json/wp/v2' if site else None

    def sync(self, **kwargs: Any) -> SyncResult:
        if not self.secret('WORDPRESS_SITE_URL'):
            return skipped_sync(self.connector_id, reason='Set WORDPRESS_SITE_URL', source=self.connector_id)
        return super().sync(path=kwargs.get('path') or 'pages?per_page=50', **{k: v for k, v in kwargs.items() if k != 'path'})
