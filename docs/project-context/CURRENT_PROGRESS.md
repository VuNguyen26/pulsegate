# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Sprint

Sprint 4 - Observability Foundation

## Current Version

v0.5.0

## Sprint Status

Sprint 4 is complete.

Sprint 3 is complete.

Sprint 2 is complete.

Sprint 1 is complete.

Sprint 0 is complete.

Sprint 4 completed the observability foundation:

1. Add structured access logs in API Gateway.
2. Add request latency measurement.
3. Add `x-response-time-ms` response header.
4. Add basic HTTP metrics registry.
5. Add metrics middleware.
6. Add Prometheus-compatible `/metrics` endpoint.
7. Add Prometheus Docker Compose service.
8. Add Prometheus scrape configuration for API Gateway.
9. Add Grafana Docker Compose service.
10. Add Grafana Prometheus datasource provisioning.
11. Add Grafana dashboard provisioning.
12. Add API Gateway overview dashboard foundation.
13. Validate Prometheus target health.
14. Validate Grafana datasource.
15. Validate Grafana dashboard provisioning.
16. Run automated tests, typecheck, build, and Docker validation.
17. Push stable checkpoints to GitHub.

## Completed

### Repository Setup

* GitHub repository created.
* Local repository cloned.
* npm workspaces configured.
* TypeScript configured.
* Basic monorepo structure created.
* `.gitignore` added.
* `.gitattributes` added.
* `.env.example` added.
* Docker Compose foundation added.
* API Gateway Dockerfile added.
* Product Service Dockerfile added.
* `.dockerignore` added.

### Infrastructure

Current local infrastructure is managed through Docker Compose.

Implemented services:

```txt
api-gateway
product-service
postgres
redis
prometheus
grafana
```

Current exposed ports:

```txt
API Gateway      -> 3000
Product Service  -> 3001
Grafana          -> 3002
PostgreSQL       -> 5432
Redis            -> 6379
Prometheus       -> 9090
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

Current Docker Compose behavior:

* API Gateway runs inside Docker.
* Product Service runs inside Docker.
* PostgreSQL runs inside Docker.
* Redis runs inside Docker.
* Prometheus runs inside Docker.
* Grafana runs inside Docker.
* Product Service depends on healthy PostgreSQL.
* API Gateway depends on healthy Redis and healthy Product Service.
* Prometheus depends on API Gateway.
* Grafana depends on Prometheus.
* PostgreSQL uses a persistent Docker volume.
* Prometheus uses a persistent Docker volume.
* Grafana uses a persistent Docker volume.
* API Gateway uses Docker internal service URL for Product Service.
* API Gateway uses Docker internal Redis URL.
* Prometheus scrapes API Gateway using Docker internal service URL.
* Grafana connects to Prometheus using Docker internal service URL.

Current infrastructure validation:

```powershell
docker compose up --build -d
docker compose ps
```

Expected services:

```txt
pulsegate-postgres         healthy
pulsegate-redis            healthy
pulsegate-product-service  healthy
pulsegate-api-gateway      up
pulsegate-prometheus       up
pulsegate-grafana          up
```

### PostgreSQL

Implemented:

* PostgreSQL Docker service.
* PostgreSQL healthcheck.
* PostgreSQL persistent Docker volume.
* Prisma schema foundation.
* Initial Product model.
* Initial Product migration.
* Idempotent Product seed script.
* PostgreSQL-backed Product Service data.

Local database name:

```txt
pulsegate
```

Default local database user:

```txt
pulsegate
```

Default local password:

```txt
pulsegate_password
```

Current local host connection string:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current Docker internal connection string:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Current database tables:

```txt
_prisma_migrations
products
```

Current `products` table columns:

```txt
id
name
price
createdAt
updatedAt
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

### Redis

Implemented:

* Redis Docker service.
* Redis healthcheck.
* Redis client foundation in API Gateway.
* Redis-backed rate limiting.
* Redis response caching.
* Redis command timeout behavior.
* Redis fail-fast behavior for rate limit and cache commands.
* Redis offline queue disabled.
* Redis reconnect strategy disabled for the current local development setup.

Current local Redis URL:

```txt
redis://localhost:6379
```

Current Docker internal Redis URL:

```txt
redis://redis:6379
```

Redis validation command:

```powershell
docker compose exec redis redis-cli ping
```

Expected result:

```txt
PONG
```

Current Redis key categories:

```txt
rate-limit:*
response-cache:*
```

Example Redis rate limit key:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Example Redis response cache key:

```txt
response-cache:GET:/api/products
```

### Prometheus

Implemented:

* Prometheus Docker Compose service.
* Prometheus persistent Docker volume.
* Prometheus configuration file.
* Prometheus scrape job for API Gateway.
* Prometheus target validation.

Prometheus URL:

```txt
http://localhost:9090
```

Prometheus config location:

```txt
observability/prometheus/prometheus.yml
```

Current Prometheus scrape configuration:

```txt
job_name: pulsegate-api-gateway
metrics_path: /metrics
target: api-gateway:3000
scrape_interval: 5s
```

Prometheus health check:

```powershell
Invoke-WebRequest http://localhost:9090/-/healthy -UseBasicParsing
```

Expected result:

```txt
Prometheus Server is Healthy.
```

Prometheus target check:

```powershell
Invoke-RestMethod http://localhost:9090/api/v1/targets | ConvertTo-Json -Depth 10
```

Expected target:

```txt
job: pulsegate-api-gateway
scrapeUrl: http://api-gateway:3000/metrics
health: up
```

### Grafana

Implemented:

* Grafana Docker Compose service.
* Grafana persistent Docker volume.
* Grafana provisioning directory.
* Grafana Prometheus datasource provisioning.
* Grafana dashboard provider provisioning.
* API Gateway overview dashboard foundation.

Grafana URL:

```txt
http://localhost:3002
```

Local development login:

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

Grafana health check:

```powershell
Invoke-RestMethod http://localhost:3002/api/health | ConvertTo-Json -Depth 10
```

Expected result:

```txt
database: ok
```

Grafana datasource check:

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

Expected datasource:

```txt
name: Prometheus
type: prometheus
uid: pulsegate-prometheus
url: http://prometheus:9090
isDefault: true
```

Grafana dashboard search:

```powershell
Invoke-RestMethod http://localhost:3002/api/search?query=PulseGate `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Expected dashboard:

```txt
title: PulseGate API Gateway Overview
uid: pulsegate-api-gateway-overview
folderTitle: PulseGate
```

Grafana dashboard detail check:

```powershell
Invoke-RestMethod http://localhost:3002/api/dashboards/uid/pulsegate-api-gateway-overview `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Expected result:

```txt
dashboard.title: PulseGate API Gateway Overview
dashboard.panels: 4 panels
provisioned: true
```

### API Gateway

Location:

```txt
apps/api-gateway
```

Current port:

```txt
3000
```

Implemented:

* Fastify server.
* Health check endpoint.
* Product proxy endpoint.
* Prometheus metrics endpoint.
* Request ID generation.
* Request ID response header.
* Request ID forwarding to Product Service.
* JSON logger.
* Structured access logs.
* Request latency measurement.
* `x-response-time-ms` response header.
* Basic HTTP metrics registry.
* HTTP metrics middleware.
* Prometheus-compatible metrics output.
* Basic 404 handler.
* Basic 500 error handler.
* Config separated into `config/env.ts`.
* Routes separated into `routes`.
* Middlewares separated into `middlewares`.
* Errors separated into `errors`.
* Redis client separated into `redis`.
* Rate limit stores separated into `rate-limit`.
* Response cache stores separated into `cache`.
* Observability code separated into `observability`.
* App builder separated into `app.ts`.
* Server startup separated into `server.ts`.
* Normalized downstream service errors.
* Downstream request timeout using `AbortController`.
* Configurable downstream request timeout through `DOWNSTREAM_REQUEST_TIMEOUT_MS`.
* Downstream route configuration foundation.
* API key authentication middleware.
* Configurable API key header through `API_KEY_HEADER`.
* Local development API key list through `API_KEYS`.
* JWT configuration.
* JWT authentication middleware.
* JWT validation using `jose`.
* Protected Product route with API key and JWT.
* In-memory rate limit store for tests and fallback-compatible abstractions.
* Redis-backed rate limit store for Docker/runtime flow.
* Route-level rate limit configuration.
* Rate limit response behavior with `429 TOO_MANY_REQUESTS`.
* Rate limit response headers.
* Configurable product route rate limit through environment variables.
* Request size limit.
* Configurable request body size limit through `MAX_REQUEST_BODY_BYTES`.
* Request body too large response with `413 REQUEST_BODY_TOO_LARGE`.
* Basic security headers.
* Route-level auth configuration.
* Redis response cache store.
* Product response caching for `GET /api/products`.
* Cache debug headers with `x-cache: MISS`, `x-cache: HIT`, and `x-cache: BYPASS`.
* Cache HIT behavior when Product Service is down.
* Cache write failure isolation.
* Vitest unit test setup.
* API Gateway integration tests using `app.inject()`.

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
  -> Proxies to Product Service on cache MISS
```

Current API key header:

```txt
x-api-key
```

Default local development API key:

```txt
dev-api-key
```

Current JWT header:

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

Current traffic protection configuration:

```txt
MAX_REQUEST_BODY_BYTES=1048576
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS=5
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS=60000
```

Current response cache behavior:

```txt
GET /api/products
  -> Cache MISS:
       x-cache: MISS
       API Gateway calls Product Service
       API Gateway stores response in Redis
  -> Cache HIT:
       x-cache: HIT
       API Gateway returns cached response from Redis
  -> Cache disabled in injected tests:
       x-cache: BYPASS
```

Current response cache TTL:

```txt
30 seconds
```

Current structured access log event:

```txt
http_request_completed
```

Current structured access log fields:

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

Sensitive headers are not logged:

```txt
x-api-key
authorization
cookie
```

Current response latency header:

```txt
x-response-time-ms
```

Current Prometheus metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current API Gateway structure:

```txt
apps/api-gateway/src/
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
```

### Product Service

Location:

```txt
apps/product-service
```

Current port:

```txt
3001
```

Implemented:

* Fastify server.
* Health check endpoint.
* Products endpoint.
* PostgreSQL-backed products.
* Prisma Client.
* Product repository.
* Database connection helper.
* Request ID generation and reuse.
* Request ID reuse from API Gateway.
* JSON logger.
* Basic 404 handler.
* Basic 500 error handler.
* Config separated into `config/env.ts`.
* Routes separated into `routes`.
* Middlewares separated into `middlewares`.
* Prisma schema.
* Prisma migration for `products`.
* Idempotent seed script.

Current endpoints:

```txt
GET /health
GET /products
```

Current Product Service behavior:

```txt
GET /products
  -> Reads products from PostgreSQL
  -> Returns product list ordered by id
```

Current Product Service structure:

```txt
apps/product-service/
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
```

### Observability Structure

Current observability-related files:

```txt
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
```

Current Docker Compose observability flow:

```txt
API Gateway :3000
  -> Exposes /metrics

Prometheus :9090
  -> Scrapes http://api-gateway:3000/metrics

Grafana :3002
  -> Uses Prometheus datasource at http://prometheus:9090
  -> Loads provisioned dashboard from /var/lib/grafana/dashboards
```

## Current Working Flow

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Basic security headers
    -> Request size limit
    -> Structured access log start
    -> Metrics collection start
    -> API key authentication for protected routes
    -> Redis-backed rate limiting by API key and route
    -> JWT Bearer token authentication for protected routes
    -> Redis response cache
      -> Cache HIT:
           -> Return cached product response
      -> Cache MISS:
           -> Downstream route configuration
           -> Downstream timeout handling
           -> Normalized downstream error handling
           -> Product Service :3001
             -> Prisma Client
             -> PostgreSQL :5432
             -> Database-backed product response
           -> Store response in Redis cache
    -> Add x-response-time-ms
    -> Record HTTP metrics
    -> Write structured access log
    -> Return response to Client
```

Current product request flow:

```txt
Client
  -> GET http://localhost:3000/api/products
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
      -> If request body is too large:
        -> 413 REQUEST_BODY_TOO_LARGE
    -> API Gateway checks x-api-key
      -> If missing:
        -> 401 API_KEY_MISSING
      -> If invalid:
        -> 403 API_KEY_INVALID
      -> If valid:
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
                -> API Gateway checks Redis response cache
                  -> If cache HIT:
                    -> 200 with x-cache: HIT
                    -> Return cached products
                  -> If cache MISS:
                    -> API Gateway calls Product Service
                      -> GET http://product-service:3001/products inside Docker
                      -> GET http://127.0.0.1:3001/products in local host mode
                    -> Product Service reads products from PostgreSQL
                    -> Product Service returns database-backed product data
                    -> API Gateway stores response in Redis cache
                    -> API Gateway returns 200 with x-cache: MISS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Current observability flow:

```txt
Client
  -> Sends request to API Gateway

API Gateway
  -> Handles request
  -> Adds x-request-id
  -> Adds x-response-time-ms
  -> Writes structured JSON access log
  -> Updates in-memory Prometheus metrics registry
  -> Exposes metrics at /metrics

Prometheus
  -> Scrapes API Gateway /metrics every 5 seconds
  -> Stores time-series metrics

Grafana
  -> Reads metrics from Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard
```

Current downstream failure flow:

```txt
Client
  -> GET http://localhost:3000/api/products with valid API key and valid JWT
    -> API Gateway checks Redis response cache
      -> If cache HIT:
        -> 200 with x-cache: HIT even if Product Service is temporarily down
      -> If cache MISS:
        -> API Gateway calls Product Service
          -> If Product Service is unavailable:
            -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE
          -> If Product Service times out:
            -> 504 DOWNSTREAM_TIMEOUT
          -> If Product Service returns 5xx:
            -> 502 DOWNSTREAM_HTTP_ERROR
          -> If Product Service returns invalid JSON:
            -> 502 DOWNSTREAM_INVALID_RESPONSE
```

Current Redis failure behavior:

```txt
Redis unavailable
  -> API Gateway fails fast for Redis-backed rate limit/cache commands
  -> Product route returns generic 500 Internal Server Error
  -> Internal Redis details are not exposed in the response body
```

## Traffic Protection Behavior

### Rate Limiting

Current protected route:

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

Default local rate limit:

```txt
5 requests per 60 seconds
```

Rate limit identity:

```txt
API key + HTTP method + route path
```

Current rate limit key shape before Redis prefix:

```txt
api-key:<api-key>:route:<method>:<route-path>
```

Example logical rate limit key:

```txt
api-key:dev-api-key:route:GET:/api/products
```

Current Redis rate limit key shape:

```txt
rate-limit:api-key:<api-key>:route:<method>:<route-path>
```

Example Redis rate limit key:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Rate limit response headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
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

### Request Size Limit

Current default request body size limit:

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

### Basic Security Headers

API Gateway currently adds these response headers:

```txt
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'
```

## Response Cache Behavior

Current cached route:

```txt
GET /api/products
```

Current Redis response cache key:

```txt
response-cache:GET:/api/products
```

Current behavior:

```txt
First request
  -> Cache MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis
  -> Response header: x-cache: MISS

Second request within TTL
  -> Cache HIT
  -> API Gateway returns cached response from Redis
  -> Response header: x-cache: HIT
```

Current TTL:

```txt
30 seconds
```

Expected response cache headers:

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

## Observability Behavior

### Structured Access Logs

API Gateway writes structured access logs after each request completes.

Current access log event:

```txt
http_request_completed
```

Current fields:

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

Example conceptual log payload:

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

Sensitive values are intentionally not logged:

```txt
x-api-key
authorization
cookie
```

### Response Time Header

API Gateway adds a latency header to responses:

```txt
x-response-time-ms
```

Example:

```txt
x-response-time-ms: 4.32
```

The value is formatted in milliseconds with two decimal places.

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

Current Prometheus metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Example metrics:

```txt
http_requests_total{method="GET",route="/health",status_code="200"} 1
http_request_duration_seconds_count{method="GET",route="/health",status_code="200"} 1
http_response_cache_total{route="/api/products",cache_status="HIT"} 1
```

### Prometheus Scraping

Prometheus scrapes API Gateway using Docker internal DNS:

```txt
http://api-gateway:3000/metrics
```

Scrape interval:

```txt
5 seconds
```

### Grafana Dashboard

Grafana uses the provisioned Prometheus datasource:

```txt
http://prometheus:9090
```

Dashboard title:

```txt
PulseGate API Gateway Overview
```

Dashboard UID:

```txt
pulsegate-api-gateway-overview
```

Dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

## Main Test Commands

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

Run Product Service seed:

```powershell
npm run db:seed -w apps/product-service
```

Generate Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Validate PostgreSQL tables:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt"
```

Validate products table:

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

Test Product Service:

```powershell
Invoke-RestMethod http://localhost:3001/health | ConvertTo-Json -Depth 10
Invoke-RestMethod http://localhost:3001/products | ConvertTo-Json -Depth 10
```

Test API Gateway health:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Test API Gateway metrics:

```powershell
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
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

Test Grafana dashboard details:

```powershell
Invoke-RestMethod http://localhost:3002/api/dashboards/uid/pulsegate-api-gateway-overview `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Create local development JWT token:

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

Create API request headers:

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}
```

Test API Gateway products with valid API key and valid JWT:

```powershell
Invoke-RestMethod http://localhost:3000/api/products `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test product route Redis-backed rate limit:

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

Expected rate limit behavior:

```txt
Attempt 1 -> 200, Remaining 4
Attempt 2 -> 200, Remaining 3
Attempt 3 -> 200, Remaining 2
Attempt 4 -> 200, Remaining 1
Attempt 5 -> 200, Remaining 0
Attempt 6 -> 429 TOO_MANY_REQUESTS
```

Check Redis rate limit key:

```powershell
docker compose exec redis redis-cli GET "rate-limit:api-key:dev-api-key:route:GET:/api/products"
docker compose exec redis redis-cli TTL "rate-limit:api-key:dev-api-key:route:GET:/api/products"
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

Check Redis response cache key:

```powershell
docker compose exec redis redis-cli GET "response-cache:GET:/api/products"
docker compose exec redis redis-cli TTL "response-cache:GET:/api/products"
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

Test missing API key:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products | ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected missing API key response:

```json
{
  "error": {
    "code": "API_KEY_MISSING",
    "message": "API key is required",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
401
```

Test invalid API key:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers @{ "x-api-key" = "wrong-key" } |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected invalid API key response:

```json
{
  "error": {
    "code": "API_KEY_INVALID",
    "message": "API key is invalid",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
403
```

Test missing JWT token:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers @{ "x-api-key" = "dev-api-key" } |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected missing JWT response:

```json
{
  "error": {
    "code": "JWT_TOKEN_MISSING",
    "message": "Bearer token is required",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
401
```

Test invalid JWT token:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers @{
      "x-api-key" = "dev-api-key"
      "authorization" = "Bearer invalid-token"
    } |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected invalid JWT response:

```json
{
  "error": {
    "code": "JWT_TOKEN_INVALID",
    "message": "Bearer token is invalid",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
403
```

Expected products response with valid API key and valid JWT:

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

## Authentication Behavior

### API Key Authentication

Protected route:

```txt
GET /api/products
```

Current behavior:

```txt
Missing API key
  -> 401 API_KEY_MISSING

Invalid API key
  -> 403 API_KEY_INVALID

Valid API key
  -> Continue to Redis-backed route-level rate limiting
```

### JWT Authentication

Protected route:

```txt
GET /api/products
```

Current behavior:

```txt
Missing Bearer token
  -> 401 JWT_TOKEN_MISSING

Invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

Valid Bearer token
  -> Continue to Redis response cache
```

JWT validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

JWT payload is attached to:

```txt
request.jwtPayload
```

## Downstream Error Behavior

When Product Service is unavailable and cache MISS, API Gateway returns:

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
17 test files passed
101 tests passed
```

Current unit tests:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
  -> 4 tests

apps/api-gateway/src/middlewares/access-log.middleware.test.ts
  -> 6 tests

apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
  -> 4 tests

apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
  -> 9 tests

apps/api-gateway/src/middlewares/metrics.middleware.test.ts
  -> 4 tests

apps/api-gateway/src/rate-limit/in-memory-rate-limit-store.test.ts
  -> 9 tests

apps/api-gateway/src/rate-limit/redis-rate-limit-store.test.ts
  -> 7 tests

apps/api-gateway/src/middlewares/rate-limit.middleware.test.ts
  -> 5 tests

apps/api-gateway/src/cache/redis-response-cache-store.test.ts
  -> 7 tests

apps/api-gateway/src/middlewares/request-size-limit.middleware.test.ts
  -> 6 tests

apps/api-gateway/src/middlewares/security-headers.middleware.test.ts
  -> 1 test

apps/api-gateway/src/errors/downstream-service-error.test.ts
  -> 5 tests

apps/api-gateway/src/config/env.test.ts
  -> 14 tests

apps/api-gateway/src/config/downstream-routes.test.ts
  -> 2 tests

apps/api-gateway/src/observability/metrics.test.ts
  -> 4 tests

apps/api-gateway/src/routes/metrics.route.test.ts
  -> 2 tests
```

Current integration tests:

```txt
apps/api-gateway/src/app.test.ts
  -> 12 tests
```

Integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes x-response-time-ms
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
  -> includes rate limit headers
  -> includes response time header

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

## Validation Status

Latest validation:

* `npm run test` passed.
* `npm run typecheck` passed.
* `npm run build` passed.
* `docker compose up --build -d` passed.
* PostgreSQL service was healthy.
* Redis service was healthy.
* Product Service container was healthy.
* API Gateway container started successfully.
* Prometheus container started successfully.
* Grafana container started successfully.
* Product Service `/health` passed.
* Product Service `/products` returned database-backed product data.
* API Gateway `/health` passed without API key.
* API Gateway `/health` includes security headers.
* API Gateway responses include `x-response-time-ms`.
* API Gateway `/metrics` returned Prometheus text format.
* Prometheus `/api/v1/targets` showed API Gateway target as `health: up`.
* Grafana `/api/health` returned `database: ok`.
* Grafana datasource API showed Prometheus datasource provisioned.
* Grafana dashboard search API showed `PulseGate API Gateway Overview`.
* Grafana dashboard detail API showed 4 provisioned panels.
* API Gateway `/api/products` returned `401 API_KEY_MISSING` without API key.
* API Gateway `/api/products` returned `403 API_KEY_INVALID` with invalid API key.
* API Gateway `/api/products` returned `401 JWT_TOKEN_MISSING` with valid API key but missing JWT.
* API Gateway `/api/products` returned `403 JWT_TOKEN_INVALID` with valid API key but invalid JWT.
* API Gateway `/api/products` passed with valid API key and valid JWT.
* API Gateway `/api/products` returned `429 TOO_MANY_REQUESTS` when Redis-backed rate limit was exceeded.
* Redis rate limit key was created and incremented.
* API Gateway `/api/products` returned `x-cache: MISS` on first valid request after cache clear.
* API Gateway `/api/products` returned `x-cache: HIT` on the second valid request within cache TTL.
* Redis response cache key was created with TTL.
* API Gateway `/api/products` returned cached response with `x-cache: HIT` when Product Service was stopped.
* API Gateway `/api/products` returned generic `500 Internal Server Error` quickly when Redis was stopped.
* API Gateway did not expose Redis internal details in the Redis failure response body.
* API Gateway still returns valid downstream data if response cache write fails.
* Automated tests cover request ID, access logs, response time header, API key authentication, JWT authentication, metrics registry, metrics middleware, metrics route, in-memory rate limit store, Redis rate limit store, rate limit middleware, Redis response cache store, request size limit, security headers, route config, downstream unavailable, downstream HTTP error, invalid JSON, and timeout behavior.
* Code pushed to GitHub.
* Git working tree was clean after latest commit.

## Documentation Status

Completed documentation from previous sprints:

* `README.md`
* `.env.example`
* `docs/project-context/CURRENT_PROGRESS.md`
* `docs/project-context/DECISION_LOG.md`
* `docs/project-context/AI_HANDOFF.md`
* `docs/architecture/overview.md`
* `docs/sdlc/requirements.md`

Current Sprint 4 final documentation update is in progress.

## Latest Stable Commits

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

## Current Status

Sprint 0 is complete.

Sprint 1 is complete.

Sprint 2 is complete.

Sprint 3 is complete.

Sprint 4 technical implementation is complete.

PulseGate currently has a stable local-first API Gateway, infrastructure foundation, traffic protection layer, PostgreSQL-backed Product Service, Redis-backed rate limiting, Redis response caching, and observability foundation with structured logs, Prometheus metrics, Prometheus scraping, Grafana datasource provisioning, and Grafana dashboard provisioning.

Current architecture:

```txt
Client
  -> API Gateway
    -> Request ID handling
    -> Structured access logs
    -> Response time measurement
    -> Basic security headers
    -> Request size limit
    -> API key authentication for protected routes
    -> Redis-backed rate limiting for protected routes
    -> JWT authentication for protected routes
    -> Redis response cache
    -> Downstream route configuration
    -> Downstream timeout handling
    -> Normalized downstream error handling
    -> Product Service
      -> Prisma
      -> PostgreSQL
      -> Database-backed product response

API Gateway
  -> /metrics

Prometheus
  -> Scrapes API Gateway /metrics

Grafana
  -> Reads Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard
```

## Sprint 4 Progress

### Done

1. Add structured access log middleware.
2. Add access log duration calculation.
3. Add safe structured access log payload.
4. Avoid logging sensitive headers.
5. Register access log middleware in API Gateway.
6. Add access log middleware tests.
7. Add `x-response-time-ms` response header.
8. Format response time header with two decimals.
9. Add response time header tests.
10. Add `prom-client` dependency.
11. Add basic HTTP metrics registry.
12. Add request counter metric.
13. Add request duration histogram metric.
14. Add response cache outcome metric.
15. Add metrics registry tests.
16. Add metrics middleware.
17. Record request metrics after response.
18. Record cache metrics from `x-cache` header.
19. Add metrics middleware tests.
20. Add `/metrics` route.
21. Return Prometheus text format from `/metrics`.
22. Add metrics route tests.
23. Add Prometheus service to Docker Compose.
24. Add Prometheus config file.
25. Configure Prometheus to scrape `api-gateway:3000/metrics`.
26. Validate Prometheus health.
27. Validate Prometheus target health is `up`.
28. Add Grafana service to Docker Compose.
29. Add Grafana persistent volume.
30. Add Grafana Prometheus datasource provisioning.
31. Validate Grafana health.
32. Validate Grafana datasource through API.
33. Add Grafana dashboard provider.
34. Add API Gateway overview dashboard JSON.
35. Add dashboard panels for request rate, request count, p95 latency, and cache outcomes.
36. Validate dashboard provisioning through Grafana API.
37. Run `npm run test`.
38. Run `npm run typecheck`.
39. Run `npm run build`.
40. Run Docker Compose validation.
41. Push stable checkpoints to GitHub.

### Remaining

No remaining Sprint 4 technical implementation tasks.

Sprint 4 final documentation update is in progress.

## Recommended Next Step

Recommended next step:

```txt
Sprint 4 - Final Documentation Update
```

After final documentation update, the project can move to:

```txt
Sprint 5 - Advanced Gateway Policies
```

Recommended Sprint 5 direction:

1. Add more route policy configuration.
2. Improve route-level auth policy model.
3. Add per-route timeout and cache policy configuration.
4. Add per-route rate limit policy configuration.
5. Add request/response transformation foundation.
6. Add upstream retry policy foundation.
7. Add route config validation improvements.
8. Keep Kafka, RabbitMQ, Kubernetes, Admin Dashboard, Developer Portal, and OpenTelemetry for later sprints unless explicitly needed.

## Do Not Add Yet

Do not add these before the project is ready:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Complex service discovery
* Production cloud deployment

## Notes

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
9. Update project context docs at the end of each sprint or when needed.

Current preferred development style:

* Code sample first.
* Explain each file.
* Explain the request flow.
* Test manually and with automated tests.
* Run test, typecheck, and build.
* Commit only after a stable checkpoint.
* Push after each stable commit.
