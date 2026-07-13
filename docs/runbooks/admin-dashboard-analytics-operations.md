# Admin Dashboard Analytics Operations

<!-- pulsegate:sprint-64:start -->
## Sprint 64 operator runbook

Version: **v1.4.0**

### Pages

- /rollups — inspect bounded persisted usage or rejected-request rollups.
- /scheduler — inspect a fixed observational scheduler plan and closed runtime gate.
- /retention — inspect fixed 90-day dry-run candidate counts.

### Gateway read endpoints

- GET /internal/admin/analytics/rollups
- GET /internal/admin/analytics/scheduler-preview
- GET /internal/admin/analytics/retention-preview

Use a full-access or read-only Admin API key according to the existing Admin RBAC configuration. All requests are GET-only.

### Safety interpretation

- A scheduler preview does not mean that a scheduled job exists or that runtime invocation is enabled.
- untimeInvocationAllowed, untimeFactoryResolutionAllowed, ackfillServiceInvocationAllowed, and executeBackfillAllowed must remain alse.
- A retention candidate count is informational only.
- dryRunOnly must be 	rue; deleteAllowed, importsDeleteRepository, and executesRetention must remain alse.
- Rollup rows are persisted analytics summaries and never replace raw-event quota, billing, authentication, or audit truth.

### Troubleshooting

1. Confirm the Gateway and Dashboard Admin API configuration is present.
2. Confirm the read-only Admin key is accepted for GET endpoints.
3. Confirm the Dashboard BFF returns cache-control: no-store.
4. Treat strict DTO validation failures as a contract mismatch; do not bypass validation.
5. Never troubleshoot by adding browser-controlled execute/delete parameters.
<!-- pulsegate:sprint-64:end -->