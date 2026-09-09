from __future__ import annotations

from ...http_api import HttpApiConnector


class AhrefsConnector(HttpApiConnector):
    connector_id = 'ahrefs'
    display_name = 'Ahrefs'
    capabilities = ('backlinks', 'organic-keywords', 'site-explorer')
    required_secrets = ('AHREFS_API_KEY',)
    optional_secrets = ('AHREFS_API_ENDPOINT',)
    endpoint_secret = 'AHREFS_API_ENDPOINT'
    default_endpoint = 'https://api.ahrefs.com/v3'
    key_secret = 'AHREFS_API_KEY'
