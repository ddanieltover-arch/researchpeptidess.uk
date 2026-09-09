from __future__ import annotations

import re
import time
from typing import Callable, TypeVar

from .protocol import ConnectorError

T = TypeVar('T')

TRANSIENT_STATUS = (429, 500, 502, 503, 504)
_BEARER = re.compile(r'Bearer\s+\S+', re.I)
_QUERY_SECRET = re.compile(r'(api[_-]?key|token|secret|password)=([^&\s]+)', re.I)


def sanitize_error(message: str) -> str:
    text = _BEARER.sub('Bearer [redacted]', str(message))
    return _QUERY_SECRET.sub(lambda m: f'{m.group(1)}=[redacted]', text)


def is_transient(exc: BaseException) -> bool:
    text = str(exc)
    if any(f'HTTP {code}' in text for code in TRANSIENT_STATUS):
        return True
    lowered = text.lower()
    return 'timeout' in lowered or 'timed out' in lowered or 'network error' in lowered or 'temporarily' in lowered


def with_retry(fn: Callable[[], T], *, attempts: int = 3, delay_s: float = 0.0, sleep=time.sleep) -> T:
    last: BaseException | None = None
    tries = max(1, int(attempts))
    for index in range(tries):
        try:
            return fn()
        except Exception as exc:
            last = exc
            if index >= tries - 1 or not is_transient(exc):
                if isinstance(exc, ConnectorError):
                    raise ConnectorError(sanitize_error(str(exc))) from exc
                raise
            if delay_s:
                sleep(delay_s * (2 ** index))
    assert last is not None
    raise last
