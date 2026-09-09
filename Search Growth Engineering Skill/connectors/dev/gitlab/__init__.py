from __future__ import annotations

from typing import Any

from ...http_api import HttpApiConnector
from ...protocol import SyncResult, skipped_sync


class GitLabConnector(HttpApiConnector):
    connector_id = 'gitlab'
    display_name = 'GitLab'
    capabilities = ('project', 'repository', 'files')
    required_secrets = ('GITLAB_TOKEN',)
    optional_secrets = ('GITLAB_PROJECT', 'GITLAB_API_ENDPOINT')
    endpoint_secret = 'GITLAB_API_ENDPOINT'
    default_endpoint = 'https://gitlab.com/api/v4'
    key_secret = 'GITLAB_TOKEN'
    auth_header = 'PRIVATE-TOKEN'
    auth_scheme = ''

    def sync(self, **kwargs: Any) -> SyncResult:
        project = kwargs.get('project') or self.secret('GITLAB_PROJECT')
        if not project:
            return skipped_sync(self.connector_id, reason='Set GITLAB_PROJECT or pass project=', source=self.connector_id)
        from urllib.parse import quote
        return super().sync(path=f'projects/{quote(str(project), safe="")}', **{k: v for k, v in kwargs.items() if k != 'path'})
