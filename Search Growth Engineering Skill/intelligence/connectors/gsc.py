from __future__ import annotations
import os
from datetime import date, timedelta
from urllib.parse import quote

from .base import EvidenceEnvelope, ConnectorError
from .google_common import access_token_from_env, google_json_get, google_json_post

SCOPE = ['https://www.googleapis.com/auth/webmasters.readonly']
BASE = 'https://www.googleapis.com/webmasters/v3'

class SearchConsoleConnector:
    def __init__(self, site_url: str | None = None, token: str | None = None):
        self.site_url = site_url or os.getenv('GSC_SITE_URL')
        if not self.site_url:
            raise ConnectorError('Set GSC_SITE_URL or pass site_url')
        self.token = token or access_token_from_env('GSC_ACCESS_TOKEN', SCOPE)

    def sites(self) -> EvidenceEnvelope:
        data = google_json_get(f'{BASE}/sites', self.token)
        return EvidenceEnvelope.make('google-search-console', data)

    def search_analytics(self, start_date: str, end_date: str, dimensions: list[str] | None = None,
                         row_limit: int = 25000, data_state: str = 'final') -> EvidenceEnvelope:
        dims = dimensions or ['query', 'page']
        body = {
            'startDate': start_date,
            'endDate': end_date,
            'dimensions': dims,
            'rowLimit': max(1, min(row_limit, 25000)),
            'startRow': 0,
            'dataState': data_state,
        }
        site = quote(self.site_url, safe='')
        url = f'{BASE}/sites/{site}/searchAnalytics/query'
        data = google_json_post(url, self.token, body)
        return EvidenceEnvelope.make('google-search-console.search-analytics', data,
                                     notes=[f'dimensions={dims}', f'data_state={data_state}'])

    def sitemaps(self) -> EvidenceEnvelope:
        site = quote(self.site_url, safe='')
        data = google_json_get(f'{BASE}/sites/{site}/sitemaps', self.token)
        return EvidenceEnvelope.make('google-search-console.sitemaps', data)

def default_date_window(days: int = 28):
    end = date.today() - timedelta(days=3)
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()
