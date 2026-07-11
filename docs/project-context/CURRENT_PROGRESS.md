# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v1.3.0

Private npm workspace package versions remain `0.1.0`.

The protected annotated Git tag `v1.0.0` remains unchanged at commit `407d03678674219e7228b15f0cd7a23074493f31`.

## Latest Completed Sprint

Sprint 63 - Dashboard quota/usage/rejected events

## Latest Implementation Commit Before Documentation Finalization

- `d9823e76baf7a0c38e192482ee8ff15f5ed6d5d9`
- `feat(dashboard): add rejected events page`

Sprint 63 implementation commits:

- `8bf27a2 feat(dashboard): add analytics read foundation`
- `9a26de8 feat(dashboard): add successful usage read boundary`
- `d6a0c38 feat(dashboard): add usage analytics page`
- `ab550d0 feat(dashboard): add rejected events read boundary`
- `d9823e7 feat(dashboard): add rejected events page`

## Sprint 63 Product State

Implemented Dashboard pages:

```txt
/
/consumers
/api-keys
/usage-plans
/routes
/usage-analytics
/rejected-events
```

Remaining roadmap placeholders:

```txt
/rollups
/scheduler
/retention
```

Sprint 63 browser-facing fixed resources:

```txt
GET /api/admin/usage/consumers/:consumerId/summary
GET /api/admin/usage/api-keys/:apiKeyId/summary
GET /api/admin/api-keys/:apiKeyId/quota
GET /api/admin/usage-plans/:usagePlanId/usage-summary
GET /api/admin/usage/events
GET /api/admin/api-rejections/summary
GET /api/admin/api-rejections/events
```

## Delivered Behavior

- Consumer usage summary lookup with bounded filters.
- API key usage summary lookup with bounded filters.
- API key quota state lookup.
- Usage-plan current-window summary lookup.
- Successful usage event investigation.
- Rejected request summary with reason/status breakdowns.
- Rejected event investigation.
- Shared summary-grid, analytics-filter, and cursor-navigation components.
- Default event limit 20 and maximum limit 100.
- Maximum date range 31 days.
- Cursor-only navigation in the Dashboard UI.
- Unknown, duplicate, offset, and rollup-flag query keys fail closed.
- Same-origin fixed Admin URL enforcement.
- `cache: no-store` browser and server requests.
- Exact browser/server DTO validation.
- Rejected-event metadata removed before the BFF/browser DTO.
- No Dashboard mutation controls.

## Validation

- Admin Dashboard: 38 test files / 200 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root workspace tests passed.
- Root typecheck passed.
- Root production build passed.
- Docker Compose configuration passed.
- Diff checks passed.
- Next.js build exposed both new pages and seven new dynamic BFF resources.
- Docker/PostgreSQL runtime validation was not required because Sprint 63 introduced no Gateway implementation, database query, schema migration, persistence path, container configuration, quota behavior, scheduler execution, retention execution, or raw-event deletion path.

## Safety Boundaries

- No generic Admin API proxy.
- No browser-stored Admin credential.
- No full-access Admin key in the Dashboard runtime.
- `ADMIN_READ_ONLY_API_KEY` stays server-side.
- No raw issued API key exposure.
- No raw rejected-event metadata rendering.
- No quota-counting source change.
- No successful/rejected event source merging.
- No rollup runtime flag exposure in the Dashboard.
- No scheduler execution expansion.
- No retention execute command or operator delete path.
- No raw-event deletion.
- No database migration.
- No new dependency.
- No enterprise IAM or organization model.
- No Developer Portal before Sprint 65.
- No Kubernetes before Sprint 71.
- No OpenTelemetry before Sprint 73.
- No Loki before Sprint 74.
- `v2.0.0` remains reserved for Sprint 80.

## Next Sprint

Sprint 64 - Dashboard rollup/retention/scheduler panels

Expected direction:

- Add bounded read-only rollup inspection.
- Add scheduler preview/runtime-state inspection without widening execution.
- Add retention dry-run and non-destructive preview inspection.
- Reuse fixed same-origin GET-only BFF routes.
- Preserve current scheduler and retention safety flags.
- Do not add retention deletion.
- Do not create autonomous or external scheduler execution.
- Do not change quota counting.

## Documentation

Sprint 63 documentation set:

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/api-usage-analytics.md`
- `docs/runbooks/api-rejected-events.md`
- `docs/runbooks/usage-plans-and-quotas.md`
- `docs/sdlc/sprint-history/sprint-63.md`
- `docs/project-context/decisions/2026-07-11-dashboard-quota-usage-rejected-events.md`

## Fixed Roadmap

### Backend Portfolio v1

- Sprints 45-60 complete.
- Sprint 60 released `v1.0.0`.

### Product/Platform Expansion v2

- 61 Admin Dashboard foundation - complete
- 62 Dashboard consumers/API keys/usage plans - complete
- 63 Dashboard quota/usage/rejected events - complete
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
