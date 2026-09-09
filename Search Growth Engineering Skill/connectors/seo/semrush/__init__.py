from __future__ import annotations

from ...http_api import HttpApiConnector


class SemrushConnector(HttpApiConnector):
    connector_id = 'semrush'
    display_name = 'Semrush'
    capabilities = ('domain-overview', 'keyword-overview', 'backlinks')
    required_secrets = ('SEMRUSH_API_KEY',)
    optional_secrets = ('SEMRUSH_API_ENDPOINT',)
    endpoint_secret = 'SEMRUSH_API_ENDPOINT'
    default_endpoint = 'https://api.semrush.com'
    key_secret = 'SEMRUSH_API_KEY'
