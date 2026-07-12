# PulseGate

High-Traffic API Gateway & Observability Platform.

## Current product/documentation version - v1.11.0

**Latest completed sprint:** Sprint 71 - Kubernetes foundation.

Current validation baseline:

- Admin Dashboard: 53 test files / 244 tests passed.
- API Gateway: 155 test files / 1140 tests passed.
- Developer Portal: 2 test files / 7 tests passed.
- Root release validation, typecheck, production builds, Prisma validation, Compose validation, and Git diff checks passed.
- Production backend Docker image builds passed.
- Product Service and API Gateway migration commands passed against temporary PostgreSQL with 1 public migration and 11 Gateway migrations.
- Kustomize rendered 13 base resources, 10 local bootstrap resources, and 13 local application resources.

Private npm workspace versions remain `0.1.0`.

The protected annotated Git tag `v1.0.0` remains unchanged at commit `407d03678674219e7228b15f0cd7a23074493f31`. Sprint 71 creates no Git tag.

Next planned sprint: **Sprint 72 - Kubernetes runtime validation and deployment documentation**.

---
## Current Status

PulseGate currently includes:

- Fastify API Gateway
- Product Service
- Docker Compose runtime
- PostgreSQL with Prisma
- Redis
- Prometheus
- Grafana
- Bounded Docker-based k6 smoke validation
- GitHub Actions CI/CD
- Admin Dashboard foundation
- Server-only read-only Admin API boundary
- Dashboard runtime connectivity status
- Dashboard Docker Compose runtime on port 3003
- Dashboard consumer registry read view
- Dashboard consumer-scoped API key metadata view
- Dashboard usage plan read view
- Dashboard persisted/runtime route registry read view
- Dashboard consumer and API key usage summary views
- Dashboard API key quota state view
- Dashboard usage-plan current-window summary view
- Dashboard successful usage event investigation with bounded filters and cursor navigation
- Dashboard rejected request summary and event drilldown- Dynamic route config
- Runtime route registry
- Catch-all dynamic router
- API consumer management
- DB-backed issued API keys
- API usage tracking
- Filtered successful usage summary APIs
- Successful usage events raw listing with cursor pagination
- Usage plans and quotas
- Runtime quota enforcement
- Quota observability endpoints
- Rejected request tracking
- Rejected events summary
- Rejected events raw listing with cursor pagination
- Filterable rejected event drilldown
- Analytics rollup calculation foundation
- Analytics rollup persistence foundation
- Analytics rollup manual backfill command
- Analytics rollup read model foundation
- Analytics rollup scheduling foundation
- Analytics rollup schedule preview command
- Analytics rollup scheduler runner contract
- Analytics rollup scheduler preview command
- Analytics rollup scheduler execution wiring review
- Analytics rollup scheduler command dry-run design review
- Analytics rollup scheduler command dry-run invocation contract and readiness review
- Analytics rollup scheduler command dry-run invocation design review
- Analytics rollup scheduler command dry-run service invocation implementation design
- Analytics rollup scheduler command dry-run service invocation wiring readiness review
- Analytics rollup scheduler command dry-run service invocation fail-closed error model
- Analytics rollup scheduler command dry-run service invocation wiring contract
- Analytics rollup scheduler dry-run backfill request mapper
- Analytics rollup scheduler command dry-run service invocation request mapper design
- Analytics rollup scheduler dry-run service adapter boundary
- Analytics rollup scheduler command dry-run service adapter boundary design
- Analytics rollup scheduler command dry-run service adapter preview output integration
- Analytics rollup scheduler command dry-run runtime service invocation
- Analytics rollup scheduler command dry-run runtime consistency output
- Analytics rollup scheduler command dry-run runtime blocked-path tests
- Analytics rollup scheduler command execute contract review
- Analytics rollup scheduler command execute readiness review
- Analytics rollup scheduler command execute operator output review
- Analytics rollup scheduler command execute wiring preview
- Analytics rollup background scheduler contract/runner output
- Analytics rollup summary API switch preview
- Rollup summary preview exposed on selected summary APIs behind explicit flag
- Selected summary runtime reads can use rollup read model behind explicit flag with raw-summary fallback
- Internal analytics rollup read endpoint
- Analytics retention dry-run safety foundation
- Analytics retention dry-run command
- Analytics retention execution guardrails foundation
- Analytics retention execution preview command
- Analytics retention delete batch plan model
- Analytics retention repository safety contract
- Analytics retention delete repository port and operation planner
- Analytics retention Prisma delete repository implementation behind guardrails
- Analytics retention execution service orchestration preview
- Analytics retention execution service summary model
- Analytics retention execution candidate count loader
- Analytics retention candidate-read execution preview composition
- Analytics retention operator preview output model
- Analytics retention operator preview command runner
- DB-backed analytics retention operator preview command
- Analytics retention operator preview safety and CLI hardening

Latest validation:

- Admin Dashboard: 38 test files / 200 tests passed
- API Gateway: 136 test files / 988 tests passed
- npm run typecheck passed
- npm run build passed
- docker compose config --quiet passed
- git diff checks passed
- Sprint 62 runtime parity and read-only security checks passed
- Successful runtime mutation count remained zero

---

## Tech Stack

- Node.js
- TypeScript
- Fastify
- npm workspaces
- Vitest
- Docker Compose
- PostgreSQL
- Prisma
- Redis
- Prometheus
- Grafana
- GitHub Actions

---

## Local Ports

- API Gateway: 3000
- Product Service: 3001
- Grafana: 3002
- PostgreSQL: 5432
- Redis: 6379
- Prometheus: 9090

---

## Main Runtime Features

Current gateway capabilities:

- GET /health
- GET /metrics
- GET /api/product-service/health
- GET /api/products
- Dynamic /api/* catch-all dispatcher
- Runtime route registry
- Runtime route reload
- Shared downstream proxy pipeline
- DB-backed API key authentication
- Env API key fallback
- JWT authentication
- Redis-backed rate limiting
- Redis response caching
- API usage recording
- Usage plan quota enforcement
- Quota observability
- Rejected request event recording
- Successful usage analytics
- Rejected request analytics
- Analytics rollup read model
- Analytics rollup schedule preview planning
- Analytics rollup scheduler runner preview planning
- Analytics retention dry-run planning
- Analytics retention execution guard preview
- Analytics retention repository safety primitives
- Analytics retention execution service orchestration preview
- Structured access logs
- Prometheus metrics with bounded matched-route templates and fixed `__unmatched__` fallback
- Provisioned five-panel Grafana gateway dashboard
- Bounded Docker-based k6 health smoke

Current internal/admin capabilities:

- Route config management
- Runtime route registry inspection
- Runtime route reload
- API consumer management
- API key issue/list/revoke
- API key usage plan assignment
- Usage plan create/list/detail/update
- Consumer usage summary with filters
- API key usage summary with filters
- Successful usage events raw listing with safe offset and cursor pagination
- API key quota state
- Usage plan usage summary
- Rejected events summary
- Filtered rejected events summary
- Rejected events raw listing with safe offset and cursor pagination
- Read-only analytics rollup listing through GET /internal/admin/analytics/rollups

---

## Current Usage, Quota, Rejection, Rollup, and Retention Behavior

Successful usage behavior:

- Successful downstream proxy/cache handler responses are recorded into gateway.api_usage_events.
- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- Consumer and API key usage summaries support filters by time range, route, method, status code, cache status, and API key auth source.
- Raw successful usage events can be listed through GET /internal/admin/usage/events.
- Usage event listing supports offset pagination with limit, offset, total, and hasNextPage, plus cursor pagination with nextCursor.
- Usage event listing filters include from, to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.

Rejected request behavior:

- Failed auth, rate-limited, and quota-denied requests are recorded into gateway.api_rejected_events.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic observability.
- Rejected events can be queried through aggregate summary and raw listing endpoints with offset and cursor pagination.
- Raw API keys, JWTs, and Authorization headers are not stored or returned.

Analytics rollup behavior:

- Rollup persistence is separate for successful usage and rejected/security traffic.
- Rollup upserts use a dimensionHash to avoid nullable-dimension uniqueness issues.
- Manual analytics rollup backfill is available through npm run analytics:rollup:backfill.
- Non-destructive rollup schedule preview is available through npm run analytics:rollup:schedule-preview.
- Non-destructive rollup scheduler preview is available through npm run analytics:rollup:scheduler-preview.
- Schedule preview plans a rollup window and returns safety output, but does not create scheduled jobs, read events, persist rollups, affect quota counting, or delete raw events.
- Scheduler preview default mode converts a schedule plan into dry-run backfill request contracts without invoking backfill service, reading events, or persisting rollups.
- Scheduler preview accepts both --option value and --option=value CLI styles.
- Scheduler preview exposes executionDecision.wiringReview so reviewers can see the current command-preview-only capability and the next safe wiring step.
- Scheduler preview exposes dryRunDesignReview for command:dry-run requests while keeping the request blocked and currentlyWired=false.
- Scheduler preview exposes dryRunInvocationContract for command:dry-run requests while keeping serviceInvocationCurrentlyAllowed=false, eventReadCurrentlyAllowed=false, rollupPersistenceCurrentlyAllowed=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Scheduler preview exposes dryRunInvocationReadiness for command:dry-run requests, including plannedBackfillRequestCount, plannedSources, plannedGranularity, allPlannedRequestsDryRunOnly, canInvokeBackfillService=false, canReadEvents=false, and canPersistRollups=false.
- Scheduler preview exposes dryRunInvocationDesignReview for command:dry-run requests, documenting the future command-to-backfill-service dry-run boundary while keeping event reads, rollup persistence, quota changes, and raw event deletion disallowed.
- Scheduler preview exposes dryRunServiceInvocationImplementationDesign for command:dry-run requests, documenting the future scheduler-command-dry-run-to-rollup-backfill-service implementation boundary while keeping implementation and service invocation disallowed.
- Scheduler preview exposes dryRunServiceInvocationWiringReadinessReview for command:dry-run requests, documenting that future service invocation wiring is still not ready, not wired, and not currently allowed.
- Scheduler preview exposes dryRunServiceInvocationFailClosedErrorModel for command:dry-run requests, documenting operator-visible fail-closed behavior for future service invocation errors while keeping service invocation, partial persistence, quota mutation, and raw event deletion disallowed.
- Scheduler preview exposes dryRunServiceInvocationWiringContract for command:dry-run requests, documenting the future command-only dry-run request/response contract, source-scoped result summary, event-limit guardrail, max-bucket bound, and operator safety output while keeping service invocation disallowed.
- Scheduler preview exposes dryRunServiceInvocationRequestMapperDesign for command:dry-run requests, documenting the mapper-only boundary from scheduler backfill request contracts to backfill service run input while keeping service invocation, event reads, rollup persistence, quota changes, and raw event deletion disallowed.
- Scheduler preview exposes dryRunServiceAdapterBoundaryDesign for command:dry-run requests, documenting the future mapped-input-to-rollup-backfill-service dry-run adapter boundary while keeping adapter invocation and service invocation disallowed.
- Scheduler preview accepts --event-limit <n> for command:dry-run adapter preview output and direct CLI runtime dry-run service invocation.
- Scheduler preview exposes dryRunServiceAdapterPreviews for command:dry-run requests when --event-limit is provided, with one planned service-result preview per mapped source.
- Direct CLI scheduler command dry-run with --execution-mode dry-run and --event-limit <n> invokes AnalyticsRollupBackfillService.runBackfill through a runtime Prisma-backed service factory in dry-run mode only.
- Runtime command dry-run emits dryRunServiceInvocationResults with one service-dry-run-invoked result per source and serviceResult.mode=dry-run.
- Runtime command dry-run emits executionDecision.wiringReview.runtimeConsistency with status=runtime-dry-run-service-invocation-wired.
- Scheduler preview exposes commandExecuteContractReview for command:execute requests while keeping execute blocked with backfill-execution-not-wired.
- Scheduler preview exposes commandExecuteReadinessReview for command:execute requests, derived from the runner plan and preserving no service invocation, no execute backfill, no event reads, no rollup persistence, no quota mutation, and no raw event deletion.
- Scheduler preview exposes commandExecuteOperatorOutputReview for command:execute requests, including explicit operator confirmation, blocked reason, readiness status, contract review status, rollup-tables-only persistence scope, rollback expectation, source-scoped planned requests, safety flags, no quota mutation, and no raw event deletion.
- Dry-run service invocation remains command-only, event-limit guarded, max-bucket guarded, source-separated, operator-visible, and non-destructive.
- Scheduler dry-run backfill request mapper maps ready runner backfill requests into dry-run AnalyticsRollupBackfillRunInput contracts without invoking the backfill service.
- Scheduler dry-run service adapter boundary validates mapped dry-run service inputs and produces planned service-result previews without calling AnalyticsRollupBackfillService.runBackfill.
- Scheduler execution decision distinguishes dry-run blocking from execute blocking: dry-run is blocked by backfill-service-invocation-not-wired, while execute is blocked by backfill-execution-not-wired.
- Process-local dry-run remains blocked with automatic-trigger-not-wired and does not expose command dryRunDesignReview.
- GET /internal/admin/analytics/rollups exposes read-only usage or rejected rollup rows.
- Rollup read supports source, from, to, granularity, limit, and safe dimension filters.
- Current runtime summary and listing APIs still read raw event tables.
- Rollup tables are not used for quota counting.

Analytics retention behavior:

- Retention dry-run can count candidate raw events older than configured cutoffs.
- Dry-run retention policy parsing supports usage, rejected, or both sources.
- Dry-run command is available through npm run analytics:retention:dry-run.
- Retention dry-run output reports dryRunOnly=true and deleteAllowed=false.
- Execution guardrails model explicit execute previews, confirmation phrase, hard delete limit, candidate recheck requirement, and delete batch caps.
- Execution preview command is available through npm run analytics:retention:execution-preview.
- Execution preview does not connect to the database.
- Execution preview reports deleteImplementationAvailable=false.
- Repository-level retention delete safety primitives exist behind guardrails.
- Prisma delete repository implementation deletes only bounded selected IDs after safety decision and candidate recheck checks.
- Service-level retention execution preview composes policy, guard, candidate counts, batch plan, operation plan, optional repository preparation, and safe summary output.
- Candidate-read execution preview can load count-only candidates through the existing read repository before building a service preview.
- Operator preview command is available through npm run analytics:retention:operator-preview.
- Operator preview reads candidate counts from PostgreSQL through the Prisma candidate read repository.
- Operator preview validates execution arguments before DB-backed candidate reads, so invalid execute-only flags fail fast before touching the candidate repository.
- Operator preview returns JSON with commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- Service previews and operator previews do not call deleteCandidates and do not expose raw event deletion.
- Retention execute review output includes `executeContractReview.expectations` with `candidateRecheckExpectation`, `rollbackExpectation`, and `auditOutputExpectation`.
- Retention execution service preview fails closed when candidate recheck preparation fails and reports `preparedOperationErrors`.
- Service summary and operator summary output surface fail-closed preparation errors without running destructive execution.
- The existing execution preview command remains DB-free and still reports deleteImplementationAvailable=false.
- No retention execute command is implemented yet.

Current analytics limitations:

- Selected consumer usage, API key usage, and rejected summary APIs can opt into bounded rollup reads with raw-summary fallback; default behavior remains raw-event summary.
- Direct command execute and guarded process-local dry-run runtime paths exist, but external scheduler runtime execution, scheduled/background execute, and an autonomous scheduler loop remain unavailable.
- Retention operator preview exists, but no retention execute command, delete API, scheduled delete job, operator-facing `deleteCandidates`, or raw event deletion path exists.
- Prometheus, Grafana, and rollup tables are not quota-counting sources of truth.
---

## Useful Commands

Install dependencies:

    npm ci

Run automated validation:

    npm run test
    npm run typecheck
    npm run build
    npm run test:k6:smoke
    git status

Start Docker stack:

    docker compose up --build -d
    docker compose ps

Deploy API Gateway migrations in Docker runtime:

    docker compose exec -T api-gateway npm run db:migrate:deploy --workspace api-gateway

Run analytics rollup backfill dry-run:

    npm run analytics:rollup:backfill --workspace api-gateway -- --from 2026-07-05T00:00:00.000Z --to 2026-07-06T00:00:00.000Z --granularity hour

Run analytics rollup schedule preview:

    npm run analytics:rollup:schedule-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Run analytics rollup scheduler preview:

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Run analytics rollup scheduler command dry-run runtime service invocation:

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-mode dry-run --event-limit 500

Run analytics retention dry-run:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

Run analytics retention execution preview:

    npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100

Run analytics retention operator preview with DB-backed candidate counts:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"
    npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120

Check API Gateway health:

    Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10

Stop Docker stack:

    docker compose down

---

## Important Docs

Compact project docs:

- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md

Detailed sprint history:

- docs/sdlc/sprint-history/

Runbooks:

- docs/runbooks/

Decision records:

- docs/project-context/decisions/

Latest sprint history:

- docs/sdlc/sprint-history/sprint-69.md

Latest observability and analytics runbooks:

- docs/runbooks/observability-validation.md
- docs/runbooks/local-validation.md
- docs/runbooks/analytics-rollup-backfill.md
- docs/runbooks/analytics-rollup-schedule-preview.md
- docs/runbooks/analytics-rollup-scheduler-preview.md
- docs/runbooks/analytics-rollup-read.md
- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-delete-repository.md
- docs/runbooks/analytics-retention-execution-service-preview.md
- docs/runbooks/analytics-retention-operator-preview.md

Latest decision record:

- docs/project-context/decisions/2026-07-12-service-discovery-foundation.md

---

## Recommended Next Sprint

Sprint 64 - Dashboard rollup/retention/scheduler panels.

Reason:

- Sprint 63 completed the bounded read-only quota, successful usage, and rejected-event Dashboard surfaces.
- The fixed roadmap assigns rollup, retention, and scheduler operator panels to Sprint 64.
- Sprint 64 must reuse fixed GET-only BFF resources, preserve all current execution guardrails, and avoid opening retention deletion or autonomous scheduler execution.

## Sprint 55 Completion

Sprint 55 completed Background Scheduler Runtime Wiring with guardrails.

The scheduler preview command now exposes guarded process-local dry-run runtime invocation through `backgroundScheduler.runtimeGate` and `processLocalDryRunServiceInvocationResults`.

Preserved boundaries:

- no scheduled/background rollup job
- no external scheduler runtime execution
- no background execute
- no quota mutation
- no raw event deletion
- no retention execution

Final Sprint 55 validation passed:

- 129 test files / 940 tests
- typecheck
- build
- Docker/PostgreSQL runtime validation

## Sprint 58 Completion

Sprint 58 completed Minimal Admin/RBAC hardening.

Implemented:

- Fail-fast admin route registration enforcement for the exact `/internal/admin` path and all `/internal/admin/*` descendants.
- Marked admin authentication middleware that can be recognized by the route-registration boundary.
- Centralized admin actor attribution for consumer, API key, route configuration, and usage plan mutations.
- Trimmed and validated `x-admin-actor` values with a maximum length of 64 characters and a restricted audit-safe character set.
- Consistent `admin-api-key` fallback when actor attribution is missing, duplicated, blank, too long, or unsafe.
- Optional `ADMIN_READ_ONLY_API_KEY` configuration.
- Existing `ADMIN_API_KEY` behavior preserved as full-access administration.
- Read-only admin access limited to `GET`, `HEAD`, and `OPTIONS`.
- Read-only mutation attempts rejected with `403 ADMIN_API_KEY_READ_ONLY`.
- Startup failure when full-access and read-only admin keys are identical.
- Timing-safe admin key verification through the existing SHA-256 API key hashing and `timingSafeEqual` implementation.
- Docker Compose and `.env.example` wiring for optional read-only admin access.
- Focused and regression tests for route protection, actor attribution, role boundaries, configuration, prefix-like keys, and different-length invalid keys.

Important boundaries:

- `x-admin-actor` is sanitized audit attribution metadata; it is not a cryptographically authenticated user identity.
- No Admin Dashboard UI was added.
- No user, organization, tenant, database-backed role, or enterprise IAM model was added.
- No database schema or migration was added.
- No API consumer, managed API key, route configuration, or usage plan persistence contract was changed.
- No quota counting behavior changed.
- No analytics rollup scheduler behavior changed.
- No retention execution path was opened.
- No raw event deletion was introduced.

Sprint 58 commits:

- `fef7202 feat(gateway): enforce admin route auth boundary`
- `bf428c3 feat(gateway): normalize admin actor attribution`
- `16941ca feat(gateway): add read-only admin access`
- `c7087cc feat(gateway): use timing-safe admin key verification`

Final Sprint 58 code validation before docs finalization:

- `npm run test` passed: 136 test files / 987 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Docker/PostgreSQL runtime validation passed.
- API Gateway health returned `200`.
- A read-only key successfully called an admin `GET` endpoint with status `200`.
- A read-only mutation was rejected with `403 ADMIN_API_KEY_READ_ONLY`.
- A full-access mutation passed authentication and reached payload validation with `400 API_CONSUMER_INVALID`.
- An invalid key remained rejected with `403 ADMIN_API_KEY_INVALID`.
- The runtime validation did not create an admin consumer because the full-access mutation intentionally used an invalid empty payload.

Sprint 58 docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/decisions/2026-07-10-minimal-admin-rbac-hardening.md
- docs/runbooks/admin-route-management.md
- docs/sdlc/sprint-history/sprint-58.md

## Sprint 63 Completion

Sprint 63 completed Dashboard quota/usage/rejected events as bounded read-only operator views.

Product/documentation version:

```txt
v1.3.0
```

Private npm workspace package versions remain:

```txt
0.1.0
```

The protected annotated Git tag `v1.0.0` remains unchanged at commit `407d03678674219e7228b15f0cd7a23074493f31`. Sprint 63 does not create a Git tag.

Delivered:

- Added shared bounded analytics query validation, summary-card, filter, and cursor-navigation primitives.
- Added `/usage-analytics` for consumer and API key usage summaries, API key quota state, usage-plan current-window summary, and successful usage event investigation.
- Added `/rejected-events` for rejected request summary, reason/status breakdowns, and rejected event investigation.
- Added seven explicit GET-only Dashboard BFF resources for successful usage, quota, usage-plan summary, and rejected-event reads.
- Added same-origin fixed Admin URL enforcement and retained `cache: no-store`.
- Added strict browser/server DTO validation, identity consistency checks, duplicate/unknown query rejection, a 31-day maximum date range, default event limit 20, maximum event limit 100, and opaque cursor navigation.
- Kept offset pagination and rollup runtime flags out of the Dashboard UI contract.
- Kept successful usage and rejected/security events as separate read models and separate pages.
- Validated upstream rejected-event metadata and removed it before the Dashboard BFF/browser DTO; raw metadata is never rendered.
- Added no mutation controls, no generic Admin API proxy, and no full-access Admin credential.

Sprint 63 implementation commits:

- `8bf27a2 feat(dashboard): add analytics read foundation`
- `9a26de8 feat(dashboard): add successful usage read boundary`
- `d6a0c38 feat(dashboard): add usage analytics page`
- `ab550d0 feat(dashboard): add rejected events read boundary`
- `d9823e7 feat(dashboard): add rejected events page`

Final validation before documentation finalization:

- Admin Dashboard: 38 test files / 200 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root workspace tests passed.
- Root typecheck passed.
- Root production build passed.
- Docker Compose configuration validation passed.
- Working and staged diff checks passed.
- Next.js production build exposed `/usage-analytics`, `/rejected-events`, and all seven new dynamic BFF routes.
- Docker/PostgreSQL runtime validation was not required because Sprint 63 changed only the Dashboard read boundary, client contracts, pages, components, tests, and documentation; it added no Gateway implementation, database query, schema migration, container configuration, persistence path, quota behavior, scheduler execution, retention execution, or raw-event deletion path.

Security and behavior boundaries preserved:

- `ADMIN_READ_ONLY_API_KEY` remains server-side only.
- Full-access `ADMIN_API_KEY` remains absent from the Dashboard.
- No browser-stored Admin credential.
- No generic Admin API proxy.
- No Dashboard mutation controls.
- No API management persistence changes.
- `gateway.api_usage_events` remains the quota-counting source of truth.
- `gateway.api_rejected_events` remains separate from successful usage.
- No rollup flag is exposed by the Dashboard analytics query contract.
- No scheduler execution expansion.
- No retention execution.
- No raw-event deletion.
- No database migration.
- No new dependency.

## Sprint 62 Completion

Sprint 62 completed Dashboard consumers/API keys/usage plans as bounded read-only resource views and also completed the route registry read view that was part of the fixed sprint scope.

Product/documentation version:

```txt
v1.2.0
```

Private npm workspace package versions remain:

```txt
0.1.0
```

The existing annotated Git tag `v1.0.0` remains unchanged at commit `407d03678674219e7228b15f0cd7a23074493f31`. Sprint 62 does not create a new Git tag.

Delivered:

- Added shared loading, empty, error, retry, and table primitives for bounded Dashboard resources.
- Added `/consumers` with a fixed consumer list/detail read boundary.
- Added `/api-keys` with consumer-scoped API key metadata only.
- Added `/usage-plans` with bounded list/detail views.
- Added `/routes` with persisted route configuration and runtime registry displayed as separate resources.
- Added fixed GET-only Dashboard BFF endpoints for each resource.
- Kept `cache: no-store` and strict browser/server DTO validation.
- Preserved missing-resource mappings and list/detail identity checks.
- Kept raw issued API key material out of Dashboard responses and rendering.
- Added no create, update, revoke, delete, assign, or reload controls.

Sprint 62 implementation commits:

- `7b7c3a0 feat(dashboard): add admin resource view foundation`
- `710d331 feat(dashboard): add consumer registry read view`
- `5b0dda3 feat(dashboard): add consumer api key read view`
- `b4cd8b1 feat(dashboard): add usage plan read view`
- `05e9443 feat(dashboard): add route registry read view`

Validation before documentation finalization:

- Admin Dashboard: 21 test files / 110 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root typecheck passed.
- Root production build passed.
- `docker compose config --quiet` passed.
- Working and staged diff checks passed.
- Runtime list/detail parity checks passed for consumers, usage plans, and persisted routes.
- Consumer-scoped API key identity checks passed without raw key exposure.
- Persisted and runtime route registry parity checks passed.
- Missing-resource mappings returned bounded `404` responses.
- Dashboard mutation methods returned `405`.
- Read-only Gateway route reload returned `403 ADMIN_API_KEY_READ_ONLY`.
- Successful runtime mutation count remained zero.
- Full-access Admin credentials were absent from the Dashboard runtime.
- Runtime credential leakage checks passed.

Security and behavior boundaries preserved:

- No generic Admin API proxy.
- No browser-stored Admin credential.
- No full-access `ADMIN_API_KEY` in the Dashboard.
- No API consumer, API key, usage-plan, or route persistence change.
- No quota source-of-truth change.
- No successful-usage or rejected-event recorder change.
- No scheduler execution expansion.
- No retention execution.
- No raw-event deletion.
- No database migration.
- No enterprise IAM, Developer Portal, Kubernetes, OpenTelemetry, or Loki scope.

Sprint 62 documentation:

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/sdlc/sprint-history/sprint-62.md`
- `docs/project-context/decisions/2026-07-10-dashboard-resource-read-views.md`

## Sprint 61 Completion

Sprint 61 completed the Admin Dashboard foundation and began the fixed Product/Platform Expansion v2 roadmap.

Product/documentation version:

```txt
v1.1.0
```

Private npm workspace versions remain:

```txt
0.1.0
```

Delivered:

- Added `apps/admin-dashboard`.
- Uses Next.js App Router, React, TypeScript, and plain CSS.
- Added a responsive application shell with top bar and sidebar navigation.
- Added Overview, loading, error, and not-found states.
- Added roadmap placeholders for:
  - Consumers
  - API Keys
  - Usage Plans
  - Routes
  - Usage Analytics
  - Rejected Events
  - Rollups
  - Scheduler
  - Retention
- Added the root `npm run dev:dashboard` command.
- Reserved Dashboard port `3003`.
- Added strict server-only Dashboard environment configuration.
- Added a fixed read-only Gateway Admin API client.
- Added the browser-facing BFF endpoint:
  - `GET /api/admin/runtime-status`
- Added the fixed Gateway request:
  - `GET /internal/admin/routes/runtime`
- Added no generic Admin API proxy.
- Added normalized configuration, authorization, timeout, availability, upstream, and invalid-response errors.
- Added a runtime connectivity panel showing only safe runtime registry metadata.
- Added loading, connected, unavailable, and retry states.
- Added client-safe response contract validation.
- Added a multi-stage production Dockerfile.
- Runs the production container as the non-root `node` user.
- Added the Docker Compose `admin-dashboard` service.
- Added Dashboard health checking.
- Added Dashboard environment examples.
- Added a dedicated Admin Dashboard runbook.

Sprint 61 implementation commits:

- `82926c6 feat(dashboard): add admin dashboard foundation`
- `9e35b5b feat(dashboard): add secure admin api boundary`
- `0475e51 feat(dashboard): show gateway runtime status`
- `12d1148 feat(dashboard): add production runtime wiring`

Automated validation before documentation finalization:

- Admin Dashboard: 5 test files / 22 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root typecheck passed.
- Root production build passed.
- `docker compose config --quiet` passed.
- `git diff --check` passed.
- Browser-facing production source secret audit passed.
- Dashboard Docker image secret inspection passed.

Docker runtime validation passed:

- PostgreSQL healthy.
- Redis healthy.
- Product Service healthy.
- API Gateway running on port `3000`.
- Admin Dashboard healthy on port `3003`.
- Direct read-only Gateway runtime request returned `HTTP 200`.
- Dashboard Overview returned `HTTP 200`.
- Dashboard BFF returned `HTTP 200`.
- Runtime registry returned `available=true`.
- Runtime registry returned two loaded routes.
- Dashboard access mode returned `read-only`.
- Invalid Dashboard credentials returned `HTTP 403`.
- Invalid credential errors were normalized to `ADMIN_DASHBOARD_FORBIDDEN`.
- The Dashboard container received `ADMIN_READ_ONLY_API_KEY`.
- The Dashboard container did not receive full-access `ADMIN_API_KEY`.
- Admin credentials were absent from HTML, BFF responses, client bundles, logs, and Docker image configuration.

Security boundaries preserved:

- No Dashboard mutation controls.
- No generic Admin API proxy.
- No full-access Admin credential in the Dashboard.
- No Admin credential in `NEXT_PUBLIC_*` variables.
- No Admin credential in browser local storage or session storage.
- No consumer, API key, usage-plan, or route persistence changes.
- No quota behavior changes.
- No successful-usage or rejected-event recorder changes.
- No scheduler execution expansion.
- No retention execution.
- No raw-event deletion.
- No database migration.
- No database-backed administrator, organization, tenant, SSO, or enterprise IAM model.
- No Developer Portal, Kubernetes, OpenTelemetry, or Loki scope.

Known dependency note:

- Next.js `16.2.10` currently resolves a transitive PostCSS version reported by npm audit with moderate findings.
- Sprint 61 does not use `npm audit fix --force`, a framework downgrade, unsupported overrides, or a canary release.
- The Dashboard does not accept or process untrusted CSS input.

Sprint 61 documentation:

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/project-context/decisions/2026-07-10-admin-dashboard-foundation.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/local-validation.md`
- `docs/sdlc/sprint-history/sprint-61.md`

## Sprint 60 Completion

Sprint 60 completed final polish, documentation, demo flow, architecture cleanup, and v1.0.0 release preparation.

Implemented:

- Added `npm run validate:release` for tests, typecheck, build, Git diff checks, clean-tree verification, and `origin/main` synchronization.
- Added `npm run demo:runtime` for bounded Docker runtime validation.
- Validated Gateway, Prometheus, Grafana, Admin authorization, bounded metric labels, and k6 health behavior.
- Corrected scheduler runtime documentation.
- Added v1.0.0 release notes, Sprint 60 history, and the release-readiness decision record.
- Updated the recurring live documentation set for Sprint 60 completion and Sprint 61 handoff.

Validation baseline:

- 136 test files / 988 tests passed.
- Typecheck and build passed.
- Runtime demo completed 10/10 k6 iterations and 20/20 checks with 0% failures.

Preserved boundaries:

- No destructive retention execution or raw-event deletion.
- No autonomous background execute or external scheduler execution.
- No quota source-of-truth change.
- The annotated `v1.0.0` Git tag was created and pushed after final validation.

## Sprint 59 Completion

Sprint 59 completed Observability + Grafana/k6 lightweight validation.

Implemented:

- Fixed unmatched request metric labels to use `__unmatched__`.
- Preserved bounded Fastify route templates for matched requests.
- Added `npm run test:k6:smoke` through the Docker Compose `tools` profile.
- Bounded k6 to 1 VU, 10 iterations, a 30-second maximum duration, a 5-second graceful stop, and a 2-second request timeout.
- Excluded `/metrics` scrape traffic from general request and latency dashboard panels.
- Added a five-minute 5xx stat panel.
- Validated Prometheus target health, Grafana datasource health, all five PromQL queries, dashboard provisioning, and bounded k6 runtime behavior.

Preserved boundaries:

- Metrics and dashboards are not quota sources of truth.
- Successful and rejected event persistence remains separated.
- No quota, recorder, scheduler execute, retention execution, or raw event deletion behavior changed.
- No Admin UI, Developer Portal, OpenTelemetry, Loki, Kubernetes, billing, marketplace, or organization model was added.

## Next Sprint

Sprint 64 - Dashboard rollup/retention/scheduler panels.

Sprint 64 should add bounded read-only operator views for:

- analytics rollup inspection
- scheduler preview and guarded runtime state
- retention dry-run and non-destructive preview state

Sprint 64 must preserve:

- fixed server-only BFF resources
- read-only Admin credentials
- no generic proxy
- no autonomous or external scheduler execution expansion
- no retention execute command
- no operator-facing `deleteCandidates`
- no raw-event deletion
- no quota source-of-truth change

## Sprint 57 Completion

Sprint 57 completed Retention Execute Preview Hardening/rollback expectation.

Sprint 57 hardened retention execute preview output without opening destructive retention execution.

Completed scope:

- Added explicit `executeContractReview.expectations` output.
- Added candidate recheck, rollback, and audit output expectation details.
- Propagated expectation details through execution preview, execution service preview, and operator preview output.
- Documented expectation visibility in retention execution preview and operator preview command usage/tests.
- Added fail-closed preparation error handling for candidate recheck preparation.
- Exposed `preparedOperationErrors` in service summary and operator summary output.

Safety boundaries preserved:

- no retention execute command
- no retention delete API
- no scheduled retention delete job
- no operator-facing `deleteCandidates` call
- no Prisma retention delete repository destructive execution path
- no raw event deletion
- no quota mutation
- no Admin UI changes

Sprint 57 commits:

- `8e066c9 feat(gateway): harden retention execute review expectations`
- `ec538c5 test(gateway): lock retention execute expectation propagation`
- `68e9181 test(gateway): document retention execute expectation output`
- `7fff7eb feat(gateway): fail closed retention recheck preparation`
- `a89f0b3 feat(gateway): surface retention preparation errors`

Final Sprint 57 code validation before docs finalization:

- `npm run test` passed: 133 test files / 961 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Docker/PostgreSQL runtime validation was not required because Sprint 57 changed preview/model/output/tests only and did not add a new DB runtime path, migration, destructive retention execution, quota path, scheduled job, or raw event deletion path.

Sprint 57 docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/decisions/2026-07-09-analytics-retention-execute-preview-hardening.md
- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-execution-service-preview.md
- docs/runbooks/analytics-retention-operator-preview.md
- docs/sdlc/sprint-history/sprint-57.md

## Sprint 56 Completion

Sprint 56 completed Retention Execute Contract Review.

Implemented:

- `executeContractReview` retention execute contract model.
- DB-free retention execution-preview output exposure.
- Retention execution service-preview contract propagation.
- Retention operator-preview output exposure.
- Command usage/output documentation for review-only execute contract output.
- Tests for contract model, execution preview, service preview, operator preview, and command output.

Safety preserved:

- no retention execute command
- no retention delete API
- no scheduled retention delete job
- no operator-facing `deleteCandidates`
- no Prisma retention delete repository wired into command/API/job execution
- no quota mutation
- no raw event deletion
- no rollup summary behavior change

Final Sprint 56 validation passed:

- 133 test files / 956 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation was not required because Sprint 56 added contract/model/output/usage/test changes only and no new DB runtime or destructive delete path.

Sprint 56 docs:

- docs/sdlc/sprint-history/sprint-56.md
- docs/project-context/decisions/2026-07-09-analytics-retention-execute-contract-review.md

<!-- SPRINT-65-START -->
## Sprint 65 — Developer Portal foundation

Sprint 65 adds the first public-facing Developer Portal application without opening any account, credential, billing, or backend-management surface.

Delivered scope:

- Added the private npm workspace `apps/developer-portal` using Next.js 16.2.10, React 19.2.4, TypeScript, Vitest, and plain CSS.
- Added the public routes `/`, `/getting-started`, `/api-docs`, and `/api-keys`.
- Kept `/api-docs` and `/api-keys` as explicit Sprint 66 placeholders rather than fake implementations.
- Added loading, error, and not-found boundaries.
- Added navigation and foundation tests, including a production-source guard against Admin credentials, Admin endpoints, and browser storage.
- Added a production Docker image and Docker Compose service on port `3004`.
- Added the root `dev:portal` command.
- Preserved the private `0.1.0` npm workspace versions and the protected `v1.0.0` release tag.

Validation completed:

- Admin Dashboard: 52 test files / 237 tests.
- API Gateway: 140 test files / 1000 tests.
- Developer Portal: 2 test files / 7 tests.
- Root typecheck and production build passed.
- Developer Portal and Admin Dashboard Docker images built successfully.
- Developer Portal returned HTTP 200 for all four public routes and a Next.js static asset.
- The Compose health check reported `healthy`.
- Rendered Portal HTML did not expose Admin credentials or Admin endpoint paths.

Sprint 66 remains responsible for Developer Portal API documentation and API-key self-service foundation/mock boundaries. Sprint 65 does not implement authentication, account creation, API-key issuance, billing, organizations, or backend integration.
<!-- SPRINT-65-END -->

<!-- SPRINT-66-START -->
## Sprint 66 - Developer Portal API docs and API-key self-service foundation

Sprint 66 turns the two Developer Portal placeholders into bounded, honest, static-first foundations.

Delivered API documentation scope:

- Replaced `/api-docs` with a static curated reference derived from verified Gateway source and tests.
- Documented `GET /health`, `GET /api/product-service/health`, and `GET /api/products`.
- Documented the current `x-api-key` and bearer-token expectations for the protected product route.
- Documented request IDs, cache headers, rate-limit headers, quota rejection, and downstream error behavior.
- Kept downstream-owned success payloads unfrozen when no canonical public schema exists.
- Did not add OpenAPI, Swagger, MDX, a documentation generator, or a new dependency.
- Did not publish dynamic route-registry entries or privileged management endpoints as public API contracts.

Delivered API-key foundation scope:

- Replaced `/api-keys` with a non-operational foundation page.
- Documented the future identity, ownership, one-time issuance, secret storage, and lifecycle stages.
- Added explicit current-state labels: foundation, not connected, and no key will be created.
- Added security guidance and a no-connected-account state.
- Did not add developer authentication, sessions, ownership mapping, issue/list/revoke/rotate APIs, fake keys, fake accounts, browser persistence, or Admin integration.

Implementation commits:

- `4e00f79` - `feat(portal): add api documentation foundation`
- `64e1123` - `feat(portal): add api key self-service foundation`

Validation:

- Admin Dashboard: 52 test files / 237 tests.
- API Gateway: 140 test files / 1000 tests.
- Developer Portal: 2 test files / 7 tests.
- Root release-readiness validation, typecheck, and build passed.
- Docker Compose configuration passed.
- Developer Portal image build passed.
- `/`, `/getting-started`, `/api-docs`, and `/api-keys` returned HTTP 200.
- A Next.js static JavaScript asset returned HTTP 200.
- The Portal container became healthy.
- Rendered HTML and production source contained no privileged Admin credentials, Admin endpoint paths, browser credential storage, fetch integration, or real-looking API key.

Product/documentation version advances to `v1.6.0`. Private npm workspace versions remain `0.1.0`. No Git tag is created, and protected tag `v1.0.0` remains unchanged.

Next sprint: Sprint 67 - Host-based routing foundation.
<!-- SPRINT-66-END -->

## Sprint 67 â€” Host-based routing foundation

PulseGate now supports exact normalized request-host route conditions while preserving path-only routes as explicit fallbacks.

- Route identity is `requestHost | null + method + gatewayPath`.
- Host-specific routes take precedence over path-only fallback.
- Valid unknown hosts may use path-only fallback.
- Missing or malformed Host input fails closed.
- Forwarded host headers are ignored.
- Cache and route-level rate-limit state are isolated by configured host.
- Nullable `gateway_routes.request_host` persistence supports Admin create, update, clear, reload, and read workflows.
- The legacy method/path database uniqueness was removed so path-only and multiple exact-host routes may coexist.
- The Admin Dashboard displays host-specific versus path-only routes and uses host-aware row identity.
- Analytics remains method/path based in Sprint 67.
- Weighted routing, service discovery, failover, wildcard hosts, TLS/DNS, and host analytics remain out of scope.

Current product/documentation version: **v1.7.0**. Private npm workspace versions remain **0.1.0**.

Next planned sprint: **Sprint 68 â€” Weighted routing foundation**.

<!-- SPRINT-68-README-START -->
## Sprint 68 - Weighted routing foundation

Sprint 68 adds bounded route-level weighted upstream selection while preserving the existing host/path route identity and shared proxy policy pipeline.

Delivered:

- Added optional `weightedUpstreams` route metadata while preserving legacy `downstreamUrl`.
- Weighted configurations require 2-8 unique HTTP or HTTPS upstreams.
- Each weight is a relative integer from 1 through 1000; weights do not need to total 100.
- The primary `downstreamUrl` must appear exactly once in the weighted set.
- Invalid, duplicate, empty, malformed, or primary-mismatched configurations fail closed.
- Weighted selection occurs only after exact-host/path-only route resolution and after a cache miss.
- A selected target remains fixed across retries; Sprint 68 does not retry against a different upstream.
- Client headers, query parameters, API keys, consumers, and request IDs cannot choose or override a target.
- Nullable PostgreSQL JSONB persistence keeps existing rows in legacy single-upstream mode.
- Admin create/read/update/reload supports weighted metadata; update omission preserves, `null` clears, and an array replaces the full set.
- The Admin Dashboard validates and displays read-only single-upstream or weighted target metadata.
- Existing authentication, authorization, quota, rate-limit, cache, transform, timeout, retry, analytics, metrics, and access-log boundaries remain in the shared route pipeline.

Implementation commits:

- `ee22b47 feat(gateway): add weighted upstream contract`
- `7c706c4 feat(gateway): route traffic across weighted upstreams`
- `278e00e feat(gateway): persist weighted upstream routing`
- `528b9fb feat(dashboard): show weighted route metadata`

Validation:

- API Gateway: 147 test files / 1059 tests passed.
- Admin Dashboard: 53 test files / 243 tests passed.
- Developer Portal: 2 test files / 7 tests passed.
- Prisma schema validation, root typecheck, root production build, and Docker Compose configuration passed.
- Migration `20260712070000_add_gateway_route_weighted_upstreams` deployed successfully.
- Five existing route rows remained compatible with SQL `NULL` weighted metadata.
- A bounded runtime probe created a weighted route, reloaded the registry, proxied successfully, cleared the weighted metadata to SQL `NULL`, reloaded single-upstream mode, and soft-deleted the probe route.

Boundaries:

- No service discovery; that begins in Sprint 69.
- No upstream health checks or automatic failover; those remain Sprint 70 scope.
- No sticky routing, client-selected target, arbitrary proxy target, new dependency, environment variable, service, or port.
- No per-upstream unbounded metric labels.
- No Developer Portal route-management or Admin Dashboard mutation workflow.
- No Kubernetes, OpenTelemetry, Loki, billing, marketplace, or enterprise IAM work.
- No npm package version bump and no Sprint 68 Git tag.

Product/documentation version: **v1.8.0**.
<!-- SPRINT-68-README-END -->

<!-- SPRINT-69-README-START -->
## Sprint 69 - Service discovery foundation

Sprint 69 adds bounded, configured service discovery to the existing route registry without introducing health checks, automatic failover, an external registry, DNS discovery, or Kubernetes integration.

Delivered:

- Added optional route-level `serviceInstances` metadata.
- A discovery service uses a canonical lowercase kebab-case `serviceName` of at most 64 characters.
- A configured service contains 1-8 unique canonical HTTP or HTTPS origins.
- Instance origins contain no credentials, path, query, fragment, or non-canonical spelling.
- The primary `downstreamUrl` origin must exist in the configured instance set.
- Routes sharing a service name must declare the same instance set.
- A runtime snapshot contains at most 64 configured services and is validated before registry replacement.
- Direct discovery routes choose one configured instance and preserve the primary downstream path and query.
- Missing runtime discovery state fails closed rather than silently falling back to an arbitrary target.
- Weighted discovery routes keep the existing weighted selector; their weighted origins must exactly match the configured instance set and share the primary path/query.
- Legacy direct and weighted routes without discovery metadata remain compatible.
- Nullable PostgreSQL JSONB persistence supports Admin create, read, update, clear, reload, and soft-delete workflows.
- The Admin Dashboard validates and displays discovery mode and configured service instances through its existing read-only BFF boundary.

Implementation commits:

- `5575cae feat(gateway): add service discovery contract`
- `7c4f706 feat(gateway): resolve configured service instances`
- `ab5a2b7 feat(gateway): persist service discovery routes`
- `b5aefe9 feat(dashboard): show service discovery metadata`

Validation:

- API Gateway: 153 test files / 1110 tests passed.
- Admin Dashboard: 53 test files / 244 tests passed.
- Developer Portal: 2 test files / 7 tests passed.
- Prisma schema validation, root tests, root typecheck, root production build, Docker Compose configuration, and diff checks passed.
- Migration `20260712114500_add_gateway_route_service_instances` deployed successfully.
- `gateway.gateway_routes.service_instances` was verified as nullable JSONB.
- Admin create/read/reload, direct proxy, database roundtrip, soft-delete, and registry cleanup passed.
- Dashboard read-only authorization, BFF list/detail preservation, `/routes` rendering, credential non-disclosure, and cleanup passed.

Boundaries:

- Discovery data is trusted configured route metadata, not an external service registry.
- No active health checks, passive health scoring, automatic failover, retry-to-another-instance, circuit breaking, or outlier ejection.
- No background refresh, TTL, registration, deregistration, heartbeat, DNS SRV, Consul, Eureka, Kubernetes API, or cloud discovery integration.
- No client-selected instance, arbitrary reverse proxy, sticky routing, or per-instance unbounded metric labels.
- No Dashboard mutation controls or Developer Portal route-management workflow.
- No new dependency, environment variable, service, or port.
- No Kubernetes, OpenTelemetry, Loki, billing, marketplace, or enterprise IAM work.
- No npm package version bump and no Sprint 69 Git tag.

Product/documentation version: **v1.9.0**.
<!-- SPRINT-69-README-END -->

<!-- SPRINT-70-README-START -->
## Sprint 70 - Service discovery health/failover hardening

Sprint 70 adds bounded process-local passive health tracking and retry-budget failover to configured service discovery.

### Health contract

- Health identity is `serviceName + canonical baseUrl`.
- Health state is bounded to 512 entries: 64 services with up to 8 instances each.
- Runtime behavior uses `healthy`, `cooldown`, and computed `probe` states.
- Two consecutive qualifying failures enter a 30-second cooldown.
- Network failures, timeouts, and downstream HTTP 5xx responses qualify.
- Any downstream HTTP response below 500 resets the failure count.
- Cache hits and pre-proxy auth, quota, rate-limit, route, and validation rejections are neutral.
- Invalid response JSON is neutral after an HTTP response has already established transport success.

### Failover contract

- Health filtering applies only to routes with `serviceInstances`.
- Direct discovery selects uniformly from eligible instances.
- Weighted discovery filters ineligible origins and preserves remaining relative weights.
- Qualifying failed targets are excluded from later attempts in the same request.
- Failover occurs only inside the existing retry budget.
- Only GET requests retry and fail over.
- Non-GET requests are never replayed.
- Retry attempts are capped at 7, limiting one request to 8 total downstream executions.
- Legacy direct and weighted routes preserve their previous behavior.
- No eligible target fails closed with the existing downstream-unavailable boundary.
- Raw instance URLs are absent from client errors and Prometheus labels.

### Reload lifecycle

- Valid reload preserves unchanged health identities.
- New instances start healthy.
- Removed instances are pruned.
- Invalid reload preserves the previous route and health state.
- Process restart resets process-local health.
- No active polling, distributed state, external registry, circuit breaker, service mesh, or Kubernetes discovery was added.

### Implementation commits

- `8b2acec1e42242893d638145437581e34ddece89` - `feat(gateway): add service instance health contract`
- `42faa85e322b4dcb3af632cb649101aa924f5420` - `feat(gateway): add health-aware target selection`
- `fdf38fadee069cbcf96c8e501b21306cfb73cb2f` - `feat(gateway): fail over unhealthy service instances`

### Validation

- API Gateway: 155 test files / 1140 tests passed.
- API Gateway typecheck and production build passed.
- Active persisted routes with `retry_attempts > 7`: 0.
- Docker/PostgreSQL validation proved JSONB roundtrip, two qualifying failures with client HTTP 200, cooldown exclusion, no-eligible-target HTTP 503, no raw URL disclosure, soft deletion, runtime removal, and clean repository state.
- No migration, dependency, environment variable, permanent service, or permanent port was added.
- Private npm workspace versions remain `0.1.0`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Sprint 70 creates no Git tag.

Product/documentation version: **v1.10.0**.

Next planned sprint: **Sprint 71 - Kubernetes foundation**.
<!-- SPRINT-70-README-END -->

<!-- SPRINT-71-README-START -->
## Sprint 71 - Kubernetes foundation

Sprint 71 adds a bounded Kubernetes manifest and deployment foundation for local/development use. It does not claim a successful cluster deployment; cluster runtime validation remains assigned to Sprint 72.

Delivered:

- Added `deploy/kubernetes/base` and `deploy/kubernetes/overlays/local` using Kustomize.
- Added the `pulsegate` namespace.
- Added one-replica Deployments and ClusterIP Services for API Gateway, Product Service, Admin Dashboard, and Developer Portal.
- Added ConfigMaps plus Secret references without committing production secrets.
- Added HTTP startup, readiness, and liveness probes using the existing application endpoints.
- Disabled automatic service-account token mounting for application workloads.
- Added non-root application security contexts, `RuntimeDefault` seccomp, no privilege escalation, and dropped Linux capabilities.
- Added local-only PostgreSQL 16 and Redis 7 composition using `emptyDir`.
- Added an explicit migration Job that runs Product Service migrations before API Gateway migrations.
- Split local bootstrap resources from application resources so migration completion can precede application rollout.
- Hardened API Gateway and Product Service production entrypoints, multi-stage Dockerfiles, non-root runtime images, compiled JavaScript startup, Prisma runtime packaging, and graceful `SIGINT`/`SIGTERM` shutdown.
- Added Product Service `db:migrate:deploy`.

Operational boundaries:

- Application replicas remain `1`.
- Gateway service-instance health remains process-local and therefore per pod.
- Kubernetes Services provide stable DNS only; the applications do not call the Kubernetes API for discovery.
- There is no Ingress, NodePort, LoadBalancer, ServiceAccount, RBAC, PVC, StatefulSet, Helm, service mesh, cloud-vendor dependency, or GitOps controller.
- Local generated Secrets are explicit development placeholders, not production secret management.
- PostgreSQL and Redis data is ephemeral.
- Resource requests/limits and read-only root filesystems remain deferred until Sprint 72 runtime evidence.
- Docker Compose remains supported and unchanged as the existing local workflow.
- No application routing, authentication, quota, cache, transform, analytics, metrics, or retry semantics changed.
- No npm package version changed and no Sprint 71 Git tag was created.

Implementation commits:

- `81f9a3f69c96b52c0489988e939706bd2671f6e0` - backend deployment entrypoints.
- `e77494ab9356ac5ba297a158e1e9150fe35c99fc` - Kubernetes manifest foundation.
- `5c8e50a8eb68a75cc50f84bfc2a831cd0c2d7e41` - core application manifests.
- `c171135e1d413e6d90d76aed7d83e279a12b8504` - local dependency composition.

Validation:

- `npm.cmd run validate:release` passed.
- Both production backend Docker images built.
- Product Service migration runtime applied 1 migration.
- API Gateway migration runtime applied 11 migrations.
- Base Kustomize render: 13 resources.
- Local bootstrap render: 10 resources.
- Local applications render: 13 resources.
- No cluster resources were applied in Sprint 71.

Product/documentation version: **v1.11.0**.

Next planned sprint: **Sprint 72 - Kubernetes runtime validation and deployment documentation**.
<!-- SPRINT-71-README-END -->
