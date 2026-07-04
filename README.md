# PulseGate

High-Traffic API Gateway & Observability Platform.

PulseGate is being built toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

Current version:

- v0.18.0

Latest completed sprint:

- Sprint 17 - API Rejection Tracking and Rejected Events Observability

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
- Rejected events observability endpoint

Latest validation:

- 52 test files passed
- 342 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime rejected events validation passed

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

---

## Current Quota Behavior

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

- docs/sdlc/sprint-history/sprint-17.md

Latest rejected events runbook:

- docs/runbooks/api-rejected-events.md

Latest decision record:

- docs/project-context/decisions/2026-07-04-rejected-events-side-table.md

---

## Recommended Next Sprint

Sprint 18 recommended direction:

- Advanced Usage Analytics and Rejected Event Drilldown

Recommended focus:

- Add filtered rejected event queries by time range, route, reason, consumer, and API key.
- Add raw rejected event listing with safe pagination.
- Consider aggregate rollups for usage and rejected traffic analytics.
- Keep successful usage and rejected/security events separate.
