from __future__ import annotations

from typing import Any

from ...protocol import Connector, SyncResult, skipped_sync
from intelligence.connectors.base import EvidenceEnvelope
from intelligence.connectors.serp import SERPConnector, normalize_results


class SerpApiConnector(Connector):
    """Authorized SERP provider adapter. Never scrapes Google or Bing HTML result pages."""

    connector_id = 'serpapi'
    display_name = 'SERP API'
    capabilities = ('organic-results', 'serp-features', 'live-serp')
    required_secrets = ('SERP_API_ENDPOINT',)
    optional_secrets = ('SERP_API_KEY',)

    def sync(self, **kwargs: Any) -> SyncResult:
        if self._missing_required():
            return skipped_sync(self.connector_id, reason='Set SERP_API_ENDPOINT to an authorized SERP provider', source='serp-api')
        query = kwargs.get('query')
        if not query:
            return skipped_sync(self.connector_id, reason='sync(query=...) is required', source='serp-api')
        inner = SERPConnector(endpoint=self.secret('SERP_API_ENDPOINT'), api_key=self.secret('SERP_API_KEY'))
        envelope = inner.search(
            query,
            kwargs.get('country') or kwargs.get('location'),
            kwargs.get('language'),
            int(kwargs.get('limit', 100)),
        )
        parsed = normalize_results(envelope)
        combined = EvidenceEnvelope.make(
            'serp-api',
            {'raw': envelope.data, 'results': parsed},
            notes=list(envelope.notes) + ['Raw provider payload stored separately from derived live-SERP summaries.'],
        )
        return SyncResult(
            connector_id=self.connector_id,
            status='ok',
            source='serp-api',
            evidence=combined.to_dict(),
            details={'result_count': len(parsed), 'query': query},
        )
