# PulseGate

High-Traffic API Gateway & Observability Platform.

PulseGate is being built toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Current version:

- v0.48.0

Latest completed sprint:

- Sprint 47 - Command Dry-Run Service Invocation Runtime Wiring

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
- GitHub Actions CI/CD
- Dynamic route config
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

- 105 test files passed
- 756 tests passed
- npm run typecheck passed
- npm run build passed
- Docker/PostgreSQL runtime validation passed for analytics:rollup:scheduler-preview command dry-run runtime service invocation.
- Runtime command dry-run with --event-limit=500 now reaches executionDecision.status=dry-run-ready and invokes AnalyticsRollupBackfillService.runBackfill in dry-run mode only through a Prisma-backed runtime service factory.
- Runtime output exposes dryRunServiceInvocationResults with source-separated usage and rejected service-dry-run-invoked results.
- Runtime consistency output exposes status=runtime-dry-run-service-invocation-wired while preserving automaticTriggersRemainUnwired=true and executeRemainsUnwired=true.
- Blocked runtime validation passed for dry-run without --event-limit, process-local dry-run with --event-limit, and command execute with --event-limit.
- Safety remained non-destructive: no scheduled/background job, no execute mode, no raw event reads from service dry-run, no rollup persistence, no quota counting change, and no raw event deletion.
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
- Prometheus metrics

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
- The existing execution preview command remains DB-free and still reports deleteImplementationAvailable=false.
- No retention execute command is implemented yet.

Current analytics limitation:

- Usage and rejected summary APIs are still event-based at runtime.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Rollup schedule and scheduler preview commands exist; direct command dry-run service invocation is wired and validated, but no scheduled/background rollup job is implemented yet.
- Retention operator preview command exists, but destructive retention execution is still unavailable.
- Retention Prisma delete repository exists but is not wired to any operator-facing execute command, API, or job.
- No retention execute command is implemented yet.
- No retention delete job is implemented yet.

---

## Useful Commands

Install dependencies:

    npm ci

Run automated validation:

    npm run test
    npm run typecheck
    npm run build
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

- docs/sdlc/sprint-history/sprint-47.md

Latest analytics runbooks:

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

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-runtime-wiring.md

---

## Recommended Next Sprint

Sprint 48 - Command Dry-Run Runtime Output Hardening

Reason:

- Sprint 47 wired direct command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only and validated it with Docker/PostgreSQL.
- The next safe step is to harden runtime output and failure handling before any execute-mode work.
- Sprint 48 should focus on fail-closed runtime service error output, source separation edge cases, event-limit and max-bucket guardrail hardening, and operator-facing output clarity.
- Execute mode, process-local execution, external scheduler execution, quota counting changes, rollup summary API switching, and raw event deletion should remain blocked.