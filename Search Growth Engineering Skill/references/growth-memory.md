# Growth Memory & Continuous Optimization

Growth Memory is the longitudinal evidence layer of Search Growth Engineering.

Store:
- time-stamped KPI snapshots
- source and date range for every snapshot
- implementation changes and deployments
- experiments and hypotheses
- observed outcomes
- strategic insights with evidence
- audit and monitoring run history

Rules:
1. Never overwrite historical observations; append snapshots and changes.
2. Preserve source, observation time and requested reporting window.
3. Compare like-for-like periods where possible.
4. Avoid causal claims from observational changes alone.
5. Treat tracking/schema/analytics changes as potential confounders.
6. Escalate meaningful regressions for investigation.
7. Record major decisions so future runs have context.

Suggested workflow:
`snapshot -> compare -> health -> diagnose -> act -> validate -> snapshot`
