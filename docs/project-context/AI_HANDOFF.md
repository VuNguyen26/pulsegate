# AI Handoff

## Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.7.0

## Current Sprint

Sprint 6 - CI/CD Foundation

## Current Status

Sprint 0 is complete.

Sprint 1 is complete.

Sprint 2 is complete.

Sprint 3 is complete.

Sprint 4 is complete.

Sprint 5 is complete.

Sprint 6 technical implementation is complete.

Sprint 6 final documentation update is in progress.

PulseGate currently has a stable local-first API Gateway, infrastructure foundation, observability foundation, route policy foundation, and CI/CD foundation with:

* Docker Compose.
* API Gateway container.
* Product Service container.
* PostgreSQL.
* Prisma.
* Database-backed Product Service data.
* Redis.
* Redis-backed rate limiting.
* Redis response caching.
* API key authentication.
* JWT authentication.
* Request size protection.
* Basic security headers.
* Downstream timeout handling.
* Normalized downstream error handling.
* Structured access logs.
* Request latency measurement.
* `x-response-time-ms` response header.
* Prometheus-compatible metrics endpoint.
* Prometheus Docker service.
* Prometheus scrape configuration.
* Grafana Docker service.
* Grafana Prometheus datasource provisioning.
* Grafana dashboard provisioning.
* API Gateway overview dashboard foundation.
* Route policy type foundation.
* Route policy configuration validation.
* Per-route timeout policy helper.
* Per-route cache policy helper.
* Per-route rate limit policy helper.
* Request transformation policy foundation.
* Response transformation policy foundation.
* Upstream retry policy foundation.
* Route policy integration tests.
* Automated tests.
* GitHub Actions CI workflow.
* CI trigger on push to `main`.
* CI trigger on pull request to `main`.
* Clean dependency installation with `npm ci`.
* Prisma Client generation in CI.
* Automated test validation in CI.
* TypeScript typecheck validation in CI.
* Build validation in CI.
* API Gateway Docker image build validation in CI.
* Product Service Docker image build validation in CI.
* README CI status badge.

Current automated test status:

```txt
24 test files passed
139 tests passed
```

Latest validation status:

```txt
npm run db:generate -w apps/product-service -> passed
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
docker build API Gateway image -> passed
docker build Product Service image -> passed
GitHub Actions CI -> passed
docker compose up -d --build -> passed
docker compose ps -> passed
GET /health -> status ok
GET /metrics -> 200 OK
git status -> working tree clean before final Sprint 6 documentation update
```

Current technical implementation is ready for:

```txt
Sprint 6 - Final Documentation Update
```

After final Sprint 6 documentation update, the project can move to:

```txt
Next sprint planning
```

Recommended next sprint direction should be decided after reviewing priorities.

Possible next directions:

1. More realistic multi-route Gateway policy expansion.
2. OpenTelemetry tracing foundation.
3. k6 load testing foundation.
4. More downstream services to make Gateway routing more realistic.
5. Admin Dashboard foundation later.
6. Developer Portal foundation later.
7. Kafka and RabbitMQ later, after Gateway core remains stable.

Do not jump to Kafka, RabbitMQ, Kubernetes, Admin Dashboard, Developer Portal, or production cloud deployment unless explicitly planned.

---

## Purpose of This File

This file is used to transfer project context to a new AI chat when the current chat becomes too long or slow.

When continuing this project in a new chat, provide this file first so the assistant can understand:

* What PulseGate is.
* What has already been completed.
* What the current architecture is.
* What coding style and learning workflow should be followed.
* What the next sprint should be.
* What should not be added too early.
* What behavior is already stable.
* What tests currently exist.
* How Docker, PostgreSQL, Prisma, Redis, rate limiting, caching, Prometheus, Grafana, route policies, and GitHub Actions CI/CD currently work.

---

## User Learning Workflow

The assistant should follow this workflow:

1. Provide sample code step by step.
2. Do not generate too much code at once.
3. Explain the purpose of each file.
4. Explain important code blocks.
5. Explain the request flow after each feature.
6. Let the user run and test the code.
7. Review errors, logs, screenshots, terminal output, and code like a senior backend reviewer.
8. Give a checklist after each step.
9. Ask the user to commit only after a stable checkpoint.
10. Ask the user to push after each stable commit.
11. Update project context docs at the end of each sprint or when needed.
12. Always run `npm run test`, `npm run typecheck`, and `npm run build` before committing.
13. For Docker or infrastructure changes, also run `docker compose up --build -d` and `docker compose ps`.
14. For observability changes, validate `/metrics`, Prometheus target health, Grafana datasource, and Grafana dashboard provisioning when relevant.
15. For CI/CD changes, validate GitHub Actions, `npm ci`, Prisma Client generation, tests, typecheck, build, and Docker image build steps.
16. For final sprint validation, validate `/health`, `/metrics`, Docker runtime, and Git status before documentation update.

Preferred response style:

* Vietnamese explanation.
* Clear step-by-step instructions.
* Code sample first when implementing.
* Explain why the code is written that way.
* Keep sprint scope controlled.
* Avoid jumping too far ahead into complex infrastructure.
* Prefer small, stable checkpoints.
* Review terminal output carefully before moving to the next step.
* Do not commit documentation until all sprint documentation files are updated.

---

## Project Goal

PulseGate is a mini API Gateway + API Management + Observability Platform.

It is inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

Long-term target users:

* Backend Developer
* DevOps Engineer
* SRE
* Tech Lead
* Companies with many APIs or microservices

Long-term problems PulseGate should solve:

* Provide a single entry point for many backend services.
* Route requests to the correct downstream service.
* Validate API keys and JWT tokens.
* Apply rate limiting.
* Add request size protection.
* Add security headers.
* Add Redis caching.
* Add request logging.
* Add metrics monitoring.
* Add dashboard visibility.
* Validate code health automatically with GitHub Actions CI/CD.
* Centralize route behavior through Gateway policies.
* Support per-route timeout rules.
* Support per-route cache rules.
* Support per-route rate limit rules.
* Support request transformation rules.
* Support response transformation rules.
* Support upstream retry rules.
* Add distributed tracing later.
* Stream events with Kafka later.
* Process background jobs with RabbitMQ later.
* Run load tests with k6 later.
* Support Docker, Docker Compose, and later Kubernetes.
* Provide Admin Dashboard later.
* Provide Developer Portal later.

---

## Current Architecture

Current stable architecture after Sprint 6:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> Downstream route policy configuration
      -> Auth policy
      -> Timeout policy
      -> Cache policy
      -> Rate limit policy
      -> Request transform policy
      -> Response transform policy
      -> Retry policy foundation
    -> API key authentication for protected routes
    -> Redis-backed rate limiting by API key and route
    -> JWT authentication for protected routes
    -> Redis response cache
      -> Cache HIT:
           -> Apply response transform foundation
           -> Return cached product response
      -> Cache MISS:
           -> Apply request transform foundation
           -> Downstream timeout policy helper
           -> Upstream retry policy foundation
           -> Normalized downstream error handling
           -> Product Service :3001
             -> Prisma Client
             -> PostgreSQL :5432
             -> Database-backed product response
           -> Store response in Redis cache
           -> Apply response transform foundation
    -> Add x-cache
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
    -> Return response to Client

API Gateway
  -> Exposes /metrics

Prometheus :9090
  -> Scrapes API Gateway /metrics

Grafana :3002
  -> Uses Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard

GitHub Actions
  -> Runs on push and pull request to main
  -> Installs dependencies with npm ci
  -> Generates Prisma Client
  -> Runs tests, typecheck, and build
  -> Builds API Gateway and Product Service Docker images
```

Current Docker services:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
pulsegate-prometheus
pulsegate-grafana
```

Current service ports:

```txt
API Gateway      -> 3000
Product Service  -> 3001
Grafana          -> 3002
PostgreSQL       -> 5432
Redis            -> 6379
Prometheus       -> 9090
```

Current public endpoints:

```txt
GET http://localhost:3000/health
GET http://localhost:3000/metrics
```

Current protected endpoint through Gateway:

```txt
GET http://localhost:3000/api/products
```

This endpoint currently requires:

```txt
x-api-key: dev-api-key
Authorization: Bearer <jwt-token>
```

Current observability endpoints:

```txt
Prometheus health:
GET http://localhost:9090/-/healthy

Prometheus targets:
GET http://localhost:9090/api/v1/targets

Grafana health:
GET http://localhost:3002/api/health

Grafana UI:
http://localhost:3002
```

Local Grafana login:

```txt
username: admin
password: admin
```

Current CI/CD workflow:

```txt
.github/workflows/ci.yml
```

Current CI workflow name:

```txt
CI
```

Current CI job:

```txt
Test, Typecheck, and Build
```

Current CI triggers:

```txt
push to main
pull_request to main
```

Current CI validation steps:

```txt
npm ci
npm run db:generate -w apps/product-service
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

---

## Current Protected Request Flow

```txt
Client
  -> GET http://localhost:3000/api/products
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts structured access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
      -> If request body is too large:
        -> 413 REQUEST_BODY_TOO_LARGE
    -> API Gateway loads route policy configuration
    -> API Gateway checks x-api-key
      -> If missing:
        -> 401 API_KEY_MISSING
      -> If invalid:
        -> 403 API_KEY_INVALID
      -> If valid:
        -> API Gateway resolves route rate limit policy
        -> API Gateway applies Redis-backed rate limit by API key and route
          -> If exceeded:
            -> 429 TOO_MANY_REQUESTS
          -> If allowed:
            -> API Gateway checks Authorization Bearer token
              -> If missing:
                -> 401 JWT_TOKEN_MISSING
              -> If invalid:
                -> 403 JWT_TOKEN_INVALID
              -> If valid:
                -> API Gateway resolves route cache policy
                -> API Gateway checks Redis response cache
                  -> If cache HIT:
                    -> Apply response transform foundation
                    -> 200 with x-cache: HIT
                    -> Return cached products
                  -> If cache MISS:
                    -> Apply request transform foundation
                    -> Call Product Service through timeout and retry helpers
                    -> Product Service reads products from PostgreSQL using Prisma
                    -> Product Service returns database-backed product data
                    -> API Gateway stores response in Redis cache
                    -> Apply response transform foundation
                    -> API Gateway returns 200 with x-cache: MISS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Current public health flow:

```txt
Client
  -> GET http://localhost:3000/health
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway returns health response
    -> API Gateway adds x-response-time-ms
    -> API Gateway records metrics
    -> API Gateway writes structured access log
```

Current metrics flow:

```txt
Prometheus
  -> GET http://api-gateway:3000/metrics inside Docker network
    -> API Gateway returns Prometheus text format
    -> Prometheus stores time-series metrics
    -> Grafana reads those metrics from Prometheus
```

Current CI flow:

```txt
Developer
  -> Pushes code to main or opens pull request into main
    -> GitHub Actions starts CI workflow
    -> GitHub Actions checks out repository
    -> GitHub Actions sets up Node.js 20
    -> GitHub Actions runs npm ci
    -> GitHub Actions generates Prisma Client
    -> GitHub Actions runs automated tests
    -> GitHub Actions runs TypeScript typecheck
    -> GitHub Actions runs production build
    -> GitHub Actions builds API Gateway Docker image
    -> GitHub Actions builds Product Service Docker image
    -> GitHub Actions reports pass/fail status to GitHub
    -> README CI badge reflects workflow status
```

---

## Current Tech Stack

Currently used:

* Node.js
* TypeScript
* Fastify
* npm workspaces
* Vitest
* jose
* Docker
* Docker Compose
* PostgreSQL
* Prisma
* Redis
* prom-client
* Prometheus
* Grafana
* GitHub Actions

Currently implemented:

* npm workspaces monorepo.
* TypeScript strict mode.
* API Gateway.
* Product Service.
* Docker Compose local infrastructure.
* PostgreSQL service.
* Redis service.
* Prometheus service.
* Grafana service.
* Prisma schema, migration, and seed script.
* Database-backed Product Service products.
* Request ID middleware.
* Structured access log middleware.
* Metrics middleware.
* Error handler middleware.
* Downstream service error class.
* Downstream route configuration.
* Route policy type foundation.
* Route config validation.
* API key authentication middleware.
* JWT authentication middleware.
* In-memory rate limit store for tests and local abstractions.
* Redis-backed rate limit store.
* Rate limit middleware supporting async stores.
* Redis response cache store.
* Request size limit middleware.
* Security headers middleware.
* Per-route timeout policy helper.
* Per-route cache policy helper.
* Per-route rate limit policy helper.
* Request transformation policy foundation.
* Response transformation policy foundation.
* Upstream retry policy foundation.
* API Gateway app builder for integration tests.
* Prometheus-compatible `/metrics` route.
* Prometheus scrape configuration.
* Grafana datasource provisioning.
* Grafana dashboard provider provisioning.
* Grafana API Gateway overview dashboard.
* GitHub Actions CI workflow.
* CI validation for `npm ci`, Prisma generate, tests, typecheck, build, and Docker image builds.
* Unit tests.
* Integration tests.
* GitHub-ready README.
* Project context documentation.
* Architecture documentation.
* Requirements documentation.
* `.env.example`.

Not added yet:

* Kafka.
* RabbitMQ.
* Kubernetes.
* OpenTelemetry.
* Jaeger or Tempo.
* Loki.
* k6.
* Admin Dashboard.
* Developer Portal.
* Production cloud deployment.

---

## Repository Structure

```txt
pulsegate/
  .github/
    workflows/
      ci.yml
  apps/
    api-gateway/
      src/
        app.ts
        app.test.ts
        cache/
          redis-response-cache-store.ts
          redis-response-cache-store.test.ts
        config/
          downstream-routes.ts
          downstream-routes.test.ts
          env.ts
          env.test.ts
          validate-downstream-routes.ts
          validate-downstream-routes.test.ts
        errors/
          downstream-service-error.ts
          downstream-service-error.test.ts
        middlewares/
          access-log.middleware.ts
          access-log.middleware.test.ts
          api-key-auth.middleware.ts
          api-key-auth.middleware.test.ts
          error-handler.middleware.ts
          jwt-auth.middleware.ts
          jwt-auth.middleware.test.ts
          metrics.middleware.ts
          metrics.middleware.test.ts
          rate-limit.middleware.ts
          rate-limit.middleware.test.ts
          request-id.middleware.ts
          request-id.middleware.test.ts
          request-size-limit.middleware.ts
          request-size-limit.middleware.test.ts
          security-headers.middleware.ts
          security-headers.middleware.test.ts
        observability/
          metrics.ts
          metrics.test.ts
        policies/
          cache.policy.ts
          cache.policy.test.ts
          rate-limit.policy.ts
          rate-limit.policy.test.ts
          request-transform.policy.ts
          request-transform.policy.test.ts
          response-transform.policy.ts
          response-transform.policy.test.ts
          retry.policy.ts
          retry.policy.test.ts
          route-policy.types.ts
          timeout.policy.ts
          timeout.policy.test.ts
        rate-limit/
          in-memory-rate-limit-store.ts
          in-memory-rate-limit-store.test.ts
          redis-rate-limit-store.ts
          redis-rate-limit-store.test.ts
        redis/
          redis-client.ts
        routes/
          health.route.ts
          metrics.route.ts
          metrics.route.test.ts
          product-proxy.route.ts
        server.ts
      Dockerfile
      package.json
      tsconfig.json
      vitest.config.ts

    product-service/
      prisma/
        migrations/
          20260628092746_init_products/
            migration.sql
          migration_lock.toml
        schema.prisma
        seed.ts
        tsconfig.json
      src/
        config/
          env.ts
        database/
          prisma.ts
        middlewares/
          error-handler.middleware.ts
          request-id.middleware.ts
        products/
          product.repository.ts
        routes/
          health.route.ts
          product.route.ts
        server.ts
      Dockerfile
      package.json
      tsconfig.json

  observability/
    prometheus/
      prometheus.yml
    grafana/
      dashboards/
        api-gateway-overview.json
      provisioning/
        dashboards/
          dashboards.yml
        datasources/
          prometheus.yml

  docs/
    architecture/
      overview.md
    sdlc/
      requirements.md
    project-context/
      CURRENT_PROGRESS.md
      DECISION_LOG.md
      AI_HANDOFF.md

  docker-compose.yml
  .dockerignore
  .env.example
  .gitattributes
  .gitignore
  package.json
  package-lock.json
  README.md
```

---

## Current API Gateway

Location:

```txt
apps/api-gateway
```

Port:

```txt
3000
```

Current endpoints:

```txt
GET /health
GET /metrics
GET /api/products
```

Current route protection:

```txt
GET /health
  -> Public

GET /metrics
  -> Public for local Docker observability

GET /api/products
  -> Requires API key
  -> Redis-backed rate limited by API key and route
  -> Requires JWT Bearer token
  -> Uses Redis response cache
  -> Uses route policy configuration
```

Current responsibilities:

* Receive client requests.
* Generate or reuse request ID.
* Return `x-request-id` response header.
* Add `x-response-time-ms` response header.
* Add basic security headers.
* Apply request size limit.
* Route `/api/products` to Product Service `/products` on cache MISS.
* Return cached response on cache HIT.
* Forward `x-request-id` to Product Service.
* Return downstream response to client.
* Handle 404 errors.
* Handle basic 500 errors.
* Log requests in JSON format.
* Write structured access logs after request completion.
* Record HTTP metrics after request completion.
* Expose Prometheus-compatible metrics at `/metrics`.
* Normalize downstream service errors.
* Return `503 DOWNSTREAM_SERVICE_UNAVAILABLE` when Product Service is down and cache MISS.
* Apply downstream request timeout.
* Return `504 DOWNSTREAM_TIMEOUT` when Product Service is too slow and cache MISS.
* Return `502 DOWNSTREAM_HTTP_ERROR` when Product Service returns 5xx.
* Return `502 DOWNSTREAM_INVALID_RESPONSE` when Product Service returns invalid JSON.
* Store downstream route information in route config.
* Store route policies in route config.
* Validate downstream route config at startup.
* Protect `/api/products` using API key authentication.
* Return `401 API_KEY_MISSING` when API key is missing.
* Return `403 API_KEY_INVALID` when API key is invalid.
* Apply Redis-backed rate limiting after API key authentication.
* Return `429 TOO_MANY_REQUESTS` when rate limit is exceeded.
* Protect `/api/products` using JWT authentication.
* Return `401 JWT_TOKEN_MISSING` when Bearer token is missing.
* Return `403 JWT_TOKEN_INVALID` when Bearer token is invalid.
* Attach verified JWT payload to `request.jwtPayload`.
* Cache Product responses in Redis.
* Return `x-cache: MISS` on cache MISS.
* Return `x-cache: HIT` on cache HIT.
* Return `x-cache: BYPASS` when cache is disabled in injected tests.
* Apply per-route timeout policy helper.
* Apply per-route cache policy helper.
* Apply per-route rate limit policy helper.
* Apply request transform policy foundation.
* Apply response transform policy foundation.
* Wire upstream retry policy foundation into downstream call flow.
* Support automated integration tests using `buildApiGatewayApp()` and `app.inject()`.

---

## Current Product Service

Location:

```txt
apps/product-service
```

Port:

```txt
3001
```

Current endpoints:

```txt
GET /health
GET /products
```

Current responsibilities:

* Provide health check.
* Return database-backed product data.
* Read products from PostgreSQL using Prisma Client.
* Generate or reuse request ID.
* Reuse request ID forwarded by API Gateway.
* Handle 404 errors.
* Handle basic 500 errors.
* Log requests in JSON format.
* Disconnect Prisma client on server close.
* Support Prisma schema, migration, and seed script.

Current database-backed products:

```json
{
  "data": [
    {
      "id": "prod_001",
      "name": "Mechanical Keyboard",
      "price": 120
    },
    {
      "id": "prod_002",
      "name": "Gaming Mouse",
      "price": 45
    }
  ]
}
```

Current database table:

```txt
products
```

Current Product model:

```txt
id        String
name      String
price     Int
createdAt DateTime
updatedAt DateTime
```

---

## Current Gateway Route Policy Model

Current route policy type file:

```txt
apps/api-gateway/src/policies/route-policy.types.ts
```

Current route config file:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current route config validation file:

```txt
apps/api-gateway/src/config/validate-downstream-routes.ts
```

Current policy model:

```txt
RoutePolicies
  -> auth
  -> timeout
  -> cache
  -> rateLimit
  -> requestTransform
  -> responseTransform
  -> retry
```

Current product route policy:

```txt
GET /api/products
  -> auth:
       requireApiKey: true
       requireJwt: true

  -> timeout:
       enabled: true
       timeoutMs: DOWNSTREAM_REQUEST_TIMEOUT_MS

  -> cache:
       enabled: true
       ttlSeconds: 30

  -> rateLimit:
       enabled: true
       limit: PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS
       windowMs: PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS

  -> requestTransform:
       enabled: false

  -> responseTransform:
       enabled: false

  -> retry:
       enabled: false
       attempts: 0
       retryOnStatuses: [502, 503, 504]
```

Current route validation checks:

```txt
serviceName must be present
gatewayPath must start with /
method must be supported
downstreamUrl must be a valid http or https URL
timeoutMs must be positive when timeout policy is enabled
cache ttlSeconds must be positive when cache policy is enabled
rate limit limit/windowMs must be positive when rate limit policy is enabled
request transform header names must be valid HTTP header names
response transform header names must be valid HTTP header names
retry attempts must be non-negative
retry attempts must be greater than 0 when retry is enabled
retryOnStatuses must not be empty when retry is enabled
retryOnStatuses must contain valid HTTP status codes
duplicate method + gatewayPath routes are rejected
```

Current policy helper files:

```txt
apps/api-gateway/src/policies/timeout.policy.ts
apps/api-gateway/src/policies/cache.policy.ts
apps/api-gateway/src/policies/rate-limit.policy.ts
apps/api-gateway/src/policies/request-transform.policy.ts
apps/api-gateway/src/policies/response-transform.policy.ts
apps/api-gateway/src/policies/retry.policy.ts
```

Current policy helper behavior:

```txt
timeout.policy.ts
  -> Creates per-request AbortController when timeout is enabled
  -> Returns cleanup function to clear timeout safely

cache.policy.ts
  -> Builds stable response cache keys
  -> Resolves cache enabled state from route policy and runtime cache store
  -> Supports TTL override for tests

rate-limit.policy.ts
  -> Resolves route rate limit policy into runtime middleware config

request-transform.policy.ts
  -> Adds configured request headers
  -> Removes configured request headers case-insensitively
  -> Does not mutate original header object

response-transform.policy.ts
  -> Adds configured response headers
  -> Removes configured response headers case-insensitively
  -> Does not mutate original header object

retry.policy.ts
  -> Allows retry only for GET requests
  -> Supports retry by result or error predicate
  -> Treats attempts as additional retries after the first request
```

Retry note:

```txt
The current product route has retry foundation wired into the route flow,
but retry is disabled in the default route policy.

This keeps runtime behavior stable while preparing the Gateway for future safe retry scenarios.
```

---

## Current CI/CD Foundation

Sprint 6 added GitHub Actions CI/CD foundation.

Workflow file:

```txt
.github/workflows/ci.yml
```

Workflow name:

```txt
CI
```

Job name:

```txt
Test, Typecheck, and Build
```

Trigger behavior:

```txt
push to main
pull_request to main
```

Current workflow steps:

```txt
Checkout repository
Setup Node.js 20
npm ci
npm run db:generate -w apps/product-service
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Current CI validation status:

```txt
GitHub Actions CI -> passed
README CI badge -> passing
```

Why Sprint 6 matters:

* It makes every push to `main` automatically validated.
* It makes every pull request into `main` automatically validated.
* It proves the repository can install dependencies cleanly with `npm ci`.
* It prevents Prisma Client generation issues on clean runners.
* It ensures tests, typecheck, and build stay healthy.
* It validates Docker image builds for both runtime services.
* It makes the GitHub repository more professional for portfolio and hiring review.

---

## Current Observability

### Structured Access Logs

API Gateway writes structured access logs after each request completes.

Current access log event:

```txt
http_request_completed
```

Current structured log fields:

```txt
requestId
method
path
route
statusCode
durationMs
cacheStatus
userAgent
remoteAddress
```

Sensitive headers are intentionally not logged:

```txt
x-api-key
authorization
cookie
```

Example conceptual payload:

```json
{
  "event": "http_request_completed",
  "requestId": "example-request-id",
  "method": "GET",
  "path": "/health",
  "route": "/health",
  "statusCode": 200,
  "durationMs": 3.25,
  "userAgent": "PowerShell",
  "remoteAddress": "127.0.0.1"
}
```

### Response Time Header

API Gateway adds this response header:

```txt
x-response-time-ms
```

Example:

```txt
x-response-time-ms: 4.32
```

The value is formatted in milliseconds with two decimal places.

### Metrics Registry

API Gateway uses `prom-client` to maintain an in-memory Prometheus metrics registry.

Current metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current metric behavior:

```txt
http_requests_total
  -> Counts HTTP requests by method, route, and status_code

http_request_duration_seconds
  -> Observes HTTP request duration in seconds by method, route, and status_code

http_response_cache_total
  -> Counts cache outcomes by route and cache_status
```

Supported cache statuses:

```txt
HIT
MISS
BYPASS
```

### Metrics Endpoint

Current metrics endpoint:

```txt
GET /metrics
```

Current behavior:

```txt
GET /metrics
  -> Public in local development
  -> Returns Prometheus text format
  -> Used by Prometheus Docker service
```

### Prometheus

Prometheus runs through Docker Compose.

Prometheus URL:

```txt
http://localhost:9090
```

Prometheus config location:

```txt
observability/prometheus/prometheus.yml
```

Current scrape configuration:

```txt
job_name: pulsegate-api-gateway
metrics_path: /metrics
target: api-gateway:3000
scrape_interval: 5s
```

Prometheus scrapes API Gateway using Docker internal DNS:

```txt
http://api-gateway:3000/metrics
```

### Grafana

Grafana runs through Docker Compose.

Grafana URL:

```txt
http://localhost:3002
```

Local login:

```txt
username: admin
password: admin
```

Grafana datasource config location:

```txt
observability/grafana/provisioning/datasources/prometheus.yml
```

Grafana dashboard provider location:

```txt
observability/grafana/provisioning/dashboards/dashboards.yml
```

Grafana dashboard JSON location:

```txt
observability/grafana/dashboards/api-gateway-overview.json
```

Provisioned datasource:

```txt
name: Prometheus
uid: pulsegate-prometheus
type: prometheus
url: http://prometheus:9090
isDefault: true
```

Provisioned dashboard:

```txt
title: PulseGate API Gateway Overview
uid: pulsegate-api-gateway-overview
folder: PulseGate
```

Current dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

---

## Environment Configuration Behavior

Current API Gateway env config includes:

```txt
PORT
HOST
PRODUCT_SERVICE_URL
DOWNSTREAM_REQUEST_TIMEOUT_MS
MAX_REQUEST_BODY_BYTES
API_KEY_HEADER
API_KEYS
JWT_SECRET
JWT_ISSUER
JWT_AUDIENCE
JWT_EXPIRES_IN_SECONDS
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS
REDIS_URL
```

Current API Gateway default local values:

```txt
PORT=3000
HOST=0.0.0.0
PRODUCT_SERVICE_URL=http://127.0.0.1:3001
DOWNSTREAM_REQUEST_TIMEOUT_MS=3000
MAX_REQUEST_BODY_BYTES=1048576
API_KEY_HEADER=x-api-key
API_KEYS=dev-api-key
JWT_SECRET=local-dev-jwt-secret-change-me
JWT_ISSUER=pulsegate-api-gateway
JWT_AUDIENCE=pulsegate-clients
JWT_EXPIRES_IN_SECONDS=900
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS=5
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS=60000
REDIS_URL=redis://localhost:6379
```

Current Product Service env config includes:

```txt
PORT
HOST
DATABASE_URL
```

Current Product Service default local values:

```txt
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Docker internal service values:

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
REDIS_URL=redis://redis:6379
Prometheus target=http://api-gateway:3000/metrics
Grafana Prometheus datasource=http://prometheus:9090
```

Covered by tests:

```txt
apps/api-gateway/src/config/env.test.ts
```

---

## Request ID Behavior

Request ID is implemented in both services.

Current flow:

```txt
Client
  -> API Gateway creates or reuses x-request-id
  -> API Gateway returns x-request-id in response header
  -> API Gateway sends x-request-id to Product Service
  -> Product Service reuses the same request ID
```

Purpose:

* Easier debugging.
* Connect logs between Gateway and downstream services.
* Support structured access logs.
* Prepare for distributed tracing later.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## API Key Authentication Behavior

API key authentication is implemented for the protected Gateway route:

```txt
GET /api/products
```

Default API key header:

```txt
x-api-key
```

Default local development API key:

```txt
dev-api-key
```

Current behavior:

```txt
Missing API key
  -> 401 API_KEY_MISSING

Invalid API key
  -> 403 API_KEY_INVALID

Valid API key
  -> Request continues to Redis-backed route-level rate limiting
```

Covered by tests:

```txt
apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## JWT Authentication Behavior

JWT authentication is implemented for the protected Gateway route:

```txt
GET /api/products
```

Default JWT header:

```txt
Authorization: Bearer <jwt-token>
```

Default local JWT configuration:

```txt
JWT_SECRET=local-dev-jwt-secret-change-me
JWT_ISSUER=pulsegate-api-gateway
JWT_AUDIENCE=pulsegate-clients
JWT_EXPIRES_IN_SECONDS=900
```

Current behavior:

```txt
Missing Bearer token
  -> 401 JWT_TOKEN_MISSING

Invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

Valid Bearer token
  -> Request continues to Redis response cache
```

JWT validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

Verified JWT payload is attached to:

```txt
request.jwtPayload
```

Covered by tests:

```txt
apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Rate Limiting Behavior

Redis-backed rate limiting is implemented for:

```txt
GET /api/products
```

Current behavior:

```txt
Allowed requests within the window
  -> Continue to JWT authentication

Exceeded rate limit
  -> 429 TOO_MANY_REQUESTS
```

Default product route rate limit:

```txt
5 requests per 60 seconds
```

Rate limit identity:

```txt
API key + HTTP method + route path
```

Logical rate limit key shape:

```txt
api-key:<api-key>:route:<method>:<route-path>
```

Redis rate limit key shape:

```txt
rate-limit:api-key:<api-key>:route:<method>:<route-path>
```

Example:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Expected rate limit response:

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests. Please try again later.",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
429
```

Current rate limit headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
```

Current Redis failure behavior:

```txt
Redis unavailable
  -> API Gateway fails fast
  -> Product route returns generic 500 Internal Server Error
  -> Redis internal details are not exposed in response body
```

Covered by tests:

```txt
apps/api-gateway/src/rate-limit/in-memory-rate-limit-store.test.ts
apps/api-gateway/src/rate-limit/redis-rate-limit-store.test.ts
apps/api-gateway/src/middlewares/rate-limit.middleware.test.ts
apps/api-gateway/src/policies/rate-limit.policy.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Response Cache Behavior

Redis response caching is implemented for:

```txt
GET /api/products
```

Current Redis cache key:

```txt
response-cache:GET:/api/products
```

Current behavior:

```txt
First valid request
  -> Cache MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis
  -> Response header: x-cache: MISS

Second valid request within TTL
  -> Cache HIT
  -> API Gateway returns cached response from Redis
  -> Response header: x-cache: HIT
```

Current TTL:

```txt
30 seconds
```

Current response cache headers:

```txt
x-cache: MISS
x-cache: HIT
x-cache: BYPASS
```

Cache write failure behavior:

```txt
Product Service returns valid JSON
  -> API Gateway attempts to write cache
  -> If cache write fails:
       -> API Gateway logs the cache error
       -> API Gateway still returns 200 response to client
```

Cache resilience behavior:

```txt
Product Service down + cache HIT
  -> API Gateway returns 200 from Redis cache

Product Service down + cache MISS
  -> API Gateway returns downstream error
```

Covered by tests:

```txt
apps/api-gateway/src/cache/redis-response-cache-store.test.ts
apps/api-gateway/src/policies/cache.policy.test.ts
apps/api-gateway/src/app.test.ts
```

Manually validated:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
Product Service stopped
Request 3 with cache HIT -> 200, x-cache: HIT
```

---

## Request Size Limit Behavior

Request size limit is implemented globally in the API Gateway.

Current config:

```txt
MAX_REQUEST_BODY_BYTES=1048576
```

That equals:

```txt
1MB
```

Current behavior:

```txt
Content-Length <= MAX_REQUEST_BODY_BYTES
  -> Continue request flow

Content-Length > MAX_REQUEST_BODY_BYTES
  -> 413 REQUEST_BODY_TOO_LARGE
```

Expected request body too large response:

```json
{
  "error": {
    "code": "REQUEST_BODY_TOO_LARGE",
    "message": "Request body is too large",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
413
```

Implementation:

* Request size limit middleware checks `content-length`.
* Fastify `bodyLimit` is configured with `MAX_REQUEST_BODY_BYTES`.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/request-size-limit.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Basic Security Headers Behavior

Security headers are implemented globally in the API Gateway.

Current security headers:

```txt
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'
```

Not included yet:

```txt
strict-transport-security
```

Reason:

* The project is still local-first and uses HTTP in local development.
* HSTS should be added when HTTPS deployment is introduced.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/security-headers.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Downstream Error Behavior

When Product Service is down and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_SERVICE_UNAVAILABLE",
    "message": "Product Service is currently unavailable",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
503
```

When Product Service is too slow and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_TIMEOUT",
    "message": "Product Service did not respond in time",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
504
```

When Product Service returns an error status and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_HTTP_ERROR",
    "message": "Product Service returned an error",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
502
```

When Product Service returns invalid JSON and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_INVALID_RESPONSE",
    "message": "Product Service returned an invalid response",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
502
```

Covered by tests:

```txt
apps/api-gateway/src/errors/downstream-service-error.test.ts
apps/api-gateway/src/app.test.ts
```

---

## PostgreSQL and Prisma Behavior

PostgreSQL is used by Product Service.

Current database:

```txt
pulsegate
```

Current Product Service database URL for local host mode:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current Product Service database URL for Docker mode:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Prisma schema location:

```txt
apps/product-service/prisma/schema.prisma
```

Seed script location:

```txt
apps/product-service/prisma/seed.ts
```

Migration location:

```txt
apps/product-service/prisma/migrations/20260628092746_init_products/migration.sql
```

Current seed command:

```powershell
npm run db:seed -w apps/product-service
```

Current Prisma generate command:

```powershell
npm run db:generate -w apps/product-service
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

---

## Automated Test Status

Current test framework:

```txt
Vitest
```

Current test command:

```powershell
npm run test
```

Current test result:

```txt
24 test files passed
139 tests passed
```

Current unit test coverage:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
  -> Request ID generation and reuse

apps/api-gateway/src/middlewares/access-log.middleware.test.ts
  -> Duration calculation, safe access log payload, response time header behavior

apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
  -> Missing, invalid, valid, and array header API key cases

apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
  -> Bearer token extraction, JWT verification, missing token, invalid token, valid token

apps/api-gateway/src/middlewares/metrics.middleware.test.ts
  -> Route label extraction, cache header reading, request metrics, cache metrics

apps/api-gateway/src/rate-limit/in-memory-rate-limit-store.test.ts
  -> In-memory rate limit store behavior, counters, window reset, cleanup, validation

apps/api-gateway/src/rate-limit/redis-rate-limit-store.test.ts
  -> Redis rate limit store behavior and fail-fast timeout

apps/api-gateway/src/middlewares/rate-limit.middleware.test.ts
  -> Rate limit key generation, allowed requests, exceeded limit, reset behavior, missing identifier

apps/api-gateway/src/cache/redis-response-cache-store.test.ts
  -> Redis response cache store MISS/HIT, set with TTL, validation, and fail-fast timeout

apps/api-gateway/src/middlewares/request-size-limit.middleware.test.ts
  -> Content-Length parsing, allowed body size, exceeded body size, invalid config

apps/api-gateway/src/middlewares/security-headers.middleware.test.ts
  -> Basic security headers

apps/api-gateway/src/errors/downstream-service-error.test.ts
  -> DownstreamServiceError and type guard behavior

apps/api-gateway/src/config/env.test.ts
  -> Number, CSV, and string env parsing

apps/api-gateway/src/config/downstream-routes.test.ts
  -> Route policy config, auth policy, timeout policy, cache policy, transform foundation, retry foundation

apps/api-gateway/src/config/validate-downstream-routes.test.ts
  -> Route config validation, duplicate route detection, invalid policy detection

apps/api-gateway/src/observability/metrics.test.ts
  -> Metrics registry, request metrics, cache metrics, cache status normalization

apps/api-gateway/src/routes/metrics.route.test.ts
  -> /metrics endpoint and Prometheus text format

apps/api-gateway/src/policies/timeout.policy.test.ts
  -> Timeout policy signal creation, abort behavior, and cleanup

apps/api-gateway/src/policies/cache.policy.test.ts
  -> Cache key generation, enabled/disabled resolution, TTL override

apps/api-gateway/src/policies/rate-limit.policy.test.ts
  -> Runtime rate limit policy resolution

apps/api-gateway/src/policies/request-transform.policy.test.ts
  -> Request header add/remove behavior and immutability

apps/api-gateway/src/policies/response-transform.policy.test.ts
  -> Response header add/remove behavior and immutability

apps/api-gateway/src/policies/retry.policy.test.ts
  -> Retryable HTTP method checks, retryable status checks, result retry, error retry, retry exhaustion
```

Current integration tests:

```txt
apps/api-gateway/src/app.test.ts
  -> 13 tests
```

Integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes basic security headers

GET /metrics
  -> 200 OK
  -> returns Prometheus text format

POST /api/products with oversized content-length
  -> 413 REQUEST_BODY_TOO_LARGE

GET /api/products without API key
  -> 401 API_KEY_MISSING

GET /api/products with invalid API key
  -> 403 API_KEY_INVALID

GET /api/products with valid API key but missing JWT
  -> 401 JWT_TOKEN_MISSING

GET /api/products with valid API key but invalid JWT
  -> 403 JWT_TOKEN_INVALID

GET /api/products with valid API key and valid JWT
  -> 200 and product data
  -> includes x-cache: BYPASS when no response cache store is configured in test app
  -> includes rate limit headers

GET /api/products with response cache store configured
  -> First request returns x-cache: MISS
  -> Second request returns x-cache: HIT
  -> Product Service is only called once

GET /api/products when rate limit is exceeded
  -> 429 TOO_MANY_REQUESTS
  -> does not call Product Service for the blocked request

GET /api/products with valid API key and valid JWT but downstream unavailable
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

GET /api/products with valid API key and valid JWT but downstream returns 500
  -> 502 DOWNSTREAM_HTTP_ERROR

GET /api/products with valid API key and valid JWT but downstream returns invalid JSON
  -> 502 DOWNSTREAM_INVALID_RESPONSE

GET /api/products with valid API key and valid JWT but downstream times out
  -> 504 DOWNSTREAM_TIMEOUT
```

---

## Current Commands

Run full Docker stack:

```powershell
docker compose up --build -d
```

Check Docker services:

```powershell
docker compose ps
```

Stop Docker stack:

```powershell
docker compose down
```

Run Product Service locally:

```powershell
npm run dev:product
```

Run API Gateway locally:

```powershell
npm run dev:gateway
```

Run automated tests:

```powershell
npm run test
```

Typecheck:

```powershell
npm run typecheck
```

Build:

```powershell
npm run build
```

Run CI-equivalent validation locally:

```powershell
npm ci
npm run db:generate -w apps/product-service
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Seed Product Service database:

```powershell
npm run db:seed -w apps/product-service
```

Generate Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Validate PostgreSQL:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt"
```

Validate products:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
```

Validate Redis:

```powershell
docker compose exec redis redis-cli ping
```

Expected Redis result:

```txt
PONG
```

Test API Gateway health:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Expected:

```txt
service: api-gateway
status: ok
```

Test API Gateway metrics:

```powershell
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
```

Expected:

```txt
StatusCode: 200
Content includes Prometheus text format
```

Test Prometheus health:

```powershell
Invoke-WebRequest http://localhost:9090/-/healthy -UseBasicParsing
```

Test Prometheus targets:

```powershell
Invoke-RestMethod http://localhost:9090/api/v1/targets | ConvertTo-Json -Depth 10
```

Test Grafana health:

```powershell
Invoke-RestMethod http://localhost:3002/api/health | ConvertTo-Json -Depth 10
```

Test Grafana datasource:

```powershell
$pair = "admin:admin"
$encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{
  Authorization = "Basic $encoded"
}

Invoke-RestMethod http://localhost:3002/api/datasources `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test Grafana dashboard search:

```powershell
Invoke-RestMethod http://localhost:3002/api/search?query=PulseGate `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test Grafana dashboard detail:

```powershell
Invoke-RestMethod http://localhost:3002/api/dashboards/uid/pulsegate-api-gateway-overview `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Create local development JWT token:

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

Create request headers:

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}
```

Test API Gateway products:

```powershell
Invoke-RestMethod http://localhost:3000/api/products `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test Redis-backed rate limit:

```powershell
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

1..6 | ForEach-Object {
  try {
    $res = Invoke-WebRequest http://localhost:3000/api/products `
      -Headers $headers `
      -UseBasicParsing

    [PSCustomObject]@{
      Attempt = $_
      Status = $res.StatusCode
      Remaining = $res.Headers["x-ratelimit-remaining"]
      RetryAfter = $res.Headers["retry-after"]
    }
  } catch {
    [PSCustomObject]@{
      Attempt = $_
      Status = $_.Exception.Response.StatusCode.value__
      Remaining = $_.Exception.Response.Headers["x-ratelimit-remaining"]
      RetryAfter = $_.Exception.Response.Headers["retry-after"]
      Body = $_.ErrorDetails.Message
    }
  }
} | Format-Table -AutoSize
```

Test response cache MISS/HIT:

```powershell
docker compose exec redis redis-cli DEL "response-cache:GET:/api/products"
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

$res1 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res1.StatusCode
$res1.Headers["x-cache"]
$res1.Headers["x-response-time-ms"]
$res1.Content

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Headers["x-response-time-ms"]
$res2.Content
```

Expected response cache behavior:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
Both responses include x-response-time-ms
```

Test cache HIT when Product Service is down:

```powershell
docker compose exec redis redis-cli DEL "response-cache:GET:/api/products"
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

$res1 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res1.StatusCode
$res1.Headers["x-cache"]

docker compose stop product-service

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Content

docker compose start product-service
```

Expected result:

```txt
Request 1 -> 200, x-cache: MISS
Product Service stopped
Request 2 -> 200, x-cache: HIT
```

Test Redis down behavior:

```powershell
docker compose stop redis

try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers $headers |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}

docker compose start redis
docker compose restart api-gateway
```

Expected result:

```txt
500
{"error":{"message":"Internal Server Error","requestId":"example-request-id"}}
```

---

## Completed in Sprint 0

Sprint 0 completed:

* GitHub repo created.
* Local repo cloned.
* npm workspaces configured.
* TypeScript configured.
* API Gateway running on port `3000`.
* Product Service running on port `3001`.
* Gateway routes `/api/products` to Product Service `/products`.
* Product Service returns mock product data.
* Request ID propagation works.
* JSON logger works.
* Basic error handlers work.
* API Gateway refactored into config, routes, and middlewares.
* Product Service refactored into config, routes, and middlewares.
* `npm run typecheck` passes.
* `npm run build` passes.
* Project context docs created.
* Architecture overview created.
* Requirements document created.
* README improved as GitHub landing page.
* `.env.example` added.
* Sprint 0 README status finalized.

---

## Completed in Sprint 1

Sprint 1 completed:

* Normalized downstream service errors.
* Added `DownstreamServiceError`.
* Added `503 DOWNSTREAM_SERVICE_UNAVAILABLE`.
* Added `502 DOWNSTREAM_HTTP_ERROR`.
* Added `502 DOWNSTREAM_INVALID_RESPONSE`.
* Added downstream request timeout.
* Added `504 DOWNSTREAM_TIMEOUT`.
* Added downstream route configuration.
* Added API key authentication.
* Added API key auth unit tests.
* Added downstream error unit tests.
* Added env parsing unit tests.
* Prepared API Gateway app for integration tests.
* Added API key route integration tests.
* Added valid API key product route integration test.
* Added downstream failure integration tests.
* Added downstream timeout integration test.
* Added JWT configuration.
* Added JWT authentication middleware.
* Added JWT authentication unit tests.
* Protected Product route with API key and JWT.
* Manually validated API key and JWT protected route.

---

## Completed in Sprint 2

Sprint 2 completed:

* Added in-memory rate limiting foundation.
* Added rate limit store unit tests.
* Added rate limit middleware.
* Added rate limit middleware unit tests.
* Attached validated API key to request context.
* Applied rate limit to `GET /api/products`.
* Added route-level rate limit configuration.
* Moved product route rate limit values to environment-based config.
* Added `429 TOO_MANY_REQUESTS` response behavior.
* Added request size limit middleware.
* Added request size limit unit tests.
* Added `413 REQUEST_BODY_TOO_LARGE` response behavior.
* Added Fastify `bodyLimit`.
* Added basic security headers middleware.
* Added security headers unit tests.
* Added route-level auth configuration.
* Added downstream route config tests for rate limit and auth requirements.
* Added integration test for oversized request body.
* Added integration test for product route rate limit exceeded behavior.
* Manually validated rate limit behavior.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 3

Sprint 3 completed:

* Added Docker Compose foundation.
* Added `.dockerignore`.
* Added API Gateway Dockerfile.
* Added Product Service Dockerfile.
* Validated Dockerized API Gateway and Product Service.
* Added PostgreSQL Docker service.
* Added PostgreSQL healthcheck.
* Added PostgreSQL Docker volume.
* Added Product Service `DATABASE_URL` config.
* Added Product Service Docker `DATABASE_URL`.
* Added Prisma Client dependency.
* Added Prisma CLI dependency.
* Added Prisma schema.
* Added `Product` model.
* Generated Prisma Client.
* Added initial Product migration.
* Validated `products` table in PostgreSQL.
* Added idempotent product seed script.
* Added Product Service Prisma database helper.
* Added Product repository.
* Replaced mock Product Service data with PostgreSQL-backed data.
* Added Redis Docker service.
* Added Redis healthcheck.
* Added API Gateway `REDIS_URL` config.
* Added API Gateway Redis client foundation.
* Added Redis client connection and disconnection lifecycle.
* Added Redis rate limit store.
* Added Redis rate limit store unit tests.
* Updated rate limit middleware to support async stores.
* Wired Redis-backed rate limiting into `GET /api/products`.
* Validated Redis rate limit key creation.
* Validated `429 TOO_MANY_REQUESTS` with Redis-backed rate limit.
* Added Redis fail-fast behavior for rate limiting.
* Added Redis response cache store.
* Added Redis response cache store unit tests.
* Wired Redis response caching into `GET /api/products`.
* Added `x-cache: MISS`, `x-cache: HIT`, and `x-cache: BYPASS`.
* Validated Redis response cache key creation.
* Validated cache MISS/HIT behavior.
* Validated cache HIT when Product Service is down.
* Isolated response cache write failures.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 4

Sprint 4 completed:

* Added structured access log middleware.
* Added safe structured access log payload.
* Avoided logging sensitive headers.
* Registered access log middleware in API Gateway.
* Added access log middleware tests.
* Added request latency measurement.
* Added `x-response-time-ms` response header.
* Added response time header tests.
* Added `prom-client` dependency.
* Added basic HTTP metrics registry.
* Added request counter metric.
* Added request duration histogram metric.
* Added response cache outcome metric.
* Added metrics registry tests.
* Added metrics middleware.
* Recorded request metrics after response.
* Recorded cache metrics from `x-cache` header.
* Added metrics middleware tests.
* Added `/metrics` route.
* Returned Prometheus text format from `/metrics`.
* Added metrics route tests.
* Added Prometheus service to Docker Compose.
* Added Prometheus config file.
* Configured Prometheus to scrape `api-gateway:3000/metrics`.
* Validated Prometheus health.
* Validated Prometheus target health is `up`.
* Added Grafana service to Docker Compose.
* Added Grafana persistent volume.
* Added Grafana Prometheus datasource provisioning.
* Validated Grafana health.
* Validated Grafana datasource through API.
* Added Grafana dashboard provider.
* Added API Gateway overview dashboard JSON.
* Added dashboard panels for request rate, request count, p95 latency, and cache outcomes.
* Validated dashboard provisioning through Grafana API.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Ran Docker Compose validation.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 5

Sprint 5 completed:

* Reviewed current downstream route configuration model.
* Identified old hardcoded runtime behavior in product proxy route.
* Added route policy type foundation.
* Added central `RoutePolicies` model.
* Moved route behavior under `policies`.
* Added auth policy.
* Added timeout policy.
* Added cache policy.
* Added rate limit policy.
* Added request transform policy.
* Added response transform policy.
* Added retry policy foundation.
* Removed hardcoded response cache TTL from app registration.
* Added downstream route configuration validation helper.
* Added duplicate route validation.
* Added gateway path validation.
* Added downstream URL validation.
* Added policy value validation.
* Added request/response transform header name validation.
* Added retry status and retry attempts validation.
* Added per-route timeout policy helper.
* Added timeout policy tests.
* Refactored product proxy route to use timeout helper.
* Added per-route cache policy helper.
* Added cache key helper.
* Added cache policy tests.
* Refactored product proxy route to use resolved cache policy.
* Added per-route rate limit policy helper.
* Added rate limit policy tests.
* Refactored product proxy route to use resolved rate limit policy.
* Added request transformation policy foundation.
* Added request transform tests.
* Wired request transform foundation into downstream request headers.
* Added response transformation policy foundation.
* Added response transform tests.
* Wired response transform foundation into cache HIT, MISS, and BYPASS responses.
* Added upstream retry policy foundation.
* Added retry policy tests.
* Wired retry helper into downstream Product Service call flow.
* Kept retry disabled by default to preserve stable runtime behavior.
* Added route policy integration test for response cache store behavior.
* Validated cache MISS then cache HIT behavior in app integration test.
* Updated app integration test to assert `x-cache: BYPASS` when cache store is not configured.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Ran Docker Compose validation.
* Validated `GET /health`.
* Validated `GET /metrics`.
* Confirmed working tree clean before documentation update.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 6

Sprint 6 completed:

* Reviewed current root and workspace package scripts.
* Confirmed root `npm run test`, `npm run typecheck`, and `npm run build` are CI-ready.
* Confirmed Product Service requires Prisma Client generation before typecheck/build in clean environments.
* Added GitHub Actions workflow at `.github/workflows/ci.yml`.
* Configured CI to run on push to `main`.
* Configured CI to run on pull request to `main`.
* Configured CI to use Node.js 20.
* Configured CI to install dependencies with `npm ci`.
* Configured CI to generate Prisma Client with `npm run db:generate -w apps/product-service`.
* Configured CI to run automated tests with `npm run test`.
* Configured CI to run TypeScript validation with `npm run typecheck`.
* Configured CI to run production build with `npm run build`.
* Added Docker image build validation for API Gateway.
* Added Docker image build validation for Product Service.
* Validated GitHub Actions CI run successfully on GitHub.
* Added live CI badge to README.
* Ran local final validation.
* Ran Docker Compose final validation.
* Validated API Gateway `/health`.
* Validated API Gateway `/metrics`.
* Confirmed working tree clean before final documentation update.
* Pushed stable checkpoints to GitHub.

---

## Current Stable Commits

### Sprint 6

```txt
b2b8929 ci: add github actions workflow
e102aa0 ci: add docker image build validation
d06e0e7 docs: add ci badge to readme
```

### Sprint 5

```txt
9138e16 feat(gateway): add route policy type foundation
dbd2607 feat(gateway): validate route policy configuration
6bf7eb1 feat(gateway): add per-route timeout policy helper
75d63f7 feat(gateway): add per-route cache policy helper
7480632 feat(gateway): add per-route rate limit policy helper
13ee083 feat(gateway): add request transformation policy foundation
57bdd38 feat(gateway): add response transformation policy foundation
806022a feat(gateway): add upstream retry policy foundation
84b3fed test(gateway): cover route policy integration behavior
```

### Sprint 4

```txt
75eacfb feat(gateway): add structured access logs
b0da511 feat(gateway): add response time header
fb17516 feat(gateway): add basic http metrics registry
31cae03 feat(gateway): expose prometheus metrics endpoint
13789a3 chore(observability): add prometheus service
6bb7de2 chore(observability): add grafana service
87490cf chore(observability): add grafana dashboard foundation
```

### Sprint 3

```txt
7dbb2d2 chore: add docker compose foundation
84a277b docs: document docker compose workflow
75edf46 chore: add postgres service to docker compose
934532b chore(product): add database url config
f390694 chore(product): add prisma schema foundation
10a3101 chore(product): add initial products migration
f247260 chore(product): add product seed script
23b5903 feat(product): read products from database
ccccda5 chore: add redis service to docker compose
94443a3 chore(gateway): add redis client foundation
25bff78 feat(gateway): add redis rate limit store
ff06658 feat(gateway): use redis backed rate limiting
411d13a feat(gateway): add redis response cache store
cf0f2b9 feat(gateway): cache product responses in redis
176bcfe fix(gateway): isolate response cache write failures
```

### Earlier Stable Foundation

```txt
5d247cc feat: setup basic gateway to product service flow
207616a refactor: split api gateway routes config and middlewares
3ae7802 refactor: split product service routes config and middlewares
c0615fe docs: add project context handoff and progress logs
71923ae docs: add architecture overview and requirements
009cc3d docs: improve readme landing page
b5ee327 docs: add environment example
fe9e5d2 docs: finalize sprint 0 readme status
f66d523 feat(gateway): normalize downstream service errors
32af4ab feat(gateway): add downstream request timeout
27f40bb refactor(gateway): add downstream route configuration
940806f feat(gateway): add api key authentication
04d616b docs: update sprint 1 progress context
6c93cbe test(gateway): add basic unit test setup
2b742d3 test(gateway): add api key auth unit tests
7388dab test(gateway): add downstream error unit tests
5023e36 test(gateway): add env parsing unit tests
7f100de test(gateway): prepare app for integration tests
056ed7a test(gateway): add api key route integration tests
8fe5aae test(gateway): add valid api key product route integration test
2fca28e test(gateway): add downstream failure integration tests
10d512a test(gateway): add downstream timeout integration test
82672c6 feat(gateway): add jwt configuration
ad0a9fd feat(gateway): add jwt authentication middleware
9cc8e88 test(gateway): add jwt auth unit tests
c233071 feat(gateway): protect product route with jwt
7c88936 feat(gateway): add in-memory rate limiting for product route
4aed0ff refactor(gateway): move product rate limit to route config env
a12605f feat(gateway): add request size limit
76fdd2f feat(gateway): add basic security headers
28a9b5e refactor(gateway): add route-level auth config
```

---

## Current Next Step

Recommended next step:

```txt
Sprint 6 - Final Documentation Update
```

Currently updating these files:

```txt
README.md
docs/project-context/AI_HANDOFF.md
docs/project-context/CURRENT_PROGRESS.md
docs/project-context/DECISION_LOG.md
docs/sdlc/requirements.md
docs/architecture/overview.md
```

After all Sprint 6 documentation files are updated:

```txt
1. Run git diff
2. Run git status
3. Commit docs with:
   docs: finalize sprint 6 documentation
4. Push to GitHub
5. Confirm GitHub Actions CI passes
```

After Sprint 6 documentation is committed, move to:

```txt
Next sprint planning
```

Possible next sprint candidates:

```txt
More Gateway Route Policy Expansion
OpenTelemetry Tracing Foundation
k6 Load Testing Foundation
Additional Downstream Service Routing
```

Recommended decision:

Choose the next sprint based on which skill should be showcased next on GitHub.

---

## Important Development Rules

Do not jump directly to advanced infrastructure before the current CI/CD foundation and project context documentation are documented and stable.

Do not add these without a planned sprint:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Complex service discovery
* Production cloud deployment

Sprint 6 documentation should focus on:

* GitHub Actions CI workflow.
* CI triggers for push and pull request to `main`.
* `npm ci` clean dependency installation.
* Prisma Client generation in CI.
* Automated test execution in CI.
* Typecheck execution in CI.
* Build execution in CI.
* API Gateway Docker image build validation.
* Product Service Docker image build validation.
* README CI badge.
* Final validation results.

The project should continue with small, stable checkpoints.

Each new feature should follow this workflow:

1. Implement code in small steps.
2. Explain purpose and request flow.
3. Run local tests.
4. Run `npm run test`.
5. Run `npm run typecheck`.
6. Run `npm run build`.
7. Commit after stable checkpoint.
8. Push after each stable commit.
9. Update project context docs at the end of the sprint.

---

## How the Assistant Should Continue

When continuing from this file, the assistant should continue with:

```txt
Sprint 6 - Final Documentation Update
```

If Sprint 6 final documentation update is already complete, continue with:

```txt
Next sprint planning
```

The assistant should continue slowly, one file or one small feature at a time.

Before coding the next step, the assistant should explain:

* What problem the step solves.
* What the expected behavior is.
* What files will be changed.
* How to test success and failure cases.
* Which unit tests and integration tests should be added.

The assistant should not skip directly to Kafka, RabbitMQ, Kubernetes, Admin Dashboard, Developer Portal, production cloud deployment, or advanced OpenTelemetry unless the user explicitly chooses that as the next sprint.
