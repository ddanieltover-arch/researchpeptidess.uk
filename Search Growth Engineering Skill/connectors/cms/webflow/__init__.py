from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class WebflowConnector(HttpApiConnector):
    connector_id = 'webflow'
    display_name = 'Webflow'
    capabilities = ('sites', 'pages', 'cms-items')
    required_secrets = ('WEBFLOW_API_TOKEN',)
    optional_secrets = ('WEBFLOW_SITE_ID',)
    default_endpoint = 'https://api.webflow.com/v2'
    key_secret = 'WEBFLOW_API_TOKEN'

    def sync(self, **kwargs: Any) -> SyncResult:
        if self._missing_required():
            return skipped_sync(self.connector_id, reason='Set WEBFLOW_API_TOKEN', source=self.connector_id)
        site = self.secret('WEBFLOW_SITE_ID')
        path = kwargs.get('path') or (f'sites/{site}/pages' if site else 'sites')
        return super().sync(path=path, **{k: v for k, v in kwargs.items() if k != 'path'})
