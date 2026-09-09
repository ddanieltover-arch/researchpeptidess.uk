from __future__ import annotations

from typing import Any

from .protocol import ConnectorError, utcnow
from .retry import is_transient, sanitize_error, with_retry
from intelligence.provenance import provenance

CERT_STEPS = ('connect', 'validate', 'sync', 'rate_limit', 'retry', 'error_handling', 'disconnect')


def count_records(evidence: dict[str, Any] | None) -> int | None:
    if not evidence:
        return None
    data = evidence.get('data', evidence) if isinstance(evidence, dict) else evidence
    if isinstance(data, list):
        return len(data)
    if not isinstance(data, dict):
        return None
    for key in ('rows', 'results', 'items', 'organic_results', 'pages'):
        if isinstance(data.get(key), list):
            return len(data[key])
    if isinstance(data.get('raw'), dict):
        nested = count_records({'data': data['raw']})
        if nested is not None:
            return nested
    return None


def _status_from_steps(steps: dict[str, Any], connection_status: str, sync_status: str | None) -> str:
    if connection_status == 'unconfigured' or not steps.get('validate', {}).get('configured'):
        return 'unconfigured'
    if steps.get('sync', {}).get('status') == 'error' or steps.get('error_handling', {}).get('ok') is False:
        return 'unhealthy'
    if sync_status == 'rate_limited' or steps.get('retry', {}).get('recovered'):
        return 'degraded'
    return 'healthy'


def certificate(
    connector: str,
    *,
    status: str,
    last_sync: str = '',
    records: int | None = None,
    capabilities: list[str] | None = None,
    steps: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Universal connector contract."""
    if status == 'unconfigured':
        record_count = None
    elif records is not None:
        record_count = records
    elif last_sync:
        record_count = 0
    else:
        record_count = None
    return {
        'connector': connector,
        'status': status,
        'last_sync': last_sync or '',
        'records': record_count,
        'capabilities': list(capabilities or []),
        'steps': steps or {},
        'certified_at': utcnow(),
        'provenance': provenance('sgos.connector_certification', evidence_type='observed'),
    }


def certify_connector(registry, connector_id: str, *, sync_kwargs: dict[str, Any] | None = None, retry_probe: Any | None = None) -> dict[str, Any]:
    """Run Connect → Validate → Sync → Rate Limit → Retry → Error Handling → Disconnect."""
    from .rate_limit import RateLimitSpec

    conn = registry.instance(connector_id)
    steps: dict[str, Any] = {}
    sync_kwargs = dict(sync_kwargs or {})

    connection = registry.connect(connector_id)
    steps['connect'] = {'ok': connection.connected or connection.status == 'unconfigured', 'status': connection.status, 'notes': connection.notes}

    validation = registry.validate(connector_id)
    steps['validate'] = {'ok': True, 'configured': validation.ok, 'missing_secrets': validation.missing_secrets}

    try:
        sync = registry.sync(connector_id, **sync_kwargs)
        steps['sync'] = {'ok': sync.status in {'ok', 'skipped', 'rate_limited'}, 'status': sync.status, 'notes': sync.notes}
    except Exception as exc:
        sync = None
        steps['sync'] = {'ok': False, 'status': 'error', 'notes': [sanitize_error(str(exc))]}

    limiter = registry.limiter
    probe_id = f'{connector_id}::cert-rate'
    first = limiter.allow(probe_id, RateLimitSpec(requests_per_minute=1))
    second = limiter.allow(probe_id, RateLimitSpec(requests_per_minute=1))
    steps['rate_limit'] = {'ok': first.allowed and not second.allowed, 'allowed': first.allowed, 'blocked': not second.allowed}

    retry_ok = True
    recovered = False
    if retry_probe is not None:
        calls = {'n': 0}

        def flaky():
            calls['n'] += 1
            if calls['n'] < 3:
                raise ConnectorError('HTTP 503 upstream temporarily unavailable')
            return True

        try:
            with_retry(flaky, attempts=3, delay_s=0)
            recovered = True
        except Exception:
            retry_ok = False
    else:
        retry_ok = is_transient(ConnectorError('HTTP 503 temporarily unavailable'))
    steps['retry'] = {'ok': retry_ok, 'recovered': recovered}

    error_ok = True
    try:
        if hasattr(conn, 'sync'):
            # A disconnected configured connector should not crash the certifier.
            registry.disconnect(connector_id)
            registry.connect(connector_id)
        error_ok = True
    except Exception as exc:
        error_ok = False
        steps['error_handling'] = {'ok': False, 'notes': [sanitize_error(str(exc))]}
    if 'error_handling' not in steps:
        notes = []
        if sync and sync.status == 'error':
            notes = sync.notes
        steps['error_handling'] = {'ok': error_ok, 'captured': sync.status == 'error' if sync else False, 'notes': notes}

    disconnected = registry.disconnect(connector_id)
    steps['disconnect'] = {'ok': not disconnected.connected, 'status': disconnected.status}

    required = set(CERT_STEPS)
    missing = [name for name in CERT_STEPS if name not in steps]
    if missing:
        raise ConnectorError(f'Certification missing steps: {missing}')
    assert required == set(steps)

    last_sync = (sync.collected_at if sync and sync.status == 'ok' else '') or ''
    records = count_records(sync.evidence) if sync and sync.status == 'ok' else None
    status = _status_from_steps(steps, connection.status, sync.status if sync else 'error')
    payload = certificate(
        connector_id,
        status=status,
        last_sync=last_sync,
        records=records,
        capabilities=list(conn.capabilities),
        steps=steps,
    )
    payload['readiness'] = conn.readiness()
    conn._session['certificate'] = payload
    return payload
