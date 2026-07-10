# AI Handoff

## Current Version

- Product/documentation version: `v1.2.0`
- Private npm workspace versions: `0.1.0`
- Existing annotated release tag: `v1.0.0`
- `v1.0.0` target: `407d03678674219e7228b15f0cd7a23074493f31`
- Do not create a new tag without explicit approval

## Latest Completed Sprint

- Sprint 62 - Dashboard consumers/API keys/usage plans

## Latest Implementation Commit Before Docs Finalization

- `05e94437d7809c0aacae533bde18b0326ace2dc4`
- `feat(dashboard): add route registry read view`

Sprint 62 implementation commits:

- `7b7c3a0 feat(dashboard): add admin resource view foundation`
- `710d331 feat(dashboard): add consumer registry read view`
- `5b0dda3 feat(dashboard): add consumer api key read view`
- `b4cd8b1 feat(dashboard): add usage plan read view`
- `05e9443 feat(dashboard): add route registry read view`

## Sprint 62 Product State

Implemented Dashboard pages:

```txt
/
/consumers
/api-keys
/usage-plans
/routes
```

The remaining analytics, rollup, scheduler, and retention navigation items stay assigned to Sprints 63-64.

Browser-facing fixed resources:

```txt
GET /api/admin/runtime-status
GET /api/admin/consumers
GET /api/admin/consumers/:consumerId
GET /api/admin/consumers/:consumerId/api-keys
GET /api/admin/usage-plans
GET /api/admin/usage-plans/:usagePlanId
GET /api/admin/routes
GET /api/admin/routes/:routeId
GET /api/admin/routes/runtime
```

Gateway fixed resources used by the Dashboard:

```txt
GET /internal/admin/consumers
GET /internal/admin/consumers/:consumerId
GET /internal/admin/consumers/:consumerId/api-keys
GET /internal/admin/usage-plans
GET /internal/admin/usage-plans/:usagePlanId
GET /internal/admin/routes
GET /internal/admin/routes/:routeId
GET /internal/admin/routes/runtime
```

## Dashboard Read Boundary

- The browser calls only fixed Dashboard BFF resources.
- The Dashboard server uses only `ADMIN_READ_ONLY_API_KEY`.
- Full-access `ADMIN_API_KEY` must not be provided to the Dashboard.
- All added BFF routes are GET-only and no-store.
- Browser and server contracts validate bounded DTOs.
- Shared states cover loading, empty, error, retry, and table rendering.
- No arbitrary method, path, host, target, or header forwarding exists.
- No raw API key material is exposed.
- Persisted route configuration and runtime route state are separate resources.
- No mutation controls exist for consumers, API keys, usage plans, or routes.

## Validation Baseline

- Admin Dashboard: 21 test files / 110 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root typecheck passed.
- Root build passed.
- Compose config passed.
- Diff checks passed.
- Resource runtime parity checks passed.
- Missing-resource mappings passed.
- Mutation-method rejection passed.
- Read-only Gateway reload rejection passed.
- Successful runtime mutation count: 0.
- Runtime credential leakage: absent.

## Safety Boundaries

Do not change without explicit roadmap approval:

- No generic Admin API proxy.
- No browser-stored Admin credentials.
- No full-access Admin key in Dashboard runtime.
- No raw issued API key rendering or storage.
- No quota-counting source change.
- No successful/rejected event source merging.
- No background or external scheduler execution expansion.
- No retention execute command or operator delete path.
- No raw-event deletion.
- No enterprise IAM or organization model.
- No Developer Portal before Sprint 65.
- No Kubernetes before Sprint 71.
- No OpenTelemetry before Sprint 73.
- No Loki before Sprint 74.
- `v2.0.0` remains reserved for Sprint 80.

## Next Sprint

Sprint 63 - Dashboard quota/usage/rejected events

Expected direction:

- Reuse the fixed read-resource/BFF foundation.
- Add consumer and API key usage summaries.
- Add API key quota state and usage-plan usage summary.
- Add successful usage event investigation.
- Add rejected event summary and bounded event drilldown.
- Keep `gateway.api_usage_events` as quota source of truth.
- Keep successful and rejected event stores separate.
- Do not add scheduler or retention execution.
- Do not delete raw events.

## Sprint 62 Documentation Checklist

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/sdlc/sprint-history/sprint-62.md`
- `docs/project-context/decisions/2026-07-10-dashboard-resource-read-views.md`

## Fixed Roadmap

### Backend Portfolio v1

- 45 Fail-Closed Error Model
- 46 Command Dry-Run Service Invocation Wiring Contract
- 47 Command Dry-Run Runtime Service Invocation
- 48 Dry-Run Runtime Output Hardening
- 49 Command Execute Contract Review
- 50 Command Execute Wiring Preview blocked-by-default
- 51 Command Execute Runtime Wiring with strict guardrails
- 52 Rollup Summary API Switch Preview
- 53 Switch selected summary reads to rollup read model with fallback
- 54 Background Scheduler Contract/Runner
- 55 Background Scheduler Runtime Wiring with guardrails
- 56 Retention Execute Contract Review
- 57 Retention Execute Preview Hardening/rollback expectation
- 58 Minimal Admin/RBAC hardening
- 59 Observability + Grafana/k6 lightweight validation
- 60 Final polish, docs, demo script, architecture cleanup, release v1.0.0

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
## Required Docs Checklist at Future Sprint Finalization

Always audit and update:

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- relevant runbooks
- `docs/sdlc/sprint-history/sprint-N.md`
- `docs/project-context/decisions/YYYY-MM-DD-*.md`

Do not finalize a sprint after updating only a subset of this recurring documentation set.
