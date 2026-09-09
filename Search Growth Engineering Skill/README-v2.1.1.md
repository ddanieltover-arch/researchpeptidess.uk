# v2.1.1 — Production Alpha stabilization

```text
SGOS v2.1.1
Production Alpha
Real Client Pilot Ready
Feature Freeze
```

Hardens v2.1 without expanding into v2.2. Feature development stops here. Next work is real-client pilots (`pilots/PROTOCOL.md`), then field-driven v2.1.x fixes. The regression floor is 54 tests.

- Connector certification contract (`connect`, `validate`, `sync`, `rate_limit`, `retry`, `error_handling`, `disconnect`)
- Evidence provenance (`observed` | `estimated` | `inferred` | `generated`)
- Hard workspace isolation (client-a cannot read client-b)
- Orchestrator modes: `audit`, `strategy`, `implementation`, `growth`
- MCP error sanitization and disk-tool workspace binding

```bash
python -m sge orchestrate --workspace client-a --mode audit
python -m sge connectors certify --id gsc
```
