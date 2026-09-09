from __future__ import annotations
import os

from .base import EvidenceEnvelope, ConnectorError
from .http import request_json

class GoogleAdsConnector:
    def __init__(self, customer_id: str | None = None, developer_token: str | None = None,
                 access_token: str | None = None, login_customer_id: str | None = None,
                 api_version: str = 'v25'):
        self.customer_id = (customer_id or os.getenv('GOOGLE_ADS_CUSTOMER_ID') or '').replace('-', '')
        self.developer_token = developer_token or os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN')
        self.access_token = access_token or os.getenv('GOOGLE_ADS_ACCESS_TOKEN')
        self.login_customer_id = login_customer_id or os.getenv('GOOGLE_ADS_LOGIN_CUSTOMER_ID')
        self.api_version = api_version
        missing = [name for name, value in [
            ('GOOGLE_ADS_CUSTOMER_ID', self.customer_id),
            ('GOOGLE_ADS_DEVELOPER_TOKEN', self.developer_token),
            ('GOOGLE_ADS_ACCESS_TOKEN', self.access_token),
        ] if not value]
        if missing:
            raise ConnectorError('Missing: ' + ', '.join(missing))

    def search_stream(self, query: str) -> EvidenceEnvelope:
        url = f'https://googleads.googleapis.com/{self.api_version}/customers/{self.customer_id}/googleAds:searchStream'
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'developer-token': self.developer_token,
            'Content-Type': 'application/json',
        }
        if self.login_customer_id:
            headers['login-customer-id'] = self.login_customer_id.replace('-', '')
        data = request_json(url, method='POST', headers=headers, body={'query': query})
        return EvidenceEnvelope.make('google-ads.search-stream', data, notes=['Uses Google Ads Query Language'])
