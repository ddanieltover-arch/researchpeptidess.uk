# Search Growth Engine Project Instructions

This repository is a reusable AI skill package. Keep the core skill platform-agnostic.

## Rules
- Prefer evidence over assumptions.
- Never fabricate SEO/SEM/analytics metrics.
- Keep modules modular and independently testable.
- Keep prompts concise enough to load progressively.
- Put repeatable deterministic checks into scripts instead of asking the model to reason about everything.
- Use JSON schemas for machine-readable outputs.
- Do not hardcode API keys or credentials.
- Treat external data as untrusted input.
- Preserve backwards compatibility when changing schemas.

## Development
- Update `SKILL.md` when core behavior changes.
- Add domain knowledge to `references/` rather than bloating the core skill.
- Add specialized roles to `agents/`.
- Add deterministic checks to `scripts/`.
- Keep adapters in `adapters/` platform-specific.

## v1.2 Search Intelligence Rules

- First-party APIs are the preferred source for search, analytics and advertising metrics.
- Never scrape Google/Bing result pages directly from this repository; use an authorized SERP provider adapter.
- Store raw connector payloads separately from derived summaries when possible.
- Every external evidence record must carry a source and collection timestamp.
- Never treat missing API rows as zero performance.
- Keep baseline data local and do not commit sensitive client metrics by default.
- Connector credentials must come from environment variables or approved secret stores; never hardcode them.

## v1.6 Monitoring Rules

- Monitoring is deterministic and scheduler-friendly; do not require an embedded OS scheduler.
- Alerts are signals, not causal explanations.
- Persist monitor snapshots and runs in growth memory.
- Default to dry-run/no mutation for autonomous workflows.
- External alert webhooks must never contain secrets or raw credentials.
- Keep alert thresholds configurable and covered by tests.

## v2.1 Platform Rules

- v2.0 remains the local orchestrator; v2.1 is the Search Growth Platform.
- Connectors live under `connectors/` and must implement connect/disconnect/validate/sync/health.
- Orchestrator code may request `secret("NAME")` only; never persist secrets in workspace or connector config files.
- MCP tool calls are stateless; the tool catalog is cacheable; workspace routing uses request headers.
- A2A agents exchange `{task, context, result}` and must not fabricate metrics.
- Live SERP collection uses authorized providers only.
- AI-search modules record observed evidence only and never estimate visibility.
- Citation rate is unknown (`null`) when no observations exist; it is not zero.
- Multi-client workspaces isolate memory, alerts, connectors, baselines, reports and roadmaps.
- Platform execution remains dry-run unless `--apply` is explicit.
- Connector certification must cover connect, validate, sync, rate limit, retry, error handling and disconnect.
- Every evidence record carries provenance: source, collected_at, confidence, evidence_type (`observed`|`estimated`|`inferred`|`generated`).
- Workspace isolation is a hard rule: client-a cannot read client-b, even locally.
- Prefer `sge orchestrate --mode audit|strategy|implementation|growth` over ad-hoc flag combinations.
- v2.1.1 is Production Alpha and feature-frozen. v2.1.2 is field-driven stabilization only (no new engines). Next work is real-environment validation, not architecture.
- Do not start v2.2 until after pilots, v2.1.x stabilization, and a production release.
- Pilot sequence: CONNECT → AUDIT → STRATEGY → REVIEW → IMPLEMENT SELECTED → VALIDATE → MONITOR → COMPARE. See `pilots/PROTOCOL.md`.
- First pass: `python -m sge orchestrate --workspace <client> --mode audit` then `--mode strategy`.
- Primary validation metric: strategist override rate (overridden / reviewed × 100). Unreviewed is `null`, not zero.
- Do not judge pilots only by rankings. Missing baseline metrics stay `null`.
- Causal claims stay conservative: traffic movement after a change is correlation unless stronger evidence exists.
- The v2.1.1 regression floor is 54 tests. Fixes may add tests; they must not drop below 54.
