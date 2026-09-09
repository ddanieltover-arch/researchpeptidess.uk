from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class RateLimitSpec:
    requests_per_minute: int = 60
    burst: int = 10
    notes: str = ''


@dataclass
class ConnectionResult:
    connector_id: str
    status: str
    connected: bool
    checked_at: str = field(default_factory=utcnow)
    notes: list[str] = field(default_factory=list)
    capabilities: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ValidationResult:
    connector_id: str
    ok: bool
    missing_secrets: list[str] = field(default_factory=list)
    present_secrets: list[str] = field(default_factory=list)
    checked_at: str = field(default_factory=utcnow)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class HealthResult:
    connector_id: str
    status: str
    connected: bool
    capabilities: list[str] = field(default_factory=list)
    rate_limit: dict[str, Any] = field(default_factory=dict)
    checked_at: str = field(default_factory=utcnow)
    notes: list[str] = field(default_factory=list)
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SyncResult:
    connector_id: str
    status: str
    collected_at: str = field(default_factory=utcnow)
    source: str = ''
    evidence: dict[str, Any] | None = None
    raw_ref: str | None = None
    notes: list[str] = field(default_factory=list)
    details: dict[str, Any] = field(default_factory=dict)
    evidence_type: str = 'observed'
    confidence: float | None = 1.0

    def to_dict(self) -> dict[str, Any]:
        from intelligence.provenance import stamp
        payload = asdict(self)
        if self.status == 'ok' and self.evidence:
            return stamp(payload, self.source or self.connector_id, evidence_type=self.evidence_type, confidence=self.confidence, collected_at=self.collected_at)
        payload['provenance'] = {
            'source': self.source or self.connector_id,
            'collected_at': self.collected_at,
            'confidence': None,
            'evidence_type': 'observed',
        }
        payload['confidence'] = None
        return payload


class ConnectorError(RuntimeError):
    pass


class Connector(ABC):
    """Production connector contract. Implementations must not store secrets in config files."""

    connector_id: str = ''
    display_name: str = ''
    capabilities: tuple[str, ...] = ()
    required_secrets: tuple[str, ...] = ()
    optional_secrets: tuple[str, ...] = ()
    alternative_secret_groups: tuple[tuple[str, ...], ...] = ()
    rate_limit: RateLimitSpec = RateLimitSpec()

    def __init__(self, *, secrets: Any | None = None, request_fn: Any | None = None, config: dict[str, Any] | None = None):
        self._secrets = secrets
        self._request = request_fn
        self.config = dict(config or {})
        self._connected = False
        self._session: dict[str, Any] = {}

    def secret(self, name: str) -> str | None:
        if self._secrets is not None:
            return self._secrets.get(name)
        from .secrets import secret
        return secret(name)

    def ready_requirements(self) -> list[str]:
        """Names that must be present before the connector is ready, not merely installed."""
        return []

    def _missing_required(self) -> list[str]:
        missing = [name for name in self.required_secrets if not self.secret(name)]
        if self.alternative_secret_groups:
            group_ok = any(all(self.secret(n) for n in group) for group in self.alternative_secret_groups)
            if group_ok:
                optional_alts = {n for group in self.alternative_secret_groups for n in group}
                missing = [n for n in missing if n not in optional_alts]
            else:
                for group in self.alternative_secret_groups:
                    if not any(self.secret(n) for n in group):
                        missing.extend(n for n in group if n not in missing)
        return missing

    def _missing_ready(self) -> list[str]:
        missing = list(self._missing_required())
        for name in self.ready_requirements():
            if name not in missing:
                missing.append(name)
        return missing

    def readiness(self) -> dict[str, Any]:
        missing = self._missing_ready()
        configured = not missing
        return {
            'installed': True,
            'configured': configured,
            'authenticated': configured,
            'validated': configured,
            'ready': configured,
            'missing': missing,
        }

    def connect(self) -> ConnectionResult:
        missing = self._missing_ready()
        if missing:
            self._connected = False
            return ConnectionResult(
                self.connector_id, 'unconfigured', False,
                notes=[f'Missing secrets: {", ".join(missing)}. Secrets are resolved via secret(), never from config files.'],
                capabilities=list(self.capabilities),
            )
        self._connected = True
        self._session = {'connected_at': utcnow()}
        return ConnectionResult(self.connector_id, 'connected', True, capabilities=list(self.capabilities))

    def disconnect(self) -> ConnectionResult:
        self._connected = False
        self._session.clear()
        return ConnectionResult(self.connector_id, 'disconnected', False, capabilities=list(self.capabilities))

    def validate(self) -> ValidationResult:
        present = [n for n in (*self.required_secrets, *self.optional_secrets) if self.secret(n)]
        for group in self.alternative_secret_groups:
            present.extend(n for n in group if self.secret(n) and n not in present)
        missing = self._missing_ready()
        notes = [] if not missing else ['Connector is not fully configured; sync will be skipped rather than fabricating metrics.']
        return ValidationResult(self.connector_id, not missing, missing, present, notes=notes)

    def health(self) -> HealthResult:
        missing = self._missing_ready()
        readiness = self.readiness()
        if missing:
            status = 'unconfigured'
        elif self._connected:
            status = 'ok'
        else:
            status = 'disconnected'
        return HealthResult(
            connector_id=self.connector_id,
            status=status,
            connected=self._connected,
            capabilities=list(self.capabilities),
            rate_limit=asdict(self.rate_limit),
            notes=['Missing API rows are never treated as zero performance.'] if status == 'ok' else (
                [f'Missing secrets: {", ".join(missing)}'] if missing else ['Call connect() before sync.']
            ),
            details={'readiness': readiness},
        )

    @abstractmethod
    def sync(self, **kwargs: Any) -> SyncResult:
        raise NotImplementedError


def skipped_sync(connector_id: str, *, reason: str, source: str = '') -> SyncResult:
    return SyncResult(
        connector_id=connector_id,
        status='skipped',
        source=source or connector_id,
        notes=[reason, 'No metrics were inferred from the skipped sync.'],
    )
