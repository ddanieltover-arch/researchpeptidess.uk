from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any
import uuid


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class A2AMessage:
    task: str
    context: dict[str, Any] = field(default_factory=dict)
    result: dict[str, Any] = field(default_factory=dict)
    agent: str | None = None
    role: str = 'user'
    task_id: str | None = None
    context_id: str | None = None
    created_at: str = field(default_factory=utcnow)

    def __post_init__(self) -> None:
        self.task_id = self.task_id or f'task-{uuid.uuid4().hex[:12]}'
        self.context_id = self.context_id or f'ctx-{uuid.uuid4().hex[:12]}'

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_a2a(self) -> dict[str, Any]:
        return {
            'kind': 'message',
            'role': self.role,
            'taskId': self.task_id,
            'contextId': self.context_id,
            'parts': [
                {'kind': 'text', 'text': self.task},
                {'kind': 'data', 'data': {'context': self.context, 'result': self.result}},
            ],
            'metadata': {'agent': self.agent, 'created_at': self.created_at},
        }

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> 'A2AMessage':
        if 'task' in payload:
            return cls(
                task=str(payload.get('task') or ''),
                context=payload.get('context') or {},
                result=payload.get('result') or {},
                agent=payload.get('agent'),
                role=payload.get('role') or 'user',
                task_id=payload.get('task_id') or payload.get('taskId'),
                context_id=payload.get('context_id') or payload.get('contextId'),
            )
        parts = payload.get('parts') or []
        text = next((p.get('text') for p in parts if p.get('kind') == 'text'), '')
        data = next((p.get('data') for p in parts if p.get('kind') == 'data'), {}) or {}
        return cls(
            task=str(text or ''),
            context=data.get('context') or {},
            result=data.get('result') or {},
            role=payload.get('role') or 'user',
            task_id=payload.get('taskId'),
            context_id=payload.get('contextId'),
        )


class Agent:
    name = 'agent'
    description = ''
    skills: tuple[str, ...] = ()

    def card(self) -> dict[str, Any]:
        return {
            'name': self.name,
            'description': self.description,
            'protocol': 'A2A',
            'skills': [{'id': skill, 'name': skill} for skill in self.skills],
            'capabilities': {'streaming': False},
        }

    def handle(self, message: A2AMessage) -> A2AMessage:
        raise NotImplementedError

    def reply(self, message: A2AMessage, result: dict[str, Any], *, task: str | None = None) -> A2AMessage:
        return A2AMessage(
            task=task or message.task,
            context=message.context,
            result=result,
            agent=self.name,
            role='agent',
            task_id=message.task_id,
            context_id=message.context_id,
        )
