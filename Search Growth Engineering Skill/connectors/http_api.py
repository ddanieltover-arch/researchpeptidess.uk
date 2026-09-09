from __future__ import annotations

from typing import Any

from .protocol import Connector, SyncResult, skipped_sync, utcnow
from intelligence.connectors.base import EvidenceEnvelope


class HttpApiConnector(Connector):
    """Authorized JSON API connector. Not used to scrape search-engine result HTML."""

    default_endpoint: str = ''
    endpoint_secret: str = ''
    auth_header: str = 'Authorization'
    auth_scheme: str = 'Bearer'
    key_secret: str = ''

    def _endpoint(self) -> str | None:
        if self.endpoint_secret:
            configured = self.secret(self.endpoint_secret)
            if configured:
                return configured.rstrip('/')
        if self.config.get('endpoint'):
            return str(self.config['endpoint']).rstrip('/')
        return self.default_endpoint.rstrip('/') if self.default_endpoint else None

    def _headers(self) -> dict[str, str]:
        headers = {'Accept': 'application/json'}
        key_name = self.key_secret or (self.required_secrets[0] if self.required_secrets else '')
        token = self.secret(key_name) if key_name else None
        if token:
            if self.auth_scheme:
                headers[self.auth_header] = f'{self.auth_scheme} {token}'.strip()
            else:
                headers[self.auth_header] = token
        extra = self.config.get('headers')
        if isinstance(extra, dict):
            headers.update({str(k): str(v) for k, v in extra.items()})
        return headers

    def _request_json(self, url: str, *, method: str = 'GET', body: dict[str, Any] | None = None) -> Any:
        request = self._request
        if request is None:
            from intelligence.connectors.http import request_json
            request = request_json
        return request(url, method=method, headers=self._headers(), body=body)

    def sync(self, **kwargs: Any) -> SyncResult:
        missing = self._missing_required()
        if missing:
            return skipped_sync(self.connector_id, reason=f'Missing secrets: {", ".join(missing)}', source=self.connector_id)
        endpoint = self._endpoint()
        if not endpoint:
            return skipped_sync(self.connector_id, reason='No API endpoint configured', source=self.connector_id)
        path = str(kwargs.get('path') or self.config.get('sync_path') or '')
        url = endpoint if not path else f'{endpoint}/{path.lstrip("/")}'
        method = str(kwargs.get('method') or self.config.get('sync_method') or 'GET').upper()
        body = kwargs.get('body') if method != 'GET' else None
        from .retry import with_retry
        attempts = int(self.config.get('retry_attempts', 3))
        delay = float(self.config.get('retry_delay_s', 0.0))
        data = with_retry(lambda: self._request_json(url, method=method, body=body), attempts=attempts, delay_s=delay)
        envelope = EvidenceEnvelope.make(self.connector_id, data, notes=[f'method={method}', f'path={path or "/"}'], evidence_type='observed', confidence=1.0)
        return SyncResult(
            connector_id=self.connector_id,
            status='ok',
            collected_at=utcnow(),
            source=self.connector_id,
            evidence=envelope.to_dict(),
            notes=['Raw payload preserved separately from derived summaries by the caller.'],
        )
