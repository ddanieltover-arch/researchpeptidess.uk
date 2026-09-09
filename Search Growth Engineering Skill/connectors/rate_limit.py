from __future__ import annotations

import time
from collections import defaultdict, deque
from dataclasses import dataclass

from .protocol import RateLimitSpec


@dataclass
class RateLimitDecision:
    allowed: bool
    connector_id: str
    retry_after_s: float = 0.0
    remaining: int = 0


class RateLimiter:
    """In-process sliding-window limiter. Scheduler-friendly and deterministic for tests."""

    def __init__(self, clock=time.monotonic):
        self._clock = clock
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._specs: dict[str, RateLimitSpec] = {}

    def configure(self, connector_id: str, spec: RateLimitSpec) -> None:
        self._specs[connector_id] = spec

    def allow(self, connector_id: str, spec: RateLimitSpec | None = None) -> RateLimitDecision:
        limit = spec or self._specs.get(connector_id) or RateLimitSpec()
        now = self._clock()
        window = self._hits[connector_id]
        cutoff = now - 60.0
        while window and window[0] < cutoff:
            window.popleft()
        if len(window) >= limit.requests_per_minute:
            retry = max(0.0, 60.0 - (now - window[0]))
            return RateLimitDecision(False, connector_id, retry, 0)
        window.append(now)
        return RateLimitDecision(True, connector_id, 0.0, limit.requests_per_minute - len(window))
