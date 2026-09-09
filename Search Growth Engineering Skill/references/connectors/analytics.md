# Google Analytics 4 Connector

Use the Google Analytics Data API `runReport` method for first-party website/app analytics. Requests require a GA4 property ID and authorization.

## Required environment
- `GA4_PROPERTY_ID`
- `GA4_ACCESS_TOKEN` or `GOOGLE_APPLICATION_CREDENTIALS`

## Interpretation rules
- API metrics can differ from the Analytics UI due to reporting/sampling/aggregation behavior.
- Never equate sessions with users.
- Revenue and conversion metrics are only valid if the property is configured to collect them.
- Keep organic acquisition filters explicit.
