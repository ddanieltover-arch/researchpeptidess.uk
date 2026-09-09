# Platform v2.1

Search Growth Platform (SGOS) coordinates connectors, intelligence, and operations.

## Secrets

```python
from connectors import secret
secret("GSC_CLIENT_ID")
secret("GA4_PROPERTY_ID")
```

Set `SGE_SECRETS_BACKEND` to `aws`, `gcp`, `azure`, or `vault` when not using env/.env. Optional HTTP double: `SGE_SECRETS_HTTP_ENDPOINT`.

## Connectors

```python
from connectors import ConnectorRegistry
registry = ConnectorRegistry()
registry.connect("gsc")
registry.sync("gsc")
registry.health("gsc")
```

Unconfigured connectors skip sync. They do not emit zero metrics.

## Workspaces

`workspaces/<client>/` contains memory, alerts, connectors, baselines, reports and roadmaps. `config.json` must never include secrets.

## Modes

`audit`, `strategy`, `implementation`, `growth` via `sge orchestrate --mode ...`.

## Isolation

`client-a` cannot read `client-b`. `Workspace.resolve` and `read_json` raise `IsolationError` on escape.

## Provenance

Every record: `{source, collected_at, confidence, evidence_type}` where type is `observed`, `estimated`, `inferred`, or `generated`.
