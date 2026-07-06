# PulseGate

High-Traffic API Gateway & Observability Platform.

PulseGate is being built toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Current version:

- v0.30.0

Latest completed sprint:

- Sprint 29 - Analytics Retention Execution Service Orchestration Preview

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

Latest validation:

- 93 test files passed
- 646 tests passed
- npm run typecheck passed
- npm run build passed
- No new Docker/runtime validation was required in Sprint 29 because no command, API, migration, scheduled job, or operator-facing delete execution was added
- Analytics retention execution service preview, summary model, candidate count loader, and candidate-read preview composition tests passed

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
- Repository-level retention delete safety primitives now exist behind the guardrails.
- Prisma delete repository implementation deletes only bounded selected IDs after safety decision and candidate recheck checks.
- Service-level retention execution preview now composes policy, guard, candidate counts, batch plan, operation plan, optional repository preparation, and safe summary output.
- Candidate-read execution preview can load count-only candidates through the existing read repository before building a service preview.
- Service previews do not call deleteCandidates and do not expose operator-facing raw event deletion.
- The existing execution preview command remains DB-free and still reports deleteImplementationAvailable=false.
- No operator-facing raw event deletion is exposed yet.
- No retention execute command is implemented yet.

Current analytics limitation:

- Usage and rejected summary APIs are still event-based at runtime.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- No scheduled/background rollup job is implemented yet.
- Retention service-level orchestration preview exists, but no destructive operator-facing execution is exposed yet.
- Retention Prisma delete repository exists but is not wired to any command, API, or job yet.
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

Run analytics retention dry-run:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

Run analytics retention execution preview:

    npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100

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

- docs/sdlc/sprint-history/sprint-29.md

Latest analytics runbooks:

- docs/runbooks/analytics-rollup-backfill.md
- docs/runbooks/analytics-rollup-read.md
- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-delete-repository.md
- docs/runbooks/analytics-retention-execution-service-preview.md

Latest decision record:

- docs/project-context/decisions/2026-07-06-analytics-retention-execution-service-orchestration-preview.md

---

## Recommended Next Sprint

Sprint 30 recommended direction:

- Analytics Retention Execution Operator Preview Command

Reason:

- Sprint 29 added service-level orchestration preview and count-backed candidate-read composition without exposing destructive execution.
- The next backend step can add a non-destructive operator-facing preview command around this service layer, while still avoiding deleteCandidates, delete APIs, scheduled jobs, and quota-path changes.
