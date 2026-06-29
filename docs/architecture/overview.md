# PulseGate Architecture Overview

## 1. Project Overview

PulseGate is a High-Traffic API Gateway & Observability Platform.

The long-term goal is to build a mini API Gateway and API Management system inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

PulseGate is designed to help backend teams manage, protect, monitor, and scale APIs in a microservice environment.

Current version:

```txt
v0.5.0
```

Current status:

```txt
Sprint 4 - Observability Foundation Technical Implementation Complete
```

---

## 2. Target Users

PulseGate is designed for:

* Backend Developers
* DevOps Engineers
* SREs
* Tech Leads
* Companies with multiple internal or external APIs

---

## 3. Problems PulseGate Solves

PulseGate aims to solve these problems:

* Provide a single entry point for multiple backend services.
* Route client requests to the correct downstream service.
* Centralize authentication and authorization.
* Protect APIs from spam, abuse, excessive traffic, and unsafe payloads.
* Reduce backend load with Redis response caching.
* Provide database-backed downstream service data.
* Add request logging for debugging.
* Add latency visibility for local testing.
* Expose Prometheus-compatible HTTP metrics.
* Scrape and store time-series metrics through Prometheus.
* Visualize Gateway behavior through Grafana dashboards.
* Prepare for distributed tracing.
* Support local infrastructure through Docker Compose.
* Support future event streaming and background jobs.
* Provide a foundation for future API management features.

---

## 4. Current Architecture

Current stable architecture after Sprint 4:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> API key authentication for protected routes
    -> Redis-backed rate limiting by API key and route
    -> JWT authentication for protected routes
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
```

Current architecture diagram:

```mermaid
flowchart LR
    Client[Client / API Consumer] --> Gateway[PulseGate API Gateway<br/>Port 3000]

    Gateway --> ReqId[Request ID Middleware]
    ReqId --> AccessLogStart[Access Log Timer]
    AccessLogStart --> MetricsStart[Metrics Timer]
    MetricsStart --> SecurityHeaders[Security Headers Middleware]
    SecurityHeaders --> SizeLimit[Request Size Limit]
    SizeLimit --> ApiKey[API Key Authentication]
    ApiKey --> RateLimit[Redis-Backed Rate Limiting]
    RateLimit --> Jwt[JWT Authentication]
    Jwt --> Cache{Redis Response Cache}

    Cache -->|HIT| CachedResponse[Cached Product Response]
    CachedResponse --> ResponseHeaders[Response Headers<br/>x-response-time-ms]

    Cache -->|MISS| RouteConfig[Downstream Route Config]
    RouteConfig --> Product[Product Service<br/>Port 3001]
    Product --> Prisma[Prisma Client]
    Prisma --> Postgres[(PostgreSQL<br/>Port 5432)]
    Postgres --> Prisma
    Prisma --> Product
    Product --> CacheStore[Store Response in Redis Cache]
    CacheStore --> ResponseHeaders

    RateLimit --> Redis[(Redis<br/>Port 6379)]
    Cache --> Redis
    CacheStore --> Redis

    ResponseHeaders --> MetricsRecord[Record HTTP Metrics]
    MetricsRecord --> AccessLogWrite[Write Structured Access Log]
    AccessLogWrite --> Client

    Gateway --> MetricsEndpoint[/GET /metrics/]
    Prometheus[Prometheus<br/>Port 9090] -->|Scrapes| MetricsEndpoint
    Grafana[Grafana<br/>Port 3002] -->|Reads datasource| Prometheus
```

Current behavior:

1. Client sends a request to API Gateway.
2. API Gateway creates or reuses a request ID.
3. API Gateway starts structured access log timing.
4. API Gateway starts metrics timing.
5. API Gateway adds baseline security headers.
6. API Gateway checks request body size.
7. API Gateway checks API key for protected routes.
8. API Gateway applies Redis-backed rate limiting for protected routes.
9. API Gateway checks JWT for protected routes.
10. API Gateway checks Redis response cache.
11. If cache HIT, API Gateway returns cached response with `x-cache: HIT`.
12. If cache MISS, API Gateway uses route config to determine downstream service information.
13. API Gateway calls Product Service.
14. API Gateway forwards the same `x-request-id` header.
15. Product Service receives the request.
16. Product Service reuses the same request ID.
17. Product Service reads product data from PostgreSQL using Prisma.
18. Product Service returns database-backed product data.
19. API Gateway stores the response in Redis cache.
20. API Gateway returns the response with `x-cache: MISS`.
21. API Gateway adds `x-response-time-ms`.
22. API Gateway records Prometheus metrics.
23. API Gateway writes a structured access log.
24. API Gateway normalizes downstream errors when needed.
25. Prometheus scrapes API Gateway `/metrics`.
26. Grafana reads metrics from Prometheus and displays the API Gateway overview dashboard.

---

## 5. Current Infrastructure

PulseGate currently runs locally through Docker Compose.

Current Docker services:

```txt
api-gateway
product-service
postgres
redis
prometheus
grafana
```

Current container names:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
pulsegate-prometheus
pulsegate-grafana
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

Current Docker Compose responsibilities:

* Runs API Gateway.
* Runs Product Service.
* Runs PostgreSQL.
* Runs Redis.
* Runs Prometheus.
* Runs Grafana.
* Provides Docker internal service DNS.
* Provides PostgreSQL healthcheck.
* Provides Redis healthcheck.
* Starts Product Service after PostgreSQL is healthy.
* Starts API Gateway after Redis and Product Service are healthy.
* Starts Prometheus after API Gateway.
* Starts Grafana after Prometheus.
* Provides persistent Docker volume for PostgreSQL.
* Provides persistent Docker volume for Prometheus.
* Provides persistent Docker volume for Grafana.
* Mounts Prometheus scrape configuration.
* Mounts Grafana provisioning configuration.
* Mounts Grafana dashboard JSON files.

Current Docker command:

```powershell
docker compose up --build -d
```

Expected Docker status:

```txt
pulsegate-postgres         healthy
pulsegate-redis            healthy
pulsegate-product-service  healthy
pulsegate-api-gateway      up
pulsegate-prometheus       up
pulsegate-grafana          up
```

---

## 6. Current Services

### 6.1 API Gateway

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

Route protection:

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
```

Responsibilities:

* Acts as the single entry point for clients.
* Receives client requests.
* Generates or reuses request ID.
* Adds `x-request-id` response header.
* Adds `x-response-time-ms` response header.
* Adds basic security headers.
* Applies request size limit.
* Routes `/api/products` to Product Service on cache MISS.
* Returns cached product response on cache HIT.
* Forwards `x-request-id` to downstream service.
* Applies API key authentication.
* Applies Redis-backed rate limiting.
* Applies JWT authentication.
* Attaches verified JWT payload to `request.jwtPayload`.
* Uses downstream route configuration.
* Uses route-level auth configuration.
* Uses route-level rate limit configuration.
* Applies downstream request timeout.
* Normalizes downstream service errors.
* Handles basic 404 errors.
* Handles basic 500 errors.
* Logs requests in JSON format.
* Writes structured access logs after request completion.
* Records HTTP metrics after request completion.
* Exposes Prometheus-compatible metrics at `/metrics`.
* Supports automated integration tests using Fastify `app.inject()`.

Current structure:

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

---

### 6.2 Product Service

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

Responsibilities:

* Provides product-related APIs.
* Returns database-backed product data.
* Reads product data from PostgreSQL using Prisma Client.
* Generates or reuses request ID.
* Reuses request ID from API Gateway.
* Handles basic 404 errors.
* Handles basic 500 errors.
* Logs requests in JSON format.
* Disconnects Prisma Client on server close.
* Supports Prisma schema, migration, and seed script.

Current structure:

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

---

### 6.3 PostgreSQL

PostgreSQL is used by Product Service.

Current database:

```txt
pulsegate
```

Current database user:

```txt
pulsegate
```

Current database password:

```txt
pulsegate_password
```

Current local host database URL:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current Docker internal database URL:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Current tables:

```txt
_prisma_migrations
products
```

Current Product model fields:

```txt
id
name
price
createdAt
updatedAt
```

Current seed products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

---

### 6.4 Redis

Redis is used by API Gateway.

Current local Redis URL:

```txt
redis://localhost:6379
```

Current Docker internal Redis URL:

```txt
redis://redis:6379
```

Current Redis responsibilities:

* Store rate limit counters.
* Store response cache payloads.
* Support Gateway traffic protection.
* Support Gateway response caching.

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

---

### 6.5 Prometheus

Prometheus is used to scrape and store API Gateway metrics.

Current local URL:

```txt
http://localhost:9090
```

Current Docker internal target:

```txt
http://api-gateway:3000/metrics
```

Current config file:

```txt
observability/prometheus/prometheus.yml
```

Current scrape job:

```txt
pulsegate-api-gateway
```

Current scrape interval:

```txt
5 seconds
```

Current responsibilities:

* Scrape API Gateway `/metrics`.
* Store Gateway time-series metrics.
* Provide PromQL query API.
* Provide metrics datasource for Grafana.

Expected target status:

```txt
job: pulsegate-api-gateway
scrapeUrl: http://api-gateway:3000/metrics
health: up
```

---

### 6.6 Grafana

Grafana is used to visualize API Gateway metrics.

Current local URL:

```txt
http://localhost:3002
```

Current local login:

```txt
username: admin
password: admin
```

Current datasource config:

```txt
observability/grafana/provisioning/datasources/prometheus.yml
```

Current dashboard provider config:

```txt
observability/grafana/provisioning/dashboards/dashboards.yml
```

Current dashboard JSON:

```txt
observability/grafana/dashboards/api-gateway-overview.json
```

Current provisioned datasource:

```txt
name: Prometheus
uid: pulsegate-prometheus
type: prometheus
url: http://prometheus:9090
isDefault: true
```

Current provisioned dashboard:

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

## 7. Current Request Flow

### 7.1 API Gateway Health Check Flow

```txt
Client
  -> GET http://localhost:3000/health
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts structured access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway returns health response
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Expected response:

```json
{
  "service": "api-gateway",
  "status": "ok",
  "timestamp": "2026-06-25T00:00:00.000Z"
}
```

Expected response headers include:

```txt
x-request-id
x-response-time-ms
x-content-type-options
x-frame-options
referrer-policy
permissions-policy
content-security-policy
```

---

### 7.2 API Gateway Metrics Flow

```txt
Prometheus
  -> GET http://api-gateway:3000/metrics inside Docker network
    -> API Gateway returns Prometheus text format
    -> Prometheus stores scraped metrics
    -> Grafana reads metrics from Prometheus datasource
```

Public local endpoint:

```txt
GET http://localhost:3000/metrics
```

Expected metrics include:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

---

### 7.3 Product Service Health Check Flow

```txt
Client
  -> GET http://localhost:3001/health
    -> Product Service
      -> Response
```

Expected response:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "2026-06-25T00:00:00.000Z"
}
```

---

### 7.4 Protected Product API Flow

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
                    -> Return cached product response
                  -> If cache MISS:
                    -> API Gateway calls Product Service
                      -> GET http://product-service:3001/products in Docker
                      -> GET http://127.0.0.1:3001/products in local host mode
                    -> Product Service reads products from PostgreSQL using Prisma
                    -> Product Service returns database-backed product data
                    -> API Gateway stores response in Redis cache
                    -> API Gateway returns 200 with x-cache: MISS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Expected response:

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

---

## 8. Request ID Design

PulseGate uses request IDs from the beginning.

Purpose:

* Make debugging easier.
* Connect logs across services.
* Support structured access logs.
* Prepare for distributed tracing.
* Prepare for observability tools later.

Current request ID flow:

```txt
Client request
  -> API Gateway creates or reuses x-request-id
  -> API Gateway returns x-request-id in response header
  -> API Gateway forwards x-request-id to Product Service
  -> Product Service reuses the same request ID
```

Current request ID header:

```txt
x-request-id
```

---

## 9. Authentication Design

### 9.1 API Key Authentication

API key authentication is used for client or application-level authentication.

Protected route:

```txt
GET /api/products
```

Default header:

```txt
x-api-key
```

Default local API key:

```txt
dev-api-key
```

Behavior:

```txt
Missing API key
  -> 401 API_KEY_MISSING

Invalid API key
  -> 403 API_KEY_INVALID

Valid API key
  -> Continue to Redis-backed route-level rate limiting
```

---

### 9.2 JWT Authentication

JWT authentication is used for user or session-level authentication.

Protected route:

```txt
GET /api/products
```

Default header:

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

JWT validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

Behavior:

```txt
Missing Bearer token
  -> 401 JWT_TOKEN_MISSING

Invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

Valid Bearer token
  -> Continue to Redis response cache
```

Verified JWT payload is attached to:

```txt
request.jwtPayload
```

---

## 10. Traffic Protection Design

### 10.1 Redis-Backed Rate Limiting

PulseGate currently supports Redis-backed rate limiting for:

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

Current rate limit response headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
```

Expected response when exceeded:

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

Current Redis failure behavior:

```txt
Redis unavailable
  -> Redis command fails fast
  -> Product route returns generic 500 Internal Server Error
  -> Redis internal details are not exposed in the response body
```

Implementation notes:

* `InMemoryRateLimitStore` still exists for tests and flexible dependency injection.
* `RedisRateLimitStore` is used by the normal Docker/runtime flow.
* Rate limit middleware supports async stores.

---

### 10.2 Request Size Limit

PulseGate currently applies request size protection at the API Gateway level.

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

Expected response:

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

Implementation notes:

* Request size limit middleware checks `content-length`.
* Fastify `bodyLimit` is configured with `MAX_REQUEST_BODY_BYTES`.

---

### 10.3 Basic Security Headers

PulseGate currently adds baseline security headers to API Gateway responses.

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

---

## 11. Response Cache Design

PulseGate currently caches selected Gateway responses in Redis.

Current cached route:

```txt
GET /api/products
```

Current Redis response cache key:

```txt
response-cache:GET:/api/products
```

Current cache TTL:

```txt
30 seconds
```

Current response cache headers:

```txt
x-cache: MISS
x-cache: HIT
x-cache: BYPASS
```

Current behavior:

```txt
First valid request after cache clear
  -> Cache MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis
  -> Response header: x-cache: MISS

Second valid request within TTL
  -> Cache HIT
  -> API Gateway returns cached response from Redis
  -> Response header: x-cache: HIT
```

Cache resilience behavior:

```txt
Product Service down + cache HIT
  -> 200 from Redis cache

Product Service down + cache MISS
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE
```

Cache write failure behavior:

```txt
Product Service returns valid JSON
  -> API Gateway attempts to write response cache
  -> If cache write fails:
       -> API Gateway logs the cache error
       -> API Gateway still returns 200 response to client
```

---

## 12. Downstream Resilience Design

PulseGate normalizes downstream Product Service failures.

Current downstream failure behavior:

```txt
Product Service unavailable + cache MISS
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

Product Service unavailable + cache HIT
  -> 200 from Redis cache

Product Service timeout + cache MISS
  -> 504 DOWNSTREAM_TIMEOUT

Product Service returns error status + cache MISS
  -> 502 DOWNSTREAM_HTTP_ERROR

Product Service returns invalid JSON + cache MISS
  -> 502 DOWNSTREAM_INVALID_RESPONSE
```

Example unavailable response:

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

---

## 13. Observability Design

Sprint 4 added the first production-oriented observability foundation.

Current observability layers:

```txt
Request ID
Structured access logs
Response latency header
Prometheus metrics registry
/metrics endpoint
Prometheus scraping
Grafana datasource
Grafana dashboard
```

### 13.1 Structured Access Logs

API Gateway writes structured access logs after each request completes.

Current event name:

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

Sensitive values are intentionally not logged:

```txt
x-api-key
authorization
cookie
```

Conceptual log payload:

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

### 13.2 Response Time Header

API Gateway adds a response latency header:

```txt
x-response-time-ms
```

Example:

```txt
x-response-time-ms: 4.32
```

The value is measured in milliseconds and formatted with two decimal places.

### 13.3 Prometheus Metrics

API Gateway uses `prom-client` to maintain an in-memory Prometheus metrics registry.

Current metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Metric behavior:

```txt
http_requests_total
  -> Counts requests by method, route, and status_code

http_request_duration_seconds
  -> Records request latency in seconds by method, route, and status_code

http_response_cache_total
  -> Counts cache outcomes by route and cache_status
```

Supported cache statuses:

```txt
HIT
MISS
BYPASS
```

### 13.4 Metrics Endpoint

Current metrics endpoint:

```txt
GET /metrics
```

Current behavior:

```txt
GET /metrics
  -> Public in local development
  -> Returns Prometheus text format
  -> Scraped by Prometheus
```

### 13.5 Prometheus Scraping

Prometheus scrapes API Gateway through Docker internal DNS:

```txt
http://api-gateway:3000/metrics
```

Scrape interval:

```txt
5 seconds
```

Current Prometheus config file:

```txt
observability/prometheus/prometheus.yml
```

### 13.6 Grafana Dashboard

Grafana uses the provisioned Prometheus datasource:

```txt
http://prometheus:9090
```

Current Grafana datasource UID:

```txt
pulsegate-prometheus
```

Current dashboard:

```txt
PulseGate API Gateway Overview
```

Current dashboard UID:

```txt
pulsegate-api-gateway-overview
```

Current dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

---

## 14. Route Configuration Design

Current route config file:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current product route config includes:

```txt
serviceName
gatewayPath
downstreamUrl
method
timeoutMs
auth
rateLimit
```

Current product route auth config:

```txt
GET /api/products
  -> requireApiKey: true
  -> requireJwt: true
```

Current product route rate limit config:

```txt
GET /api/products
  -> limit: PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS
  -> windowMs: PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS
```

Purpose:

* Keep route behavior configuration close to route definitions.
* Avoid hard-coding all Gateway behavior directly in route handlers.
* Prepare for future route-level policies.
* Prepare for more downstream services later.
* Prepare for Sprint 5 advanced Gateway policy configuration.

---

## 15. Database Design

Product Service owns the current Product data.

Database:

```txt
PostgreSQL
```

ORM:

```txt
Prisma
```

Current Product model:

```txt
id        String
name      String
price     Int
createdAt DateTime
updatedAt DateTime
```

Current table:

```txt
products
```

Current seed script:

```txt
apps/product-service/prisma/seed.ts
```

Current seeded data:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Design notes:

* Product Service owns product data.
* API Gateway does not connect directly to PostgreSQL.
* API Gateway only communicates with Product Service through HTTP.
* Product Service reads from PostgreSQL through Prisma.
* The Product response shape remains compatible with the earlier mock response shape.

---

## 16. Current Tech Stack

Currently implemented:

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

Currently implemented Gateway capabilities:

* Request ID propagation.
* JSON logging.
* Structured access logging.
* Response time measurement.
* API key authentication.
* JWT authentication.
* Downstream route configuration.
* Downstream timeout handling.
* Normalized downstream error handling.
* Redis-backed rate limiting.
* Request size limit.
* Basic security headers.
* Redis response caching.
* Prometheus-compatible metrics endpoint.
* Unit tests.
* Integration tests.

Currently implemented Product Service capabilities:

* Health check.
* Database-backed products.
* Prisma Client.
* Product repository.
* PostgreSQL access.
* Request ID reuse.
* JSON logging.
* Basic error handling.

Currently implemented observability capabilities:

* Structured API Gateway access logs.
* `x-response-time-ms` header.
* Prometheus metrics registry.
* `/metrics` endpoint.
* Prometheus Docker service.
* Prometheus API Gateway scrape config.
* Grafana Docker service.
* Grafana Prometheus datasource provisioning.
* Grafana dashboard provisioning.
* API Gateway overview dashboard.

Not implemented yet:

* Kafka
* RabbitMQ
* Kubernetes
* OpenTelemetry
* Jaeger or Tempo
* Loki
* k6
* Admin Dashboard
* Developer Portal
* Production cloud deployment

---

## 17. Monorepo Structure

Current repository structure:

```txt
pulsegate/
  apps/
    api-gateway/
      Dockerfile
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
      package.json
      tsconfig.json
      vitest.config.ts

    product-service/
      Dockerfile
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
      AI_HANDOFF.md
      CURRENT_PROGRESS.md
      DECISION_LOG.md

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

## 18. Automated Test Architecture

PulseGate uses Vitest for API Gateway unit and integration tests.

Current test command:

```powershell
npm run test
```

Current test status:

```txt
17 test files passed
101 tests passed
```

Current unit test coverage:

```txt
request-id.middleware.test.ts
  -> Request ID generation and reuse

access-log.middleware.test.ts
  -> Duration calculation, safe access log payload, response time header behavior

api-key-auth.middleware.test.ts
  -> Missing, invalid, valid, and array header API key cases

jwt-auth.middleware.test.ts
  -> Bearer token extraction, JWT verification, missing token, invalid token, valid token

metrics.middleware.test.ts
  -> Route label extraction, cache header reading, request metrics, cache metrics

in-memory-rate-limit-store.test.ts
  -> In-memory rate limit store behavior, counters, window reset, cleanup, validation

redis-rate-limit-store.test.ts
  -> Redis rate limit store behavior and fail-fast timeout

rate-limit.middleware.test.ts
  -> Rate limit key generation, allowed requests, exceeded limit, reset behavior, missing identifier

redis-response-cache-store.test.ts
  -> Redis response cache store MISS/HIT, set with TTL, validation, and fail-fast timeout

request-size-limit.middleware.test.ts
  -> Content-Length parsing, allowed body size, exceeded body size, invalid config

security-headers.middleware.test.ts
  -> Basic security headers

downstream-service-error.test.ts
  -> DownstreamServiceError and type guard behavior

env.test.ts
  -> Number, CSV, and string env parsing

downstream-routes.test.ts
  -> Route-level rate limit config and auth requirements

observability/metrics.test.ts
  -> Metrics registry, request metrics, cache metrics, cache status normalization

metrics.route.test.ts
  -> /metrics endpoint and Prometheus text format
```

Current integration test coverage:

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
  -> includes rate limit headers

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

## 19. Current Design Principles

PulseGate follows these principles:

### 19.1 Local First

The project should run locally before adding cloud deployment.

### 19.2 Cost Safe

Early versions should not require paid cloud infrastructure.

### 19.3 Small Steps

New technologies should be added only after the previous layer is stable.

### 19.4 Clean Structure

Each service should separate:

* Config
* Routes
* Middlewares
* Errors
* Tests
* Server startup

API Gateway also separates:

* Redis client
* Rate limit stores
* Response cache stores
* Downstream route configuration
* Observability metrics registry
* Observability middlewares

Product Service also separates:

* Database helper
* Product repository
* Prisma schema and migrations

Infrastructure and observability config are separated under:

```txt
observability/
```

### 19.5 Observable by Design

Request ID, structured access logs, response time headers, metrics, Prometheus, and Grafana are part of the Gateway foundation.

### 19.6 Behavior First, Infrastructure Later

Gateway behavior is implemented and tested before adding more advanced distributed systems.

### 19.7 Test Before Scaling

Core Gateway behavior should be protected by automated tests before infrastructure and distributed systems are added.

### 19.8 Infrastructure After Stable Gateway Behavior

Docker, PostgreSQL, Redis, Prisma, Prometheus, and Grafana were added only after routing, auth, downstream resilience, and traffic protection were stable.

### 19.9 Provision Infrastructure Configuration

Prometheus and Grafana configuration should be file-based where possible so the local stack is reproducible.

---

## 20. Future Target Architecture

Long-term architecture:

```txt
Client / Frontend / External API Consumer
  -> PulseGate API Gateway
    -> Auth Service
    -> Product Service
    -> Order Service
    -> Payment Service
    -> Notification Service

Services
  -> PostgreSQL
  -> Redis
  -> Kafka
  -> RabbitMQ

Observability
  -> Structured Logs
  -> Prometheus
  -> Grafana
  -> OpenTelemetry
  -> Jaeger or Tempo
  -> Loki

Infrastructure
  -> Docker Compose for local development
  -> Kubernetes later
  -> CI/CD with GitHub Actions
```

---

## 21. Planned Evolution

### Sprint 0 - Core Setup & Basic Gateway Flow

Goal:

* Set up repository.
* Set up TypeScript.
* Run API Gateway.
* Run Product Service.
* Route request from Gateway to Product Service.
* Add basic request ID, logging, health check, and error handling.
* Add initial documentation.

Status:

```txt
Done
```

---

### Sprint 1 - API Gateway Core Features

Goal:

* Normalize downstream service errors.
* Add downstream request timeout.
* Add downstream route configuration foundation.
* Add API key authentication.
* Add JWT authentication.
* Add unit tests.
* Add integration tests.

Status:

```txt
Done
```

---

### Sprint 2 - Gateway Traffic Protection

Goal:

* Add in-memory rate limiting foundation.
* Add route-level rate limit configuration.
* Add rate limit response behavior.
* Add request size limit.
* Add basic security headers.
* Add route-level auth configuration refinement.
* Add traffic protection tests.

Status:

```txt
Done
```

---

### Sprint 3 - Data & Infrastructure Foundation

Goal:

* Add Docker Compose foundation.
* Add PostgreSQL service.
* Add Product Service database foundation.
* Add Prisma.
* Replace mock product data with database-backed product data.
* Add Redis service.
* Upgrade rate limiting from in-memory store to Redis-backed store.
* Add basic response caching.

Status:

```txt
Done
```

---

### Sprint 4 - Observability Foundation

Goal:

* Add structured access logs.
* Add request latency measurement.
* Add `x-response-time-ms` response header.
* Add basic HTTP metrics registry.
* Add metrics middleware.
* Add Prometheus-compatible `/metrics` endpoint.
* Add Prometheus service.
* Add Grafana service.
* Add Grafana datasource provisioning.
* Add dashboard foundation.
* Add gateway-level observability documentation.
* Keep advanced OpenTelemetry tracing for a later sprint unless explicitly needed.

Status:

```txt
Technical implementation complete
```

---

### Sprint 5 - Advanced Gateway Policies

Planned goal:

* Review current route configuration model.
* Add route policy type foundation.
* Add per-route timeout policy.
* Add per-route cache policy.
* Add per-route rate limit policy.
* Add request transformation foundation.
* Add response transformation foundation.
* Add upstream retry policy foundation.
* Add route config validation improvements.
* Add tests for each policy behavior.

Status:

```txt
Planned
```

---

### Later - Event-Driven Architecture

Planned goal:

* Add Kafka event streaming.
* Add RabbitMQ background jobs.
* Add Notification Service.
* Add async processing examples.

Status:

```txt
Planned
```

---

### Future

Planned features:

* Admin Dashboard.
* Developer Portal.
* k6 load testing.
* OpenTelemetry tracing.
* Jaeger or Tempo.
* Loki.
* GitHub Actions CI/CD.
* Kubernetes deployment.
* Cloud lightweight demo.

Status:

```txt
Future
```
