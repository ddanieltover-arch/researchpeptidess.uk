from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Dict

@dataclass
class EvidenceEnvelope:
    source: str
    collected_at: str
    verified: bool
    data: Any
    notes: list[str]
    evidence_type: str = 'observed'
    confidence: float = 1.0

    @classmethod
    def make(cls, source: str, data: Any, *, verified: bool = True, notes: list[str] | None = None,
             evidence_type: str = 'observed', confidence: float = 1.0):
        return cls(
            source=source,
            collected_at=datetime.now(timezone.utc).isoformat(),
            verified=verified,
            data=data,
            notes=notes or [],
            evidence_type=evidence_type,
            confidence=confidence,
        )

    def to_dict(self) -> Dict[str, Any]:
        from intelligence.provenance import stamp
        return stamp(asdict(self), self.source, evidence_type=self.evidence_type, confidence=self.confidence, collected_at=self.collected_at)

class ConnectorError(RuntimeError):
    pass
