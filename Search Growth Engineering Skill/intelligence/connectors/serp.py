from __future__ import annotations
import json
import os
from typing import Any

from .base import EvidenceEnvelope, ConnectorError
from .http import request_json

class SERPConnector:
    """Provider-neutral SERP adapter. Prefer an authorized SERP API over direct search-engine scraping."""
    def __init__(self, endpoint: str | None = None, api_key: str | None = None):
        self.endpoint = endpoint or os.getenv('SERP_API_ENDPOINT')
        self.api_key = api_key or os.getenv('SERP_API_KEY')
        if not self.endpoint:
            raise ConnectorError('Set SERP_API_ENDPOINT to an authorized SERP provider endpoint')

    def search(self, query: str, country: str | None = None, language: str | None = None,
               limit: int = 10) -> EvidenceEnvelope:
        params = {'q': query, 'num': min(limit, 100)}
        if country: params['country'] = country
        if language: params['language'] = language
        headers = {'Authorization': f'Bearer {self.api_key}'} if self.api_key else {}
        data = request_json(self.endpoint, method='POST', headers=headers, body=params)
        return EvidenceEnvelope.make('serp-api', data, notes=['Provider-neutral adapter; provider format may require normalization.'])

def normalize_results(envelope: EvidenceEnvelope) -> list[dict[str, Any]]:
    data = envelope.data
    if isinstance(data, dict):
        for key in ('organic_results', 'organic', 'results', 'items'):
            if isinstance(data.get(key), list):
                return data[key]
    if isinstance(data, list):
        return data
    return []
