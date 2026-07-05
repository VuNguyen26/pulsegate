# PulseGate

High-Traffic API Gateway & Observability Platform.

PulseGate is being built toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Current version:

- v0.24.0

Latest completed sprint:

- Sprint 23 - Analytics Rollup Persistence Foundation

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
- Analytics rollup time bucket foundation
- Analytics rollup window planner foundation
- Usage rollup aggregate builder foundation
- Rejected rollup aggregate builder foundation
- Analytics rollup persistence schema
- Analytics rollup dimension hash builder
- Usage rollup persistence repository
- Rejected rollup persistence repository
- Analytics rollup persistence service

Latest validation:

- 67 test files passed
- 461 tests passed
- npm run typecheck passed
- npm run build passed
- Prisma schema validate passed
- Shadow database migration deploy passed for all API Gateway migrations, including analytics rollup tables

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

---

## Current Usage, Quota, Rejection, and Analytics Foundation Behavior

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

Analytics rollup persistence foundation behavior:

- Sprint 22 added rollup calculation helpers under apps/api-gateway/src/analytics.
- Sprint 23 added rollup persistence tables, dimension hashing, repositories, and an internal persistence service.
- Rollup persistence is separate for successful usage and rejected/security traffic.
- Rollup upserts use a dimensionHash to avoid nullable-dimension uniqueness issues.
- Current runtime summary and listing APIs still read raw event tables.
- Rollup persistence is not wired into runtime endpoints or background jobs yet.
- Quota counting still reads gateway.api_usage_events.

Current analytics limitation:

- Usage and rejected analytics are still event-based at runtime.
- No rollup backfill command is implemented yet.
- No retention job is implemented yet.
- Summary APIs have not been switched to read rollup tables yet.

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

- docs/sdlc/sprint-history/sprint-23.md

Latest usage analytics runbook:

- docs/runbooks/api-usage-analytics.md

Latest rejected events runbook:

- docs/runbooks/api-rejected-events.md

Latest decision record:

- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Recommended Next Sprint

Sprint 24 recommended direction:

- Analytics Rollup Backfill Command or Retention Safety Foundation

Reason:

- Sprint 23 added safe persistence foundations without changing runtime analytics or quota behavior.
- The next backend step can either add a controlled backfill command or start safe retention dry-run planning.
