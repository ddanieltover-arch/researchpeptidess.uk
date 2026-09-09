from __future__ import annotations
import os

from .base import EvidenceEnvelope, ConnectorError
from .google_common import access_token_from_env, google_json_post

SCOPE = ['https://www.googleapis.com/auth/analytics.readonly']

class GA4Connector:
    def __init__(self, property_id: str | None = None, token: str | None = None):
        self.property_id = property_id or os.getenv('GA4_PROPERTY_ID')
        if not self.property_id:
            raise ConnectorError('Set GA4_PROPERTY_ID or pass property_id')
        self.token = token or access_token_from_env('GA4_ACCESS_TOKEN', SCOPE)

    def run_report(self, start_date: str, end_date: str, dimensions: list[str], metrics: list[str],
                   limit: int = 10000, dimension_filter: dict | None = None) -> EvidenceEnvelope:
        body = {
            'dateRanges': [{'startDate': start_date, 'endDate': end_date}],
            'dimensions': [{'name': d} for d in dimensions],
            'metrics': [{'name': m} for m in metrics],
            'limit': limit,
        }
        if dimension_filter:
            body['dimensionFilter'] = dimension_filter
        url = f'https://analyticsdata.googleapis.com/v1beta/properties/{self.property_id}:runReport'
        data = google_json_post(url, self.token, body)
        return EvidenceEnvelope.make('google-analytics-4.run-report', data,
                                     notes=[f'dimensions={dimensions}', f'metrics={metrics}'])

    def organic_landing_pages(self, start_date: str, end_date: str) -> EvidenceEnvelope:
        filt = {
            'filter': {
                'fieldName': 'sessionDefaultChannelGroup',
                'stringFilter': {'matchType': 'EXACT', 'value': 'Organic Search'},
            }
        }
        return self.run_report(start_date, end_date,
                               ['landingPagePlusQueryString'],
                               ['sessions', 'engagedSessions', 'conversions', 'totalRevenue'],
                               dimension_filter=filt)
