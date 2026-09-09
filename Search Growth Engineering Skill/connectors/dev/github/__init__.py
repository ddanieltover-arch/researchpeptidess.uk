from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class GitHubConnector(HttpApiConnector):
    connector_id = 'github'
    display_name = 'GitHub'
    capabilities = ('repository', 'contents', 'languages')
    required_secrets = ('GITHUB_TOKEN',)
    optional_secrets = ('GITHUB_REPO',)
    default_endpoint = 'https://api.github.com'
    key_secret = 'GITHUB_TOKEN'

    def sync(self, **kwargs: Any) -> SyncResult:
        repo = kwargs.get('repo') or self.secret('GITHUB_REPO')
        if not repo:
            return skipped_sync(self.connector_id, reason='Set GITHUB_REPO (owner/name) or pass repo=', source=self.connector_id)
        return super().sync(path=f'repos/{repo}', **{k: v for k, v in kwargs.items() if k != 'path'})
