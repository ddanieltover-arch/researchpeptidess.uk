from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class BitbucketConnector(HttpApiConnector):
    connector_id = 'bitbucket'
    display_name = 'Bitbucket'
    capabilities = ('repository', 'src')
    required_secrets = ('BITBUCKET_TOKEN',)
    optional_secrets = ('BITBUCKET_REPO',)
    default_endpoint = 'https://api.bitbucket.org/2.0'
    key_secret = 'BITBUCKET_TOKEN'

    def sync(self, **kwargs: Any) -> SyncResult:
        repo = kwargs.get('repo') or self.secret('BITBUCKET_REPO')
        if not repo:
            return skipped_sync(self.connector_id, reason='Set BITBUCKET_REPO (workspace/repo) or pass repo=', source=self.connector_id)
        return super().sync(path=f'repositories/{repo}', **{k: v for k, v in kwargs.items() if k != 'path'})
