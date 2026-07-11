# AI Handoff

## Current Version

- Product/documentation version: `v1.3.0`
- Private npm workspace versions: `0.1.0`
- Existing protected annotated release tag: `v1.0.0`
- `v1.0.0` target: `407d03678674219e7228b15f0cd7a23074493f31`
- Do not create, move, delete, or recreate a tag without explicit approval
- `v2.0.0` remains reserved for Sprint 80

## Latest Completed Sprint

- Sprint 63 - Dashboard quota/usage/rejected events

## Latest Implementation Commit Before Documentation Finalization

- `d9823e76baf7a0c38e192482ee8ff15f5ed6d5d9`
- `feat(dashboard): add rejected events page`

Sprint 63 implementation commits:

- `8bf27a2 feat(dashboard): add analytics read foundation`
- `9a26de8 feat(dashboard): add successful usage read boundary`
- `d6a0c38 feat(dashboard): add usage analytics page`
- `ab550d0 feat(dashboard): add rejected events read boundary`
- `d9823e7 feat(dashboard): add rejected events page`

## Current Dashboard State

Real pages:

```txt
/
/consumers
/api-keys
/usage-plans
/routes
/usage-analytics
/rejected-events
```

Placeholders reserved for Sprint 64:

```txt
/rollups
/scheduler
/retention
```

Sprint 63 fixed BFF resources:

```txt
GET /api/admin/usage/consumers/:consumerId/summary
GET /api/admin/usage/api-keys/:apiKeyId/summary
GET /api/admin/api-keys/:apiKeyId/quota
GET /api/admin/usage-plans/:usagePlanId/usage-summary
GET /api/admin/usage/events
GET /api/admin/api-rejections/summary
GET /api/admin/api-rejections/events
```

## Sprint 63 Read Boundary

- Browser code calls only fixed Dashboard BFF resources.
- Dashboard server uses only `ADMIN_READ_ONLY_API_KEY`.
- Full-access `ADMIN_API_KEY` must remain absent.
- Fixed Admin URLs must be same-origin with the configured Gateway origin and under `/internal/admin/`.
- Requests are GET-only and no-store.
- Browser and server DTOs validate exact keys and bounded values.
- IDs are bounded to 128 characters.
- Route paths are bounded to 256 characters.
- Date ranges are bounded to 31 days.
- Event limit defaults to 20 and is capped at 100.
- Cursor values are bounded opaque base64url-like strings.
- Unknown keys, duplicate keys, offset, and rollup flags fail closed.
- Successful usage and rejected/security events remain separate.
- Rejected-event metadata is removed before BFF/browser output.
- No mutation control exists.

## Validation Baseline

- Admin Dashboard: 38 test files / 200 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root workspace tests passed.
- Root typecheck passed.
- Root build passed.
- Docker Compose configuration passed.
- Diff checks passed.
- Next.js production routes include `/usage-analytics`, `/rejected-events`, and all seven Sprint 63 BFF resources.
- Docker/PostgreSQL runtime validation was not required for this Dashboard-only, DB-free implementation scope.

## Safety Boundaries

Do not change without explicit roadmap approval:

- No generic Admin API proxy.
- No browser-stored Admin credentials.
- No full-access Admin key in Dashboard runtime.
- No raw API key material.
- No raw rejected-event metadata rendering.
- No quota-counting source change.
- No successful/rejected event source merging.
- No Dashboard rollup runtime flag.
- No background or external scheduler execution expansion.
- No retention execute command or operator-facing delete path.
- No raw-event deletion.
- No enterprise IAM or organization model.
- No Developer Portal before Sprint 65.
- No Kubernetes before Sprint 71.
- No OpenTelemetry before Sprint 73.
- No Loki before Sprint 74.

## Next Sprint

Sprint 64 - Dashboard rollup/retention/scheduler panels

Expected direction:

- Reuse the fixed read-resource and analytics component foundations.
- Add bounded rollup inspection.
- Add scheduler plan/runtime-state inspection without opening new execution paths.
- Add retention dry-run/operator-preview inspection without exposing delete execution.
- Keep quota counting on `gateway.api_usage_events`.
- Keep successful and rejected event stores separate.
- Keep raw-event deletion blocked.

## Required Documentation Checklist at Future Sprint Finalization

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
