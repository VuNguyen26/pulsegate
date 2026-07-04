# PulseGate

High-Traffic API Gateway & Observability Platform.

PulseGate is being built toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Current version:

- v0.19.0

Latest completed sprint:

- Sprint 18 - Advanced Usage Analytics and Rejected Event Drilldown

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
- Usage plans and quotas
- Runtime quota enforcement
- Quota observability endpoints
- Rejected request tracking
- Rejected events summary
- Rejected events raw listing
- Filterable rejected event drilldown

Latest validation:

- 55 test files passed
- 362 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime rejected events listing and filtered summary validation passed

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
- Consumer usage summary
- API key usage summary
- API key quota state
- Usage plan usage summary
- Rejected events summary
- Filtered rejected events summary
- Rejected events raw listing with safe pagination

---

## Current Quota and Rejection Behavior

Usage plans support:

- DAILY quota window
- MONTHLY quota window
- Enabled/disabled plans
- Optional assignment to API keys

Quota enforcement applies when:

- The route requires API key auth.
- The request uses a DB-backed API key.
- The API key has usagePlanId.
- The assigned usage plan is enabled.

Over-quota behavior:

- Request is rejected before cache/proxy execution.
- Gateway returns 429 QUOTA_EXCEEDED.
- Response includes quota metadata:
  - quotaLimit
  - quotaWindow
  - usedRequests
  - remainingRequests
  - windowStartedAt
  - windowEndsAt
  - resetAt

Rejected request behavior:

- Failed auth, rate-limited, and quota-denied requests are recorded into gateway.api_rejected_events.
- gateway.api_usage_events remains the source of truth for successful proxy/cache usage and quota counting.
- gateway.api_rejected_events is used for rejected/security traffic observability.
- Rejected events can be queried through aggregate summary and raw paginated listing endpoints.
- Rejected event filters include time range, rejection reason, status code, route, auth source, API key, and consumer.
- Raw API keys, JWTs, and Authorization headers are not stored or returned.
- No aggregate rollup table yet.

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

- docs/sdlc/sprint-history/sprint-18.md

Latest rejected events runbook:

- docs/runbooks/api-rejected-events.md

Latest decision record:

- docs/project-context/decisions/2026-07-04-rejected-events-side-table.md

---

## Recommended Next Sprint

Sprint 19 recommended direction:

- Usage Analytics Hardening and Retention/Rollup Design

Recommended focus:

- Add stronger usage analytics filters and time-range querying.
- Evaluate event retention policy for usage and rejected events.
- Design aggregate rollups for high-volume analytics.
- Consider Grafana panels for quota, usage, and rejected traffic.
- Keep successful usage and rejected/security events separate.
- Avoid jumping to Admin Dashboard UI, Developer Portal UI, billing, Kafka, Kubernetes, or multi-tenant organization model unless explicitly selected.
