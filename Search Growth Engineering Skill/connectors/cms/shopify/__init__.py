from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class ShopifyConnector(HttpApiConnector):
    connector_id = 'shopify'
    display_name = 'Shopify'
    capabilities = ('products', 'collections', 'pages')
    required_secrets = ('SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_TOKEN')
    key_secret = 'SHOPIFY_ADMIN_TOKEN'

    def _endpoint(self) -> str | None:
        domain = self.secret('SHOPIFY_STORE_DOMAIN')
        return f'https://{domain}/admin/api/2024-10' if domain else None

    def sync(self, **kwargs: Any) -> SyncResult:
        if self._missing_required():
            return skipped_sync(self.connector_id, reason='Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN', source=self.connector_id)
        return super().sync(path=kwargs.get('path') or 'products.json?limit=50', **{k: v for k, v in kwargs.items() if k != 'path'})
