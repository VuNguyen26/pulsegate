# Current Progress

## Current Version

- Product/documentation version: `v1.2.0`
- Private npm workspace versions: `0.1.0`
- Existing annotated Git tag: `v1.0.0`
- `v1.0.0` remains at `407d03678674219e7228b15f0cd7a23074493f31`
- No Sprint 62 tag is created

## Latest Completed Sprint

Sprint 62 - Dashboard consumers/API keys/usage plans

## Sprint 62 Completion Summary

Sprint 62 converted the Sprint 61 Dashboard placeholders for core API management resources into bounded read-only operator views.

Delivered:

- Shared resource loading, empty, error, retry, and table primitives.
- Fixed browser/server resource contracts with strict validation.
- Consumer list/detail view at `/consumers`.
- Consumer-scoped API key metadata view at `/api-keys`.
- Usage plan list/detail view at `/usage-plans`.
- Persisted route configuration and runtime registry view at `/routes`.
- GET-only, no-store Dashboard BFF endpoints.
- Server-only read-only Gateway access.
- Safe metadata rendering without raw API key material.
- Explicit separation between persisted route configuration and runtime registry state.

Implementation commits:

- `7b7c3a0 feat(dashboard): add admin resource view foundation`
- `710d331 feat(dashboard): add consumer registry read view`
- `5b0dda3 feat(dashboard): add consumer api key read view`
- `b4cd8b1 feat(dashboard): add usage plan read view`
- `05e9443 feat(dashboard): add route registry read view`

Latest implementation commit before documentation finalization:

```txt
05e94437d7809c0aacae533bde18b0326ace2dc4
```

## Validation

Automated validation:

- Admin Dashboard: 21 test files / 110 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root typecheck passed.
- Root build passed.
- Docker Compose configuration passed.
- Working and staged diff checks passed.

Runtime validation across the resource checkpoints:

- Dashboard pages and fixed BFF resources returned successful responses.
- BFF and direct Gateway resource identities matched.
- Consumer-scoped API key results stayed within the selected consumer.
- Raw API key material was absent.
- Usage-plan list/detail identity parity passed.
- Persisted route list/detail parity passed.
- Runtime route snapshot parity passed.
- Persisted and runtime route resources remained distinct.
- Missing resources mapped to bounded `404` responses.
- Dashboard mutation methods returned `405`.
- Read-only Gateway route reload returned `403 ADMIN_API_KEY_READ_ONLY`.
- Registries remained unchanged.
- Successful runtime mutation count was zero.
- Full-access Admin key was absent from the Dashboard.
- Credential leakage checks passed.

## Preserved Boundaries

- No generic Admin API proxy.
- No browser-stored Admin credential.
- No Dashboard mutation controls.
- No consumer, API key, usage-plan, or route persistence changes.
- No quota source-of-truth changes.
- No successful/rejected event recorder changes.
- No scheduler execution expansion.
- No retention execution.
- No raw-event deletion.
- No database migration.
- No database-backed administrator, organization, tenant, or enterprise IAM model.
- No Developer Portal, Kubernetes, OpenTelemetry, or Loki scope.

## Documentation

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/sdlc/sprint-history/sprint-62.md`
- `docs/project-context/decisions/2026-07-10-dashboard-resource-read-views.md`

## Next Sprint

Sprint 63 - Dashboard quota/usage/rejected events

Recommended scope:

- Consumer and API key usage summaries.
- API key quota state.
- Usage plan usage summary.
- Successful usage event investigation.
- Rejected event summary and bounded drilldown.
- Fixed read-only BFF routes only unless mutation scope receives explicit approval.
- Preserve raw-event quota counting and successful/rejected source separation.

## Fixed Roadmap

### Backend Portfolio v1

- Sprints 45-60 complete.
- Sprint 60 released `v1.0.0`.

### Product/Platform Expansion v2

- 61 Admin Dashboard foundation - complete
- 62 Dashboard consumers/API keys/usage plans - complete
- 63 Dashboard quota/usage/rejected events
- 64 Dashboard rollup/retention/scheduler panels
- 65 Developer Portal foundation
- 66 Developer Portal API docs/key self-service foundation
- 67 Host-based routing
- 68 Weighted upstream routing
- 69 Service discovery foundation
- 70 Service discovery health/failover
- 71 Kubernetes foundation
- 72 Kubernetes runtime validation/docs
- 73 OpenTelemetry foundation
- 74 Loki foundation
- 75 Grafana observability integration
- 76 Platform RBAC/security hardening
- 77 UI state/responsive polish
- 78 E2E demo and bounded k6 validation
- 79 v2 docs/runbooks/architecture cleanup
- 80 v2.0.0 release
