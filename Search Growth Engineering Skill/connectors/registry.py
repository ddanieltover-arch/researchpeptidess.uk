from __future__ import annotations

from typing import Any

from .protocol import Connector, ConnectorError, ConnectionResult, HealthResult, SyncResult, ValidationResult
from .rate_limit import RateLimiter
from .secrets import SecretsManager


class ConnectorRegistry:
    """Discover, authenticate, rate-limit, health-check and capability-detect connectors."""

    def __init__(self, *, secrets: SecretsManager | None = None, limiter: RateLimiter | None = None, config: dict[str, Any] | None = None):
        self.secrets = secrets or SecretsManager.current()
        self.limiter = limiter or RateLimiter()
        self.config = dict(config or {})
        self._classes: dict[str, type[Connector]] = {}
        self._instances: dict[str, Connector] = {}
        self._aliases: dict[str, str] = {}
        self._load_catalog()

    def _load_catalog(self) -> None:
        from .catalog import CONNECTOR_CLASSES, ALIASES
        self._classes = dict(CONNECTOR_CLASSES)
        self._aliases = {k.lower(): v for k, v in ALIASES.items()}
        for connector_id, cls in self._classes.items():
            self.limiter.configure(connector_id, cls.rate_limit)

    def resolve_id(self, connector_id: str) -> str:
        key = (connector_id or '').strip().lower()
        key = self._aliases.get(key, key)
        if key not in self._classes:
            raise ConnectorError(f'Unknown connector: {connector_id}')
        return key

    def discover(self) -> list[dict[str, Any]]:
        rows = []
        for connector_id, cls in sorted(self._classes.items()):
            rows.append({
                'id': connector_id,
                'name': cls.display_name or connector_id,
                'capabilities': list(cls.capabilities),
                'required_secrets': list(cls.required_secrets),
                'optional_secrets': list(cls.optional_secrets),
            })
        return rows

    def instance(self, connector_id: str) -> Connector:
        key = self.resolve_id(connector_id)
        if key not in self._instances:
            cls = self._classes[key]
            cfg = (self.config.get('connectors') or {}).get(key) or {}
            self._instances[key] = cls(secrets=self.secrets, config=cfg)
        return self._instances[key]

    def capabilities(self, connector_id: str) -> list[str]:
        return list(self.instance(connector_id).capabilities)

    def connect(self, connector_id: str) -> ConnectionResult:
        return self.instance(connector_id).connect()

    def disconnect(self, connector_id: str) -> ConnectionResult:
        return self.instance(connector_id).disconnect()

    def validate(self, connector_id: str) -> ValidationResult:
        return self.instance(connector_id).validate()

    def health(self, connector_id: str | None = None) -> HealthResult | list[HealthResult]:
        if connector_id:
            return self.instance(connector_id).health()
        return [self.instance(cid).health() for cid in sorted(self._classes)]

    def sync(self, connector_id: str, **kwargs: Any) -> SyncResult:
        from .retry import sanitize_error, with_retry
        from intelligence.provenance import stamp
        key = self.resolve_id(connector_id)
        conn = self.instance(key)
        decision = self.limiter.allow(key, conn.rate_limit)
        if not decision.allowed:
            result = SyncResult(
                connector_id=key,
                status='rate_limited',
                source=key,
                notes=[f'Retry after {decision.retry_after_s:.1f}s'],
                details={'retry_after_s': decision.retry_after_s},
                confidence=None,
            )
            return result
        if not conn._connected:
            connection = conn.connect()
            if not connection.connected:
                return SyncResult(
                    connector_id=key,
                    status='skipped',
                    source=key,
                    notes=connection.notes or ['Connector is not connected.'],
                    confidence=None,
                )
        attempts = int((self.config.get('retry_attempts') or getattr(conn, 'config', {}).get('retry_attempts') or 3))
        try:
            result = with_retry(lambda: conn.sync(**kwargs), attempts=attempts, delay_s=0)
        except Exception as exc:
            return SyncResult(
                connector_id=key,
                status='error',
                source=key,
                notes=[sanitize_error(str(exc))],
                confidence=None,
            )
        if result.status == 'ok' and isinstance(result.evidence, dict):
            result.evidence = stamp(result.evidence, result.source or key, evidence_type='observed', collected_at=result.collected_at)
        return result

    def certify(self, connector_id: str | None = None, **kwargs: Any):
        from .certify import certify_connector
        if connector_id:
            return certify_connector(self, connector_id, **kwargs)
        return [certify_connector(self, cid, **kwargs) for cid in sorted(self._classes)]
