# A2A agents

Specialists exchange:

```json
{"task": "", "context": {}, "result": {}}
```

Agents: TechnicalSEOAgent, ContentAgent, GEOAgent, AIOAgent, SEM_Agent, AnalyticsAgent, CompetitorAgent, CROAgent.

```python
from agents import AgentOrchestrator, A2AMessage
AgentOrchestrator().fanout(A2AMessage(task="audit", context={"url": "https://example.com"}))
```

Agents must not fabricate metrics. AIOAgent only analyzes supplied observations.
