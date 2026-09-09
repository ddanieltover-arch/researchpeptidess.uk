from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class GoogleBusinessProfileConnector(HttpApiConnector):
    connector_id = 'gbp'
    display_name = 'Google Business Profile'
    capabilities = ('locations', 'reviews', 'local-profile')
    required_secrets = ('GBP_ACCESS_TOKEN',)
    optional_secrets = ('GBP_ACCOUNT_NAME',)
    default_endpoint = 'https://mybusinessbusinessinformation.googleapis.com/v1'
    key_secret = 'GBP_ACCESS_TOKEN'

    def sync(self, **kwargs: Any) -> SyncResult:
        account = self.secret('GBP_ACCOUNT_NAME') or kwargs.get('account')
        if not account:
            return skipped_sync('gbp', reason='Set GBP_ACCOUNT_NAME to sync Business Profile locations', source='google-business-profile')
        return super().sync(path=f'{account}/locations', **kwargs)
