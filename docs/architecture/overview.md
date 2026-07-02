# PulseGate Architecture Overview

## 1. Project Overview

PulseGate is a High-Traffic API Gateway & Observability Platform.

The long-term goal is to build a mini API Gateway and API Management system inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

PulseGate is designed to help backend teams manage, protect, monitor, validate, and scale APIs in a microservice environment.

Current version:

```txt
v0.11.0
```

Current status:

```txt
Sprint 10 - Route Management Hardening Complete
```

Current automated test status:

```txt
27 test files passed
176 tests passed
```

Current CI/CD status:

```txt
GitHub Actions CI -> passing
README CI badge -> passing
```

Current architecture level:

```txt
Local-first API Gateway
Docker Compose infrastructure
PostgreSQL-backed Product Service
PostgreSQL-backed API Gateway route configuration
Internal/admin route management API foundation
Route management hardening with soft delete
Safe reload validation endpoint
Admin API key authentication for internal/admin APIs
Redis-backed traffic protection and response cache
Prometheus + Grafana observability
Route policy foundation
GitHub Actions CI/CD foundation
Database-backed dynamic Gateway route config
Soft-delete-aware active route loading
Safe static route config fallback
Validation-only route reload endpoint
Simple restart-based route config reload strategy
```

---

## 2. Target Users

PulseGate is designed for:

* Backend Developers
* DevOps Engineers
* SREs
* Tech Leads
* Companies with multiple internal or external APIs
* Teams that need a centralized API entry point
* Teams that want API Gateway, API Management, and Observability concepts in one platform

---

## 3. Problems PulseGate Solves

PulseGate aims to solve these problems:

* Provide a single entry point for multiple backend services.
* Route client requests to the correct downstream service.
* Support more than one Gateway route.
* Allow public routes and protected routes to behave differently.
* Centralize authentication and authorization.
* Protect APIs from spam, abuse, excessive traffic, and unsafe payloads.
* Reduce backend load with Redis response caching.
* Provide database-backed downstream service data.
* Store Gateway route configuration in PostgreSQL.
* Load Gateway route configuration dynamically at runtime startup.
* Keep the Gateway safe by falling back to static route config when DB route loading fails.
* Manage Gateway route configuration through internal/admin APIs.
* Read route configs through internal/admin APIs.
* Create route configs through internal/admin APIs.
* Update route configs through internal/admin APIs.
* Enable or disable route configs through internal/admin APIs.
* Soft delete route configs without physically removing DB records.
* Validate current active route configs through a reload validation endpoint.
* Track basic route management actor metadata through audit fields.
* Validate route configuration before persistence.
* Reject duplicate active route identities before persistence.
* Add request logging for debugging.
* Add latency visibility for local testing.
* Expose Prometheus-compatible HTTP metrics.
* Scrape and store time-series metrics through Prometheus.
* Visualize Gateway behavior through Grafana dashboards.
* Configure Gateway route behavior through route policies.
* Support per-route auth, timeout, cache, rate limit, transform, and retry rules.
* Validate repository health automatically with CI.
* Validate tests, typecheck, build, Prisma generation, and Docker image builds before treating the main branch as stable.
* Prepare for Admin Dashboard.
* Prepare for service registry and API management features.
* Prepare for distributed tracing.
* Support local infrastructure through Docker Compose.
* Support future event streaming and background jobs.
* Provide a foundation for future Admin Dashboard and Developer Portal.

---

## 4. Current Architecture

Current stable architecture after Sprint 10:

```txt
Client
  -> API Gateway :3000
    -> Runtime route config loader
      -> Try loading active route configs from PostgreSQL gateway.gateway_routes
      -> Map database records to DownstreamRouteConfig[]
      -> Validate mapped route configs
      -> If DB route configs are valid and not empty:
           -> Use database-backed route configs
           -> Log: Loaded downstream route configs from database { routeCount: 2 }
      -> If DB loading fails:
           -> Fall back to static downstreamRouteConfigs
           -> Log fallback warning
      -> If DB returns no enabled routes:
           -> Fall back to static downstreamRouteConfigs
           -> Log fallback warning
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> Resolved downstream route configuration
      -> GET /api/products
      -> GET /api/product-service/health
    -> Downstream route policy configuration
      -> Auth policy
      -> Timeout policy
      -> Cache policy
      -> Rate limit policy
      -> Request transform policy
      -> Response transform policy
      -> Retry policy foundation

    -> Protected Product route:
      -> GET /api/products
      -> API key authentication
      -> Redis-backed rate limiting by API key and route
      -> JWT authentication
      -> Redis response cache
        -> Cache HIT:
             -> Apply response transform foundation
             -> Return cached product response
             -> x-cache: HIT
        -> Cache MISS:
             -> Apply request transform foundation
             -> Downstream timeout policy helper
             -> Upstream retry policy foundation
             -> Normalized downstream error handling
             -> Product Service :3001 /products
               -> Prisma Client
               -> PostgreSQL public.products
               -> Database-backed product response
             -> Store response in Redis cache
             -> Apply response transform foundation
             -> x-cache: MISS

    -> Public Product Service health proxy route:
      -> GET /api/product-service/health
      -> No API key required
      -> No JWT required
      -> No Redis-backed rate limiting
      -> No Redis response cache
      -> Downstream timeout policy helper
      -> Product Service :3001 /health
      -> x-cache: BYPASS

    -> Internal/admin route management APIs:
      -> GET /internal/admin/routes
      -> GET /internal/admin/routes/:id
      -> POST /internal/admin/routes
      -> PATCH /internal/admin/routes/:id
      -> DELETE /internal/admin/routes/:id
      -> POST /internal/admin/routes/reload
      -> Admin API key authentication
      -> Route management repository
      -> Route management mapper
      -> PostgreSQL gateway.gateway_routes
      -> Route config validation before persistence
      -> Duplicate active method + gatewayPath conflict detection
      -> Enable/disable route config through PATCH
      -> Soft delete route config through DELETE
      -> Basic actor metadata through x-admin-actor
      -> Reload validation through POST /internal/admin/routes/reload
      -> Simple restart-based runtime reload strategy

    -> Add x-cache when applicable
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
    -> Return response to Client

PostgreSQL :5432
  -> public schema
       -> Product Service data
       -> public.products
       -> public._prisma_migrations
  -> gateway schema
       -> API Gateway route config
       -> gateway.gateway_routes
       -> gateway._prisma_migrations

Redis :6379
  -> API Gateway rate limit counters
  -> API Gateway response cache payloads

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
  -> Generates Product Service Prisma Client
  -> Generates API Gateway Prisma Client
  -> Runs tests, typecheck, and build
  -> Builds API Gateway and Product Service Docker images
  -> Reports pass/fail status to GitHub
```

Current architecture diagram:

```mermaid
flowchart LR
    Client[Client / API Consumer] --> Gateway[PulseGate API Gateway<br/>Port 3000]
    AdminClient[Admin Client / Future Admin Dashboard] --> AdminApis[Internal Admin Route Management APIs<br/>/internal/admin/routes]

    Gateway --> RuntimeConfig[Runtime Route Config Loader]
    RuntimeConfig --> GatewayPrisma[API Gateway Prisma Client]
    GatewayPrisma --> GatewaySchema[(PostgreSQL gateway schema<br/>gateway_routes)]
    RuntimeConfig -->|DB load success| DbRoutes[Database-backed Route Configs]
    RuntimeConfig -->|DB error or empty| StaticRoutes[Static Route Config Fallback]

    DbRoutes --> RouteConfig[Resolved Downstream Route Configs<br/>/api/products<br/>/api/product-service/health]
    StaticRoutes --> RouteConfig

    RouteConfig --> ReqId[Request ID Middleware]
    ReqId --> AccessLogStart[Access Log Timer]
    AccessLogStart --> MetricsStart[Metrics Timer]
    MetricsStart --> SecurityHeaders[Security Headers Middleware]
    SecurityHeaders --> SizeLimit[Request Size Limit]

    SizeLimit --> ProductRoute[Protected Product Route<br/>GET /api/products]
    SizeLimit --> ProductHealthRoute[Public Product Service Health Proxy<br/>GET /api/product-service/health]

    ProductRoute --> ProductPolicy[Route Policy Configuration<br/>Auth / Timeout / Cache / Rate Limit / Transform / Retry]
    ProductPolicy --> ApiKey[API Key Authentication]
    ApiKey --> RateLimit[Redis-Backed Rate Limiting]
    RateLimit --> Jwt[JWT Authentication]
    Jwt --> Cache{Redis Response Cache}

    Cache -->|HIT| ResponseTransformHit[Response Transform Foundation]
    ResponseTransformHit --> CachedResponse[Cached Product Response]
    CachedResponse --> ProductResponseHeaders[Response Headers<br/>x-cache: HIT<br/>x-response-time-ms]

    Cache -->|MISS| RequestTransform[Request Transform Foundation]
    RequestTransform --> RetryPolicy[Upstream Retry Policy Foundation]
    RetryPolicy --> TimeoutPolicy[Downstream Timeout Policy]
    TimeoutPolicy --> ProductProducts[Product Service<br/>GET /products<br/>Port 3001]
    ProductProducts --> ProductPrisma[Product Service Prisma Client]
    ProductPrisma --> PublicSchema[(PostgreSQL public schema<br/>products)]
    PublicSchema --> ProductPrisma
    ProductPrisma --> ProductProducts
    ProductProducts --> CacheStore[Store Response in Redis Cache]
    CacheStore --> ResponseTransformMiss[Response Transform Foundation]
    ResponseTransformMiss --> ProductResponseHeaders

    ProductHealthRoute --> HealthPolicy[Route Policy Configuration<br/>Public / No Cache / No Rate Limit]
    HealthPolicy --> HealthTimeout[Downstream Timeout Policy]
    HealthTimeout --> ProductHealth[Product Service<br/>GET /health<br/>Port 3001]
    ProductHealth --> HealthResponse[Health Response<br/>x-cache: BYPASS]

    AdminApis --> AdminKey[Admin API Key Authentication<br/>x-admin-api-key]
    AdminKey --> RouteManagement[Route Management Module]
    RouteManagement --> RouteRepo[Prisma Route Management Repository]
    RouteRepo --> GatewaySchema
    RouteManagement --> RouteValidation[validateDownstreamRoutes Before Persistence]
    RouteManagement --> AdminResponse[Route Management Response<br/>List / Detail / Create / Update / Delete / Reload Validate]

    RateLimit --> Redis[(Redis<br/>Port 6379)]
    Cache --> Redis
    CacheStore --> Redis

    ProductResponseHeaders --> MetricsRecord[Record HTTP Metrics]
    HealthResponse --> MetricsRecord
    AdminResponse --> MetricsRecord
    MetricsRecord --> AccessLogWrite[Write Structured Access Log]
    AccessLogWrite --> Client
    AccessLogWrite --> AdminClient

    Gateway --> MetricsEndpoint[/GET /metrics/]
    Prometheus[Prometheus<br/>Port 9090] -->|Scrapes| MetricsEndpoint
    Grafana[Grafana<br/>Port 3002] -->|Reads datasource| Prometheus

    Developer[Developer] --> GitHub[GitHub Repository]
    GitHub --> Actions[GitHub Actions CI]
    Actions --> NpmCi[npm ci]
    NpmCi --> ProductPrismaGenerate[Generate Product Service Prisma Client]
    ProductPrismaGenerate --> GatewayPrismaGenerate[Generate API Gateway Prisma Client]
    GatewayPrismaGenerate --> Test[Run Tests]
    Test --> Typecheck[Run Typecheck]
    Typecheck --> Build[Run Build]
    Build --> DockerBuild[Build API Gateway and Product Service Docker Images]
    DockerBuild --> Status[Report CI Pass / Fail]
    Status --> Badge[README CI Badge]
```

Current behavior:

1. Client sends a request to API Gateway.
2. API Gateway startup first resolves route configs.
3. API Gateway tries to load active route configs from `gateway.gateway_routes`.
4. Active runtime routes must have `enabled=true` and `deleted_at IS NULL`.
5. API Gateway maps DB records to `DownstreamRouteConfig[]`.
6. API Gateway validates mapped route configs.
7. If DB route configs are valid and not empty, API Gateway uses DB-backed route configs.
8. If DB route config loading fails, API Gateway falls back to static route configs.
9. If DB returns zero active routes, API Gateway falls back to static route configs.
10. API Gateway creates or reuses a request ID.
11. API Gateway starts structured access log timing.
12. API Gateway starts metrics timing.
13. API Gateway adds baseline security headers.
14. API Gateway checks request body size.
15. API Gateway matches a resolved downstream route configuration.
16. API Gateway loads the route-specific policy configuration.
17. API Gateway applies policy behavior depending on the matched route.
18. For `GET /api/products`, API Gateway checks API key.
19. For `GET /api/products`, API Gateway resolves route rate limit policy.
20. For `GET /api/products`, API Gateway applies Redis-backed rate limiting.
21. For `GET /api/products`, API Gateway checks JWT.
22. For `GET /api/products`, API Gateway resolves route cache policy.
23. For `GET /api/products`, API Gateway checks Redis response cache.
24. If cache HIT, API Gateway applies response transform foundation.
25. If cache HIT, API Gateway returns cached response with `x-cache: HIT`.
26. If cache MISS, API Gateway applies request transform foundation.
27. If cache MISS, API Gateway uses timeout and retry helpers for the downstream request.
28. API Gateway calls Product Service `GET /products`.
29. API Gateway forwards the same `x-request-id` header.
30. Product Service receives the request.
31. Product Service reuses the same request ID.
32. Product Service reads product data from PostgreSQL `public.products` using Prisma.
33. Product Service returns database-backed product data.
34. API Gateway stores the response in Redis cache.
35. API Gateway applies response transform foundation.
36. API Gateway returns the response with `x-cache: MISS`.
37. For `GET /api/product-service/health`, API Gateway does not require API key.
38. For `GET /api/product-service/health`, API Gateway does not require JWT.
39. For `GET /api/product-service/health`, API Gateway does not apply Redis-backed rate limiting.
40. For `GET /api/product-service/health`, API Gateway does not use Redis response cache.
41. API Gateway calls Product Service `GET /health`.
42. API Gateway returns Product Service health response with `x-cache: BYPASS`.
43. For internal/admin route management APIs, API Gateway checks `x-admin-api-key`.
44. If admin API key is missing, API Gateway returns `401 ADMIN_API_KEY_MISSING`.
45. If admin API key is invalid, API Gateway returns `403 ADMIN_API_KEY_INVALID`.
46. If admin API key is valid, API Gateway executes route management behavior.
47. `GET /internal/admin/routes` returns active route configs, including disabled but non-deleted routes.
48. `GET /internal/admin/routes/:id` returns one active route config or `404 ROUTE_CONFIG_NOT_FOUND`.
49. `POST /internal/admin/routes` validates and creates a route config.
50. `PATCH /internal/admin/routes/:id` merges, validates, and updates a route config.
51. `DELETE /internal/admin/routes/:id` soft deletes a route config by setting `enabled=false`, `deleted_at`, `deleted_by`, and `updated_by`.
52. `POST /internal/admin/routes/reload` validates active DB route configs without applying runtime changes.
53. Disabled route configs remain stored in DB and visible to admins while they are not soft deleted.
54. Soft-deleted route configs remain stored in DB but are hidden from admin list/detail APIs and ignored by the runtime loader.
55. Disabled or soft-deleted route configs are not loaded as active runtime routes after API Gateway restart.
56. API Gateway adds `x-response-time-ms`.
57. API Gateway records Prometheus metrics.
58. API Gateway writes a structured access log.
59. API Gateway normalizes downstream errors when needed.
60. Prometheus scrapes API Gateway `/metrics`.
61. Grafana reads metrics from Prometheus and displays the API Gateway overview dashboard.
62. GitHub Actions validates every push to `main`.
63. GitHub Actions validates every pull request targeting `main`.
64. GitHub Actions runs `npm ci`, Prisma generate, tests, typecheck, build, and Docker image build validation.
65. GitHub reports CI pass/fail status.
66. README badge reflects the current CI workflow status.

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
* Starts API Gateway after PostgreSQL, Redis, and Product Service are healthy.
* Provides API Gateway `DATABASE_URL` for the PostgreSQL `gateway` schema.
* Provides Product Service `DATABASE_URL` for the PostgreSQL `public` schema.
* Provides API Gateway admin API key environment values.
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
docker compose up -d --build
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

Expected API Gateway startup log after Sprint 10 with clean active seeded DB:

```txt
Loaded downstream route configs from database { routeCount: 2 }
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
GET /api/product-service/health
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Route protection:

```txt
GET /health
  -> Public

GET /metrics
  -> Public for local Docker observability

GET /api/products
  -> Protected
  -> Requires API key
  -> Redis-backed rate limited by API key and route
  -> Requires JWT Bearer token
  -> Uses Redis response cache
  -> Uses route policy configuration loaded from resolved route config
  -> Proxies to Product Service GET /products on cache MISS

GET /api/product-service/health
  -> Public
  -> Does not require API key
  -> Does not require JWT
  -> Does not use Redis-backed rate limiting
  -> Does not use Redis response cache
  -> Uses route policy configuration loaded from resolved route config
  -> Uses downstream timeout policy
  -> Proxies to Product Service GET /health

GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
  -> Internal/admin APIs
  -> Require x-admin-api-key
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
  -> Do not use Product response cache
```

Responsibilities:

* Acts as the single entry point for clients.
* Receives client requests.
* Loads Gateway route configuration from PostgreSQL `gateway.gateway_routes`.
* Falls back to static route config if DB route config loading fails or returns no routes.
* Maps database route records into `DownstreamRouteConfig[]`.
* Validates mapped route configs before registering routes.
* Generates or reuses request ID.
* Adds `x-request-id` response header.
* Adds `x-response-time-ms` response header.
* Adds basic security headers.
* Applies request size limit.
* Registers multiple downstream routes through the generic downstream proxy route.
* Routes `/api/products` to Product Service `GET /products` on cache MISS.
* Routes `/api/product-service/health` to Product Service `GET /health`.
* Returns cached product response on cache HIT.
* Forwards `x-request-id` to downstream service.
* Applies API key authentication when route policy requires it.
* Applies Redis-backed rate limiting when route policy requires it.
* Applies JWT authentication when route policy requires it.
* Attaches verified JWT payload to `request.jwtPayload`.
* Uses route policy configuration.
* Uses route-level auth policy.
* Uses route-level timeout policy.
* Uses route-level cache policy.
* Uses route-level rate limit policy.
* Uses request transform policy foundation.
* Uses response transform policy foundation.
* Uses upstream retry policy foundation.
* Applies downstream request timeout.
* Normalizes downstream service errors.
* Handles basic 404 errors.
* Handles basic 500 errors.
* Logs requests in JSON format.
* Writes structured access logs after request completion.
* Records HTTP metrics after request completion.
* Exposes Prometheus-compatible metrics at `/metrics`.
* Protects internal/admin route management APIs with admin API key.
* Lists active route configs through internal/admin API.
* Reads active route config detail through internal/admin API.
* Creates route configs through internal/admin API.
* Updates route configs through internal/admin API.
* Enables or disables route configs through PATCH.
* Soft deletes route configs through DELETE without hard deleting DB records.
* Tracks basic route management actor metadata through `x-admin-actor`.
* Validates route configs before persistence.
* Rejects duplicate active `method + gatewayPath` conflicts before persistence.
* Validates active route configs through `POST /internal/admin/routes/reload`.
* Supports simple restart-based runtime route reload strategy.
* Supports automated integration tests using Fastify `app.inject()`.
* Generates Prisma Client in GitHub Actions CI.
* Generates Prisma Client inside the Docker image to avoid host/runtime mismatch.
* Has Docker image build validation in GitHub Actions CI.

Current structure:

```txt
apps/api-gateway/
  Dockerfile
  prisma/
    migrations/
      20260701063629_add_gateway_routes/
        migration.sql
      migration_lock.toml
    schema.prisma
    seed.ts
  src/
    app.ts
    app.test.ts
    cache/
      redis-response-cache-store.ts
      redis-response-cache-store.test.ts
    config/
      database-route-config.mapper.ts
      database-route-config.mapper.test.ts
      database-route-config.repository.ts
      downstream-routes.ts
      downstream-routes.test.ts
      env.ts
      env.test.ts
      runtime-downstream-routes.ts
      runtime-downstream-routes.test.ts
      validate-downstream-routes.ts
      validate-downstream-routes.test.ts
    database/
      gateway-prisma.ts
    errors/
      downstream-service-error.ts
      downstream-service-error.test.ts
    middlewares/
      access-log.middleware.ts
      access-log.middleware.test.ts
      admin-api-key-auth.middleware.ts
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
    route-management/
      route-management.mapper.ts
      route-management.repository.ts
      route-management.types.ts
    routes/
      admin-route-config.route.ts
      admin-route-config.route.test.ts
      health.route.ts
      metrics.route.ts
      metrics.route.test.ts
      product-proxy.route.ts
    server.ts
```

Important naming note:

```txt
The file name is still product-proxy.route.ts.

Sprint 7 refactored the internals so this file now contains the reusable generic downstreamProxyRoute().

productProxyRoute() remains as a compatibility wrapper to preserve old behavior and avoid breaking existing tests or app options too aggressively.

A future cleanup sprint may rename product-proxy.route.ts to downstream-proxy.route.ts if desired.
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
* Provides service health response.
* Returns database-backed product data.
* Reads product data from PostgreSQL `public.products` using Prisma Client.
* Generates or reuses request ID.
* Reuses request ID from API Gateway.
* Handles basic 404 errors.
* Handles basic 500 errors.
* Logs requests in JSON format.
* Disconnects Prisma Client on server close.
* Supports Prisma schema, migration, and seed script.
* Generates Prisma Client in GitHub Actions CI.
* Has Docker image build validation in GitHub Actions CI.

Current structure:

```txt
apps/product-service/
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
```

---

### 6.3 PostgreSQL

PostgreSQL is used by Product Service and API Gateway.

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

Current local Product Service database URL:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current Docker internal Product Service database URL:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Current local API Gateway database URL:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway
```

Current Docker internal API Gateway database URL:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
```

Current PostgreSQL schemas:

```txt
public
gateway
```

Current Product Service tables:

```txt
public._prisma_migrations
public.products
```

Current API Gateway tables:

```txt
gateway._prisma_migrations
gateway.gateway_routes
```

Current Product model fields:

```txt
id
name
price
createdAt
updatedAt
```

Current Gateway route config fields:

```txt
id
service_name
gateway_path
downstream_url
method
enabled
priority
require_api_key
require_jwt
timeout_enabled
timeout_ms
cache_enabled
cache_ttl_seconds
rate_limit_enabled
rate_limit_limit
rate_limit_window_ms
request_transform_enabled
request_add_headers
request_remove_headers
response_transform_enabled
response_add_headers
response_remove_headers
retry_enabled
retry_attempts
retry_on_statuses
created_at
updated_at
created_by
updated_by
deleted_at
deleted_by
```

Current seed products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Current seeded Gateway route configs:

```txt
GET /api/products
  -> downstreamUrl: http://product-service:3001/products
  -> requireApiKey: true
  -> requireJwt: true
  -> timeoutEnabled: true
  -> cacheEnabled: true
  -> rateLimitEnabled: true
  -> retryEnabled: false

GET /api/product-service/health
  -> downstreamUrl: http://product-service:3001/health
  -> requireApiKey: false
  -> requireJwt: false
  -> timeoutEnabled: true
  -> cacheEnabled: false
  -> rateLimitEnabled: false
  -> retryEnabled: false
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

### 6.7 GitHub Actions CI

GitHub Actions is used to validate repository health automatically.

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

Current triggers:

```txt
push to main
pull_request to main
```

Current CI steps:

```txt
Checkout repository
Setup Node.js 20
npm ci
Generate Product Service Prisma Client
Generate API Gateway Prisma Client
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Current CI responsibilities:

* Validate clean dependency installation.
* Validate Product Service Prisma Client generation in a clean runner.
* Validate API Gateway Prisma Client generation in a clean runner.
* Validate automated tests.
* Validate TypeScript typecheck.
* Validate production build.
* Validate API Gateway Docker image build.
* Validate Product Service Docker image build.
* Report pass/fail status to GitHub.
* Feed README CI badge status.

Current scope:

* CI validates the repository.
* CI does not push Docker images to a registry yet.
* CI does not deploy automatically yet.
* CI does not run the full Docker Compose runtime stack yet.
* CI does not manage production secrets yet.

---

## 7. Current Request Flow

### 7.1 API Gateway Startup Route Config Flow

```txt
API Gateway process starts
  -> loadRuntimeDownstreamRouteConfigs()
    -> loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
      -> Prisma Client connects to PostgreSQL schema gateway
      -> Query enabled, non-deleted records from gateway.gateway_routes
      -> Order records by priority asc and gatewayPath asc
      -> Map DB records into DownstreamRouteConfig[]
      -> Validate mapped route configs
    -> If DB route configs are valid and not empty:
         -> Use database-backed route configs
         -> Log: Loaded downstream route configs from database { routeCount: 2 }
    -> If DB loading fails:
         -> Use static downstreamRouteConfigs fallback
         -> Log fallback warning
    -> If DB returns no enabled routes:
         -> Use static downstreamRouteConfigs fallback
         -> Log fallback warning
  -> buildApiGatewayApp({ routeConfigs })
  -> Register health route
  -> Register metrics route
  -> Register internal/admin route management route
  -> Register downstreamProxyRoute() with resolved route configs
  -> Connect Redis
  -> Listen on configured host and port
```

Why this matters:

* The Gateway can now be controlled by persisted route configuration.
* Runtime startup does not depend only on code-defined route configs.
* Existing static config still protects the app from DB startup/config mistakes.
* Internal/admin route management APIs can manage persisted route configs.
* This is the foundation for future Admin Dashboard route management.

---

### 7.2 API Gateway Health Check Flow

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
  "timestamp": "2026-07-01T00:00:00.000Z"
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

### 7.3 API Gateway Metrics Flow

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

### 7.4 Product Service Health Check Flow

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
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

---

### 7.5 Protected Product API Flow

```txt
Client
  -> GET http://localhost:3000/api/products
    -> API Gateway route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts structured access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
      -> If request body is too large:
        -> 413 REQUEST_BODY_TOO_LARGE
    -> API Gateway matches route config: GET /api/products
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
                    -> Return cached product response
                  -> If cache MISS:
                    -> Apply request transform foundation
                    -> API Gateway calls Product Service through timeout and retry helpers
                      -> GET http://product-service:3001/products in Docker
                      -> GET http://127.0.0.1:3001/products in local host mode when route config points to local URL
                    -> Product Service reads products from PostgreSQL public.products using Prisma
                    -> Product Service returns database-backed product data
                    -> API Gateway stores response in Redis cache
                    -> Apply response transform foundation
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

### 7.6 Public Product Service Health Proxy Flow

```txt
Client
  -> GET http://localhost:3000/api/product-service/health
    -> API Gateway route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts structured access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway matches route config: GET /api/product-service/health
    -> API Gateway loads route policy configuration
    -> API Gateway does not require API key
    -> API Gateway does not apply Redis-backed rate limiting
    -> API Gateway does not require JWT
    -> API Gateway does not use Redis response cache
    -> API Gateway applies request transform foundation
    -> API Gateway calls Product Service through timeout helper
      -> GET http://product-service:3001/health in Docker
      -> GET http://127.0.0.1:3001/health in local host mode when route config points to local URL
    -> Product Service returns health response
    -> API Gateway returns Product Service health response
    -> API Gateway returns x-cache: BYPASS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Expected response:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Expected response headers include:

```txt
x-cache: BYPASS
x-request-id
x-response-time-ms
```

This route should not return rate limit headers.

---

### 7.7 Internal Admin Route Management Flow

```txt
Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads active route configs from gateway.gateway_routes
    -> API Gateway excludes soft-deleted route configs
    -> API Gateway returns enabled and disabled route configs where deleted_at IS NULL

Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads one active route config by id
    -> If route does not exist or is soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> 200 with route config response

Admin Client / Future Admin Dashboard
  -> POST http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> API Gateway resolves actor from x-admin-actor or defaults to admin-api-key
    -> API Gateway validates request body
    -> API Gateway maps request body to DownstreamRouteConfig
    -> API Gateway reuses validateDownstreamRoutes()
    -> API Gateway checks duplicate active method + gatewayPath
    -> If duplicate active route exists:
         -> 409 ROUTE_CONFIG_ALREADY_EXISTS
    -> If valid and not duplicate:
         -> API Gateway creates route config in gateway.gateway_routes
         -> API Gateway sets created_by and updated_by
         -> API Gateway returns 201 Created

Admin Client / Future Admin Dashboard
  -> PATCH http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway resolves actor from x-admin-actor or defaults to admin-api-key
    -> API Gateway reads existing active route by id
    -> If route does not exist or is soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> API Gateway merges existing route with patch body
         -> API Gateway maps merged body to DownstreamRouteConfig
         -> API Gateway reuses validateDownstreamRoutes()
         -> API Gateway checks conflict with another active method + gatewayPath
         -> API Gateway updates route config in gateway.gateway_routes
         -> API Gateway sets updated_by
         -> API Gateway returns 200 OK

Admin Client / Future Admin Dashboard
  -> DELETE http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway resolves actor from x-admin-actor or defaults to admin-api-key
    -> API Gateway reads existing active route by id
    -> If route does not exist or is already soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> API Gateway performs soft delete
         -> API Gateway sets enabled=false, deleted_at, deleted_by, and updated_by
         -> API Gateway returns 200 OK with deleted route response

Admin Client / Future Admin Dashboard
  -> POST http://localhost:3000/internal/admin/routes/reload
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads active route configs
    -> API Gateway validates mapped DownstreamRouteConfig[]
    -> API Gateway does not apply runtime changes
    -> API Gateway returns validation summary:
         -> mode: validation-only
         -> runtimeApplied: false
         -> requiresRestart: true
         -> routeCount
```

Current admin API key header:

```txt
x-admin-api-key
```

Current default local admin API key:

```txt
local-admin-key
```

Current runtime reload behavior:

```txt
Route config create/update/delete changes are persisted immediately.
POST /internal/admin/routes/reload validates active DB route configs only.
runtimeApplied is false.
requiresRestart is true.
Runtime proxy route changes still take effect after API Gateway restart.
True hot reload is intentionally deferred to a later sprint.
```

---

### 7.8 CI Validation Flow

```txt
Developer
  -> Pushes code to main or opens pull request into main
    -> GitHub Actions starts CI workflow
    -> GitHub Actions checks out repository
    -> GitHub Actions sets up Node.js 20
    -> GitHub Actions installs dependencies with npm ci
    -> GitHub Actions generates Product Service Prisma Client
    -> GitHub Actions generates API Gateway Prisma Client
    -> GitHub Actions runs automated tests
    -> GitHub Actions runs TypeScript typecheck
    -> GitHub Actions runs production build
    -> GitHub Actions builds API Gateway Docker image
    -> GitHub Actions builds Product Service Docker image
    -> GitHub Actions reports pass/fail status to GitHub
    -> README CI badge reflects workflow status
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

Current routes using request ID behavior:

```txt
GET /health
GET /metrics
GET /api/products
GET /api/product-service/health
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

---

## 9. Authentication Design

### 9.1 API Key Authentication

API key authentication is used for client or application-level authentication.

Protected route:

```txt
GET /api/products
```

Public routes without API key requirement:

```txt
GET /health
GET /metrics
GET /api/product-service/health
```

Internal/admin routes do not use consumer API key authentication:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Default consumer API key header:

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

Protected route policy:

```txt
auth:
  requireApiKey: true
```

Public Product Service health proxy route policy:

```txt
auth:
  requireApiKey: false
```

---

### 9.2 Admin API Key Authentication

Admin API key authentication is used for internal/admin route management APIs.

Protected internal/admin routes:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Default admin API key header:

```txt
x-admin-api-key
```

Default local admin API key:

```txt
local-admin-key
```

Behavior:

```txt
Missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Valid admin API key
  -> Continue to route management behavior
```

Reason:

* Consumer API keys and admin API keys have different purposes.
* Consumer API keys protect API consumption.
* Admin API keys protect route management operations.
* Route management APIs can change Gateway behavior and must not be exposed to normal API consumers.

---

### 9.3 JWT Authentication

JWT authentication is used for user or session-level authentication.

Protected route:

```txt
GET /api/products
```

Public routes without JWT requirement:

```txt
GET /health
GET /metrics
GET /api/product-service/health
```

Internal/admin routes do not require consumer JWT in Sprint 10:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
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

Protected route policy:

```txt
auth:
  requireJwt: true
```

Public Product Service health proxy route policy:

```txt
auth:
  requireJwt: false
```

---

## 10. Traffic Protection Design

### 10.1 Redis-Backed Rate Limiting

PulseGate currently supports Redis-backed rate limiting for:

```txt
GET /api/products
```

Rate limiting is intentionally disabled for:

```txt
GET /api/product-service/health
```

Consumer rate limiting is not currently applied to:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current protected route behavior:

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

Product route policy:

```txt
rateLimit:
  enabled: true
  limit: 5
  windowMs: 60000
```

Product Service health proxy route policy:

```txt
rateLimit:
  enabled: false
  limit: 0
  windowMs: 0
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
* Rate limit runtime values are resolved through the rate limit policy helper.
* Public routes can disable rate limiting through route policy.

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
* The request size limit applies globally to current Gateway routes.

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

Current route with cache disabled:

```txt
GET /api/product-service/health
```

Current internal/admin routes do not use Product response cache:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current Redis response cache key:

```txt
response-cache:GET:/api/products
```

Current cache TTL:

```txt
30 seconds
```

Product route policy:

```txt
cache:
  enabled: true
  ttlSeconds: 30
```

Product Service health proxy route policy:

```txt
cache:
  enabled: false
  ttlSeconds: 0
```

Current response cache headers:

```txt
x-cache: MISS
x-cache: HIT
x-cache: BYPASS
```

Current behavior:

```txt
GET /api/products first valid request after cache clear
  -> Cache MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis
  -> Response header: x-cache: MISS

GET /api/products second valid request within TTL
  -> Cache HIT
  -> API Gateway returns cached response from Redis
  -> Response header: x-cache: HIT

GET /api/product-service/health
  -> Cache disabled by route policy
  -> API Gateway calls Product Service /health
  -> Response header: x-cache: BYPASS
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

Implementation notes:

* Cache key generation is handled by the cache policy helper.
* Cache enabled state is resolved from route policy and runtime cache store availability.
* Cache TTL can be overridden in tests.
* Public routes can disable cache through route policy.

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

Product route timeout policy:

```txt
timeout:
  enabled: true
  timeoutMs: 3000
```

Product Service health proxy timeout policy:

```txt
timeout:
  enabled: true
  timeoutMs: 3000
```

Current retry policy for both current downstream routes:

```txt
retry:
  enabled: false
  attempts: 0
  retryOnStatuses: [502, 503, 504]
```

Retry design notes:

* Retry foundation exists.
* Retry is wired into the downstream call flow.
* Retry is allowed only for safe `GET` requests.
* Retry is disabled by default for current routes to avoid hidden behavior changes.
* Retry can be enabled later for carefully selected read-only routes.

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
x-admin-api-key
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

Current route labels include:

```txt
/health
/metrics
/api/products
/api/product-service/health
/internal/admin/routes
/internal/admin/routes/:id
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

## 14. Route Policy Design

Sprint 5 introduced a route policy foundation.

Sprint 7 expanded the Gateway so more than one downstream route can be registered.

Sprint 8 moved the primary runtime route config source from static TypeScript config to PostgreSQL-backed database config while keeping static fallback.

Sprint 9 added route management APIs that reuse existing route validation before persisting route configs.

Sprint 10 hardened route management with soft delete, audit metadata fields, active-route duplicate checks, and reload validation.

Static route config file:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Runtime route config loader file:

```txt
apps/api-gateway/src/config/runtime-downstream-routes.ts
```

Database route config repository file:

```txt
apps/api-gateway/src/config/database-route-config.repository.ts
```

Database route config mapper file:

```txt
apps/api-gateway/src/config/database-route-config.mapper.ts
```

Route management mapper file:

```txt
apps/api-gateway/src/route-management/route-management.mapper.ts
```

Route policy type file:

```txt
apps/api-gateway/src/policies/route-policy.types.ts
```

Route validation file:

```txt
apps/api-gateway/src/config/validate-downstream-routes.ts
```

Generic downstream proxy file:

```txt
apps/api-gateway/src/routes/product-proxy.route.ts
```

Route config includes:

```txt
serviceName
gatewayPath
downstreamUrl
method
policies
```

Route policy model:

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

Current configured downstream routes:

```txt
GET /api/products
  -> Gateway route
  -> Downstream: Product Service GET /products

GET /api/product-service/health
  -> Gateway route
  -> Downstream: Product Service GET /health
```

Current product route policy:

```txt
GET /api/products
  -> auth:
       requireApiKey: true
       requireJwt: true

  -> timeout:
       enabled: true
       timeoutMs: 3000

  -> cache:
       enabled: true
       ttlSeconds: 30

  -> rateLimit:
       enabled: true
       limit: 5
       windowMs: 60000

  -> requestTransform:
       enabled: false

  -> responseTransform:
       enabled: false

  -> retry:
       enabled: false
       attempts: 0
       retryOnStatuses: [502, 503, 504]
```

Current Product Service health proxy route policy:

```txt
GET /api/product-service/health
  -> auth:
       requireApiKey: false
       requireJwt: false

  -> timeout:
       enabled: true
       timeoutMs: 3000

  -> cache:
       enabled: false
       ttlSeconds: 0

  -> rateLimit:
       enabled: false
       limit: 0
       windowMs: 0

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

Purpose:

* Keep route behavior configuration close to route definitions.
* Avoid hard-coding all Gateway behavior directly in route handlers.
* Allow public and protected routes to use different policies.
* Prepare for more downstream services later.
* Use PostgreSQL as the primary route config persistence foundation.
* Allow internal/admin APIs to manage route config records.
* Prepare for future Admin Dashboard or config-driven route management.
* Make the Gateway closer to production API Gateway products.
* Keep route behavior testable through unit and integration tests.

---

## 15. Multi-Route Gateway Design

Sprint 7 introduced multi-route Gateway routing.

Before Sprint 7, the Gateway effectively proxied one downstream route:

```txt
GET /api/products
  -> Product Service GET /products
```

After Sprint 7, the Gateway can register multiple downstream routes:

```txt
GET /api/products
  -> Product Service GET /products

GET /api/product-service/health
  -> Product Service GET /health
```

Sprint 8 changed the primary runtime source of these routes:

```txt
Before Sprint 8:
  -> static downstreamRouteConfigs from TypeScript

After Sprint 8:
  -> PostgreSQL gateway.gateway_routes first
  -> static downstreamRouteConfigs fallback if DB loading fails or returns no routes
```

Sprint 9 added APIs to manage the database route config records:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current route registration flow:

```txt
loadRuntimeDownstreamRouteConfigs()
  -> try loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
    -> gateway.gateway_routes
    -> mapGatewayRouteRecordsToDownstreamRouteConfigs()
    -> validateDownstreamRoutes()
  -> if DB success and routes exist:
       -> return DB route configs
  -> if DB error or empty:
       -> return static downstreamRouteConfigs
  -> app.ts
  -> downstreamProxyRoute()
  -> Fastify route registration
```

Current public/protected route split:

```txt
GET /api/products
  -> Protected
  -> API key required
  -> JWT required
  -> Redis rate limit enabled
  -> Redis cache enabled

GET /api/product-service/health
  -> Public
  -> API key not required
  -> JWT not required
  -> Redis rate limit disabled
  -> Redis cache disabled
```

Why this matters:

* The Gateway is no longer limited to one route.
* Route behavior has moved from code-only config to database-backed config.
* The Gateway can support multiple route policies.
* Existing route behavior remains safe due to static fallback.
* Admin APIs can now manage route configuration records.
* Future Admin Dashboard can build on existing backend route management behavior.

Current limitation:

```txt
Routes are loaded from database at startup.
Soft delete exists, but true runtime hot reload does not exist yet.
Reload validation exists, but runtimeApplied=false and requiresRestart=true.
There is no Admin Dashboard yet.
```

---

## 16. Dynamic Route Config Design

Sprint 8 introduced database-backed dynamic route configuration.

Sprint 9 added internal/admin APIs to manage route config records.

Sprint 10 added soft-delete-aware route management and reload validation.

### 16.1 Database Model

Gateway route config is stored in:

```txt
PostgreSQL schema: gateway
Table: gateway.gateway_routes
```

Prisma schema location:

```txt
apps/api-gateway/prisma/schema.prisma
```

Migration locations:

```txt
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
```

Seed script location:

```txt
apps/api-gateway/prisma/seed.ts
```

Current active route identity:

```txt
method + gateway_path where deleted_at IS NULL
```

Current unique strategy:

```txt
Partial unique index on method + gateway_path for active routes only.
Soft-deleted routes no longer block recreating the same method + gatewayPath.
```

Current model responsibilities:

* Store Gateway route path.
* Store downstream service URL.
* Store HTTP method.
* Store route enabled flag.
* Store priority for deterministic ordering.
* Store auth policy flags.
* Store timeout policy values.
* Store cache policy values.
* Store rate limit policy values.
* Store request transform JSON fields.
* Store response transform JSON fields.
* Store retry policy values.
* Store created and updated timestamps.
* Store created, updated, and deleted actor metadata.
* Store soft delete timestamp and actor.

---

### 16.2 Runtime Loading

Runtime loader file:

```txt
apps/api-gateway/src/config/runtime-downstream-routes.ts
```

Repository file:

```txt
apps/api-gateway/src/config/database-route-config.repository.ts
```

Mapper file:

```txt
apps/api-gateway/src/config/database-route-config.mapper.ts
```

Prisma client wrapper:

```txt
apps/api-gateway/src/database/gateway-prisma.ts
```

Runtime loading behavior:

```txt
loadRuntimeDownstreamRouteConfigs()
  -> calls loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
  -> if success and active route count > 0:
       -> returns active DB route configs
  -> if DB returns empty:
       -> returns static fallback route configs
  -> if DB throws:
       -> returns static fallback route configs
```

The loader logs the selected behavior:

```txt
Loaded downstream route configs from database
No database downstream route configs found; falling back to static downstream route configs
Failed to load database downstream route configs; falling back to static downstream route configs
```

---

### 16.3 Mapping Rules

Database route records are mapped into:

```txt
DownstreamRouteConfig[]
```

Runtime route type:

```txt
serviceName
gatewayPath
downstreamUrl
method
policies
```

Policy mapping:

```txt
require_api_key             -> policies.auth.requireApiKey
require_jwt                 -> policies.auth.requireJwt
timeout_enabled             -> policies.timeout.enabled
timeout_ms                  -> policies.timeout.timeoutMs
cache_enabled               -> policies.cache.enabled
cache_ttl_seconds           -> policies.cache.ttlSeconds
rate_limit_enabled          -> policies.rateLimit.enabled
rate_limit_limit            -> policies.rateLimit.limit
rate_limit_window_ms        -> policies.rateLimit.windowMs
request_transform_enabled   -> policies.requestTransform.enabled
request_add_headers         -> policies.requestTransform.addHeaders
request_remove_headers      -> policies.requestTransform.removeHeaders
response_transform_enabled  -> policies.responseTransform.enabled
response_add_headers        -> policies.responseTransform.addHeaders
response_remove_headers     -> policies.responseTransform.removeHeaders
retry_enabled               -> policies.retry.enabled
retry_attempts              -> policies.retry.attempts
retry_on_statuses           -> policies.retry.retryOnStatuses
```

Disabled policies are normalized safely:

```txt
cache disabled
  -> ttlSeconds becomes 0

rate limit disabled
  -> limit becomes 0
  -> windowMs becomes 0
```

JSON field validation:

```txt
request_add_headers must be an object with string values
response_add_headers must be an object with string values
request_remove_headers must be an array of strings
response_remove_headers must be an array of strings
retry_on_statuses must be an array of integers
```

---

### 16.4 Safe Static Fallback

Fallback exists because route config is critical to Gateway startup.

Active route filter:

```txt
enabled = true
deleted_at IS NULL
```

Fallback scenarios:

```txt
DATABASE_URL missing
PostgreSQL unavailable
Prisma Client initialization error
gateway.gateway_routes unavailable
DB query error
DB records fail mapping
DB records fail validation
DB returns zero enabled routes
```

Fallback result:

```txt
API Gateway uses static downstreamRouteConfigs
```

Why this matters:

* The Gateway can still start when route config DB is unavailable.
* Existing protected product route behavior remains stable.
* Existing public product health proxy route behavior remains stable.
* Database-backed route config can roll out safely.
* Route management APIs can be introduced without removing safe runtime fallback.

---

## 17. Route Management API Design

Sprint 9 introduced the internal/admin Route Management API foundation.

Sprint 10 hardened route management with soft delete, basic audit metadata, active-route duplicate checks, and reload validation.

Current route management endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current admin authentication:

```txt
Header: x-admin-api-key
Default local value: local-admin-key
```

Current optional admin actor header:

```txt
Header: x-admin-actor
Fallback actor: admin-api-key
```

Current admin env variables:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
```

Route management module files:

```txt
apps/api-gateway/src/middlewares/admin-api-key-auth.middleware.ts
apps/api-gateway/src/routes/admin-route-config.route.ts
apps/api-gateway/src/routes/admin-route-config.route.test.ts
apps/api-gateway/src/route-management/route-management.types.ts
apps/api-gateway/src/route-management/route-management.mapper.ts
apps/api-gateway/src/route-management/route-management.repository.ts
```

### 17.1 Read Design

Read endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
```

Behavior:

```txt
GET /internal/admin/routes
  -> Requires x-admin-api-key
  -> Returns route configs where deleted_at IS NULL
  -> Includes enabled and disabled active route configs
  -> Excludes soft-deleted route configs
  -> Orders routes by priority and gatewayPath

GET /internal/admin/routes/:id
  -> Requires x-admin-api-key
  -> Returns one route config by id where deleted_at IS NULL
  -> Returns 404 ROUTE_CONFIG_NOT_FOUND if missing or soft-deleted
```

Why read APIs exclude soft-deleted records:

* Soft delete keeps historical rows in the database.
* Admin list/detail represents currently manageable route configs.
* Deleted records should not be accidentally updated or deleted again.
* Future audit/history views can expose deleted records separately.

---

### 17.2 Create Design

Create endpoint:

```txt
POST /internal/admin/routes
```

Create flow:

```txt
Admin client
  -> POST /internal/admin/routes
  -> x-admin-api-key
  -> optional x-admin-actor
  -> Admin API key middleware
  -> Parse request body
  -> Map request body to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check duplicate active method + gatewayPath
  -> Insert route into gateway.gateway_routes
  -> Set created_by and updated_by
  -> Return 201 Created
```

Create validation rules:

```txt
Request body must be a valid route config shape.
Mapped DownstreamRouteConfig must pass validateDownstreamRoutes().
method + gatewayPath must not already exist as an active route.
Soft-deleted route configs do not count as duplicates.
Partial unique index remains as a database safety layer.
```

Duplicate response:

```txt
409 ROUTE_CONFIG_ALREADY_EXISTS
```

Invalid route config response:

```txt
400 ROUTE_CONFIG_INVALID
```

---

### 17.3 Update Design

Update endpoint:

```txt
PATCH /internal/admin/routes/:id
```

Update flow:

```txt
Admin client
  -> PATCH /internal/admin/routes/:id
  -> x-admin-api-key
  -> optional x-admin-actor
  -> Admin API key middleware
  -> Find existing active route by id
  -> Return 404 if route does not exist or is soft-deleted
  -> Merge existing route config with PATCH body
  -> Map merged data to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check method + gatewayPath conflict against other active routes
  -> Update route in gateway.gateway_routes
  -> Set updated_by
  -> Return 200 OK
```

Current update error responses:

```txt
Route config not found
  -> 404 ROUTE_CONFIG_NOT_FOUND

Invalid merged route config
  -> 400 ROUTE_CONFIG_INVALID

Conflict with another active method + gatewayPath
  -> 409 ROUTE_CONFIG_ALREADY_EXISTS
```

---

### 17.4 Enable/Disable Design

Enable/disable is handled through PATCH:

```txt
PATCH /internal/admin/routes/:id
Body: { "enabled": false }
```

Current behavior:

```txt
Route remains stored in gateway.gateway_routes.
Route remains visible in admin read API if deleted_at IS NULL.
Route is not loaded as an active runtime route after API Gateway restart.
Client requests to the disabled route return 404 after restart.
```

Why disable remains separate from delete:

* Disable is reversible.
* Disable keeps the route visible and manageable.
* Delete is represented by soft delete and hides the route from normal management APIs.

---

### 17.5 Soft Delete Design

Soft delete endpoint:

```txt
DELETE /internal/admin/routes/:id
```

Soft delete flow:

```txt
Admin client
  -> DELETE /internal/admin/routes/:id
  -> x-admin-api-key
  -> optional x-admin-actor
  -> Admin API key middleware
  -> Find existing active route by id
  -> Return 404 if route does not exist or is already soft-deleted
  -> Update route:
       enabled = false
       deleted_at = current timestamp
       deleted_by = actor
       updated_by = actor
  -> Return 200 OK with deleted route response
```

Soft delete behavior:

```txt
Record remains stored in gateway.gateway_routes.
deleted_at marks the route as deleted.
deleted_by records the actor.
enabled is forced to false.
Admin list/detail APIs exclude the soft-deleted route.
Runtime route loader excludes the soft-deleted route.
Duplicate checks ignore soft-deleted routes.
The same method + gatewayPath can be created again after soft delete.
```

Why soft delete is used instead of hard delete:

* Route management operations need safer recovery and future auditability.
* Historical route data should remain available for future admin/audit views.
* Hard delete would remove useful operational context.
* Soft delete is safer for product-like API management systems.

---

### 17.6 Reload Validation Design

Reload validation endpoint:

```txt
POST /internal/admin/routes/reload
```

Current reload validation response shape:

```json
{
  "data": {
    "mode": "validation-only",
    "runtimeApplied": false,
    "requiresRestart": true,
    "routeCount": 2,
    "routes": [
      {
        "method": "GET",
        "gatewayPath": "/api/products",
        "enabled": true,
        "priority": 100
      }
    ]
  }
}
```

Current behavior:

```txt
Reads active route configs.
Filters enabled and non-deleted routes for runtime validation.
Maps records to DownstreamRouteConfig[].
Reuses existing route config validation.
Returns routeCount and route summary.
Does not apply changes to the running Fastify route table.
Does not re-register routes.
Does not remove old runtime routes.
```

Current response flags:

```txt
mode = validation-only
runtimeApplied = false
requiresRestart = true
```

Why this endpoint exists before true hot reload:

* Admin clients can validate route config health before restart.
* The API shape prepares for a future reload/hot reload flow.
* Runtime hot reload is intentionally deferred because Fastify route replacement needs safer design.
* The current behavior is explicit and does not pretend runtime changes were applied.

---

### 17.7 Runtime Reload Strategy

Current strategy:

```txt
Route config create/update/delete writes to PostgreSQL.
POST /internal/admin/routes/reload validates current active DB route configs.
API Gateway loads route configs only at startup.
Route config changes take effect after API Gateway restart.
```

Why true hot reload is deferred:

* Runtime route hot reload requires careful route replacement design.
* Fastify route re-registration has lifecycle and stale route concerns.
* Hot reload must handle validation failures safely.
* Hot reload must define cache and rate limit behavior for changed routes.
* Restart-based reload is simpler and safer at this stage.
* Validation-only reload reduces risk while preserving a future API contract.

Deferred:

```txt
True runtime route hot reload
Zero-downtime route replacement
Route config watch mode
Admin Dashboard reload UX
```

---

### 17.8 Route Management Error Design

Current route management error responses:

```txt
Missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Route config not found
  -> 404 ROUTE_CONFIG_NOT_FOUND

Invalid route config
  -> 400 ROUTE_CONFIG_INVALID

Duplicate active method + gatewayPath
  -> 409 ROUTE_CONFIG_ALREADY_EXISTS

Reload validation failure
  -> 400 ROUTE_CONFIG_RELOAD_VALIDATION_FAILED
```

---

## 18. CI/CD Design

Sprint 6 introduced a GitHub Actions CI/CD foundation.

Sprint 8 extended CI to generate API Gateway Prisma Client as well.

Current workflow file:

```txt
.github/workflows/ci.yml
```

Current workflow name:

```txt
CI
```

Current job name:

```txt
Test, Typecheck, and Build
```

Current triggers:

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
npm run db:generate -w apps/api-gateway
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Current CI validation scope:

* Clean dependency installation with `npm ci`.
* Prisma Client generation for Product Service.
* Prisma Client generation for API Gateway.
* Automated test execution.
* TypeScript typecheck.
* Production build.
* API Gateway Docker image build.
* Product Service Docker image build.
* GitHub workflow pass/fail reporting.
* README CI badge status.

Current CI limitations:

* CI does not deploy automatically yet.
* CI does not push Docker images to a registry yet.
* CI does not run the full Docker Compose runtime stack yet.
* CI does not manage production secrets yet.
* CI is intentionally lightweight at this stage.

Design reason:

* The repository should prove that it can be validated from a clean runner.
* The main branch should remain stable after each push.
* Pull requests should have automated checks before merging.
* CI should catch test, typecheck, build, Prisma generation, and Docker image build failures early.
* API Gateway Prisma generated client should not be committed.
* API Gateway Prisma Client must be generated in clean runners and Docker builds.
* Deployment can be planned later after runtime and environment decisions are clearer.

---

## 19. Database Design

PulseGate currently uses PostgreSQL in two separate ownership areas.

### 19.1 Product Service Database Ownership

Product Service owns product data.

Database:

```txt
PostgreSQL
```

ORM:

```txt
Prisma
```

Schema:

```txt
public
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
public.products
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
* API Gateway does not connect directly to PostgreSQL for product data.
* API Gateway only communicates with Product Service through HTTP.
* Product Service reads from PostgreSQL through Prisma.
* The Product response shape remains compatible with the earlier mock response shape.
* Prisma Client is generated in CI before typecheck and build.

---

### 19.2 API Gateway Route Config Database Ownership

API Gateway owns route config data.

Database:

```txt
PostgreSQL
```

ORM:

```txt
Prisma
```

Schema:

```txt
gateway
```

Current table:

```txt
gateway.gateway_routes
```

Current seed script:

```txt
apps/api-gateway/prisma/seed.ts
```

Current active seeded route configs:

```txt
GET /api/products
GET /api/product-service/health
```

Soft-deleted rows may also exist from local runtime validation, but they are not active routes.

Design notes:

* API Gateway uses PostgreSQL only for Gateway route config.
* API Gateway does not use this database connection to read Product Service data.
* Product data remains owned by Product Service.
* The `gateway` schema avoids Prisma migration drift with the Product Service `public` schema.
* API Gateway route config migration history is stored separately in `gateway._prisma_migrations`.
* This separation keeps service ownership clearer and avoids cross-service schema conflicts.
* Route management APIs read and write records in `gateway.gateway_routes`.
* Route management APIs exclude soft-deleted records from normal list/detail/update/delete behavior.
* Runtime route config loading reads enabled records where `deleted_at IS NULL` from `gateway.gateway_routes`.
* Soft-deleted records remain available for future audit/history use cases.

---

## 20. Current Tech Stack

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
* GitHub Actions

Currently implemented Gateway capabilities:

* Request ID propagation.
* JSON logging.
* Structured access logging.
* Response time measurement.
* API key authentication.
* Admin API key authentication.
* JWT authentication.
* Static downstream route configuration fallback.
* Database-backed downstream route configuration.
* Runtime route config loader.
* Route config mapper from database records.
* Route config repository with Prisma.
* Generic downstream proxy route foundation.
* Route policy configuration.
* Route config validation.
* Route management API foundation.
* Route config list API.
* Route config detail API.
* Route config create API.
* Route config update API.
* Route config enable/disable foundation.
* Route config soft delete API.
* Route config reload validation API.
* Basic route management actor metadata.
* Active-route partial unique constraint strategy.
* Downstream timeout handling.
* Normalized downstream error handling.
* Redis-backed rate limiting.
* Request size limit.
* Basic security headers.
* Redis response caching.
* Request transform foundation.
* Response transform foundation.
* Upstream retry policy foundation.
* Prometheus-compatible metrics endpoint.
* Unit tests.
* Integration tests.
* Route management API tests.

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

Currently implemented CI/CD capabilities:

* GitHub Actions workflow.
* Push validation for `main`.
* Pull request validation for `main`.
* Node.js 20 setup.
* Clean dependency installation with `npm ci`.
* Product Service Prisma Client generation.
* API Gateway Prisma Client generation.
* Automated test validation.
* TypeScript typecheck validation.
* Production build validation.
* API Gateway Docker image build validation.
* Product Service Docker image build validation.
* README CI badge.

Not implemented yet:

* Runtime route hot reload
* Route management audit log
* Stronger admin authentication beyond local admin API key
* Service registry
* API consumer database
* API key lifecycle management
* Usage plans and quotas
* Kafka
* RabbitMQ
* Kubernetes
* OpenTelemetry
* Jaeger or Tempo
* Loki
* k6
* Admin Dashboard
* Developer Portal
* Docker image registry push
* Automatic deployment
* Production cloud deployment

---

## 21. Monorepo Structure

Current repository structure:

```txt
pulsegate/
  .github/
    workflows/
      ci.yml

  apps/
    api-gateway/
      Dockerfile
      prisma/
        migrations/
          20260701063629_add_gateway_routes/
            migration.sql
          20260702090000_add_gateway_route_soft_delete/
            migration.sql
          migration_lock.toml
        schema.prisma
        seed.ts
      src/
        app.ts
        app.test.ts
        cache/
          redis-response-cache-store.ts
          redis-response-cache-store.test.ts
        config/
          database-route-config.mapper.ts
          database-route-config.mapper.test.ts
          database-route-config.repository.ts
          downstream-routes.ts
          downstream-routes.test.ts
          env.ts
          env.test.ts
          runtime-downstream-routes.ts
          runtime-downstream-routes.test.ts
          validate-downstream-routes.ts
          validate-downstream-routes.test.ts
        database/
          gateway-prisma.ts
        errors/
          downstream-service-error.ts
          downstream-service-error.test.ts
        middlewares/
          access-log.middleware.ts
          access-log.middleware.test.ts
          admin-api-key-auth.middleware.ts
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
        route-management/
          route-management.mapper.ts
          route-management.repository.ts
          route-management.types.ts
        routes/
          admin-route-config.route.ts
          admin-route-config.route.test.ts
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

## 22. Automated Test and CI Architecture

PulseGate uses Vitest for API Gateway unit and integration tests.

Current test command:

```powershell
npm run test
```

Current test status:

```txt
27 test files passed
176 tests passed
```

Current CI-equivalent local validation command:

```powershell
npm ci
npm run db:generate -w apps/product-service
npm run db:generate -w apps/api-gateway
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
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
  -> Number, CSV, string env parsing, default admin API key config, custom admin API key config

downstream-routes.test.ts
  -> Product route policy config
  -> Product Service health route config
  -> Multi-route downstream route config list

validate-downstream-routes.test.ts
  -> Route config validation, duplicate route detection, invalid policy detection

database-route-config.mapper.test.ts
  -> Database route record mapping
  -> Disabled route filtering
  -> Priority ordering
  -> Header transform JSON validation
  -> Retry status JSON validation
  -> Mapped downstream route validation

runtime-downstream-routes.test.ts
  -> DB route config success behavior
  -> Fallback when DB returns no routes
  -> Fallback when DB loading fails

observability/metrics.test.ts
  -> Metrics registry, request metrics, cache metrics, cache status normalization

metrics.route.test.ts
  -> /metrics endpoint and Prometheus text format

admin-route-config.route.test.ts
  -> Admin API key guard behavior
  -> Route config list behavior
  -> Route config detail behavior
  -> Route config create behavior
  -> Route config update behavior
  -> Route config soft delete behavior
  -> Route config reload validation behavior
  -> Validation error behavior
  -> Duplicate conflict behavior
  -> Not found behavior

timeout.policy.test.ts
  -> Timeout policy signal creation, abort behavior, and cleanup

cache.policy.test.ts
  -> Cache key generation, enabled/disabled resolution, TTL override

rate-limit.policy.test.ts
  -> Runtime rate limit policy resolution

request-transform.policy.test.ts
  -> Request header add/remove behavior and immutability

response-transform.policy.test.ts
  -> Response header add/remove behavior and immutability

retry.policy.test.ts
  -> Retryable HTTP method checks, retryable status checks, result retry, error retry, retry exhaustion
```

Current integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes basic security headers

GET /api/product-service/health
  -> 200 OK
  -> does not require API key
  -> does not require JWT
  -> proxies to Product Service /health
  -> returns x-cache: BYPASS
  -> includes x-request-id
  -> includes x-response-time-ms
  -> does not return rate limit headers

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

Current route management API test coverage:

```txt
GET /internal/admin/routes
  -> 401 when admin API key is missing
  -> 403 when admin API key is invalid
  -> 200 and returns all route configs when admin API key is valid

GET /internal/admin/routes/:id
  -> 200 and returns route config by id
  -> 404 when route config id does not exist

POST /internal/admin/routes
  -> 201 and creates route config
  -> 400 when route config is invalid
  -> 409 when method + gatewayPath already exists
  -> 401 when admin API key is missing

PATCH /internal/admin/routes/:id
  -> 200 and updates route config
  -> 404 when route config id does not exist
  -> 400 when merged route config is invalid
  -> 409 when method + gatewayPath conflicts with another active route
  -> 401 when admin API key is missing

DELETE /internal/admin/routes/:id
  -> 200 and soft deletes route config
  -> 404 when route config id does not exist or is already soft-deleted
  -> 401 when admin API key is missing
  -> soft-deleted route is hidden from list/detail APIs

POST /internal/admin/routes/reload
  -> 200 and validates active route configs without applying runtime changes
  -> returns mode=validation-only
  -> returns runtimeApplied=false
  -> returns requiresRestart=true
  -> 401 when admin API key is missing
  -> 403 when admin API key is invalid
```

Current CI validation coverage:

```txt
npm ci
Product Service Prisma Client generation
API Gateway Prisma Client generation
npm run test
npm run typecheck
npm run build
API Gateway Docker image build
Product Service Docker image build
```

---

## 23. Current Design Principles

PulseGate follows these principles:

### 23.1 Local First

The project should run locally before adding cloud deployment.

### 23.2 Cost Safe

Early versions should not require paid cloud infrastructure.

### 23.3 Small Steps

New technologies should be added only after the previous layer is stable.

### 23.4 Clean Structure

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
* Static downstream route configuration
* Runtime route config loader
* Database route config repository
* Database route config mapper
* Gateway Prisma Client wrapper
* Route management module
* Route management repository
* Route management mapper
* Route policy types
* Route policy helpers
* Route config validation
* Generic downstream proxy behavior
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

CI/CD config is separated under:

```txt
.github/workflows/
```

### 23.5 Observable by Design

Request ID, structured access logs, response time headers, metrics, Prometheus, and Grafana are part of the Gateway foundation.

### 23.6 Policy-Driven Gateway Behavior

Gateway route behavior should be controlled by route policies instead of being hardcoded directly inside route handlers.

Current policies include:

```txt
auth
timeout
cache
rateLimit
requestTransform
responseTransform
retry
```

### 23.7 CI-Validated by Design

Repository health should be validated automatically before the main branch is considered stable.

Current CI validates:

```txt
npm ci
Product Service Prisma Client generation
API Gateway Prisma Client generation
automated tests
TypeScript typecheck
production build
Docker image builds
```

### 23.8 Behavior First, Infrastructure Later

Gateway behavior is implemented and tested before adding more advanced distributed systems.

### 23.9 Test Before Scaling

Core Gateway behavior should be protected by automated tests before infrastructure and distributed systems are added.

### 23.10 Infrastructure After Stable Gateway Behavior

Docker, PostgreSQL, Redis, Prisma, Prometheus, and Grafana were added only after routing, auth, downstream resilience, and traffic protection were stable.

### 23.11 Provision Infrastructure Configuration

Prometheus and Grafana configuration should be file-based where possible so the local stack is reproducible.

### 23.12 Static Fallback Before Dynamic Config Rollout

Sprint 8 deliberately keeps a static route config fallback while adding database-backed route config.

Reason:

* Avoid making Gateway startup fragile.
* Preserve existing Product route behavior.
* Preserve existing Product Service health proxy behavior.
* Allow database-backed route config to be rolled out safely.
* Prepare a stable foundation for future route management APIs.

### 23.13 Database-Backed Config Before Admin UI

Route config persistence should exist before building an Admin Dashboard.

Reason:

* Admin UI needs a real persistence layer.
* API Gateway route behavior should already be config-driven.
* Admin APIs can build on the existing `gateway.gateway_routes` model.

### 23.14 Backend Route Management Before Admin Dashboard

Sprint 9 adds backend route management APIs before any Admin Dashboard UI.

Reason:

* Admin Dashboard should not be built on manual DB edits.
* Route list, detail, create, and update behavior should be stable first.
* Validation and duplicate conflict behavior should be tested before UI workflows are added.
* Backend route management should remain usable without UI.
* This keeps the product direction stable and incremental.

### 23.15 Restart-Based Reload Before Hot Reload

Sprint 9 kept route config reload restart-based.

Sprint 10 added a validation-only reload endpoint before true hot reload.

Reason:

* Runtime route hot reload is a separate complex concern.
* Restart-based reload is predictable and safe.
* Create/update/enable/disable/delete behavior can be validated without route replacement complexity.
* Reload validation lets admins check active route config health before restarting.
* Hot reload can be implemented later as a controlled sprint.

### 23.16 Soft Delete Before Hard Delete

Sprint 10 uses soft delete for route config removal.

Reason:

* Route management is operationally sensitive.
* Hard delete removes useful debugging and audit context.
* Soft delete keeps the database safer for future audit/history views.
* Active route uniqueness can still be preserved through a partial unique index.

---

## 24. Future Target Architecture

Long-term architecture:

```txt
Client / Frontend / External API Consumer
  -> PulseGate API Gateway
    -> Auth Service
    -> Product Service
    -> Order Service
    -> Payment Service
    -> Notification Service

Gateway Config Layer
  -> Database-backed route configuration
  -> Route management APIs
  -> Route reload APIs
  -> Service registry
  -> API consumers
  -> API keys
  -> Usage plans
  -> Quotas

Gateway Policy Layer
  -> Route policies
  -> Auth policies
  -> Timeout policies
  -> Cache policies
  -> Rate limit policies
  -> Transform policies
  -> Retry policies

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

API Management
  -> Admin Backend API
  -> Admin Dashboard
  -> Developer Portal
  -> API documentation
  -> API key request flow

Infrastructure
  -> Docker Compose for local development
  -> GitHub Actions CI
  -> Docker image registry later
  -> Kubernetes later
  -> Cloud deployment later
```

---

## 25. Planned Evolution

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
Done
```

---

### Sprint 5 - Advanced Gateway Policies

Goal:

* Review current route configuration model.
* Add route policy type foundation.
* Add route config validation improvements.
* Add per-route timeout policy.
* Add per-route cache policy.
* Add per-route rate limit policy.
* Add request transformation foundation.
* Add response transformation foundation.
* Add upstream retry policy foundation.
* Add tests for each policy behavior.
* Add integration test coverage for route policy behavior.

Status:

```txt
Done
```

---

### Sprint 6 - CI/CD Foundation

Goal:

* Review current root and workspace package scripts.
* Add GitHub Actions workflow.
* Run CI on push to `main`.
* Run CI on pull request to `main`.
* Use Node.js 20 in CI.
* Install dependencies with `npm ci`.
* Generate Product Service Prisma Client in CI.
* Run automated tests in CI.
* Run TypeScript typecheck in CI.
* Run production build in CI.
* Validate API Gateway Docker image build in CI.
* Validate Product Service Docker image build in CI.
* Add README CI badge.
* Validate GitHub Actions CI on GitHub.
* Keep deployment, registry push, and Kubernetes out of scope for this sprint.

Status:

```txt
Done
```

---

### Sprint 7 - Multi-Route Gateway Expansion

Goal:

* Refactor the Product proxy route into a generic downstream proxy foundation.
* Keep existing Product route behavior stable.
* Add more than one downstream route config.
* Add a public Product Service health proxy route.
* Register multiple downstream routes from `downstreamRouteConfigs`.
* Prove that protected and public Gateway routes can coexist.
* Validate tests, typecheck, build, and Docker runtime.

Completed:

* Added generic `downstreamProxyRoute()`.
* Kept `productProxyRoute()` compatibility wrapper.
* Added `productServiceHealthRouteConfig`.
* Added `GET /api/product-service/health -> Product Service /health`.
* Registered route configs through `downstreamRouteConfigs`.
* Preserved `GET /api/products` API key, JWT, rate limit, and cache behavior.
* Added route config tests.
* Added public route integration test.
* Validated Docker runtime.
* Validated product route cache `MISS -> HIT`.
* Updated test status to 142 passing tests.

Status:

```txt
Done
```

---

### Sprint 8 - Dynamic Route Config from Database

Goal:

* Design a database model for Gateway route config.
* Add Prisma model and migration for route config.
* Seed or bootstrap route config records.
* Load route config from PostgreSQL.
* Keep safe fallback to static route config during rollout.
* Validate database-backed route config.
* Add tests for database route config loading.
* Prepare future Admin API route management.

Completed:

* Added API Gateway Prisma schema.
* Added dedicated PostgreSQL `gateway` schema for API Gateway route config.
* Added `gateway.gateway_routes` table.
* Added route config migration.
* Added idempotent route config seed.
* Seeded current protected product route.
* Seeded current public Product Service health proxy route.
* Added database route config mapper.
* Added database route config repository.
* Added Gateway Prisma Client wrapper.
* Added runtime route config loader.
* Added safe static route config fallback.
* Updated `app.ts` to accept resolved runtime route configs.
* Updated `server.ts` to load runtime route configs before app startup.
* Added mapper tests.
* Added fallback loader tests.
* Updated CI to generate API Gateway Prisma Client.
* Updated Docker image build to generate API Gateway Prisma Client inside Linux Alpine runtime.
* Updated Docker Compose API Gateway `DATABASE_URL`.
* Validated Docker runtime DB route config loading.
* Validated public route `GET /api/product-service/health`.
* Validated protected route `GET /api/products` with cache `MISS -> HIT`.
* Updated test status to 152 passing tests.

Status:

```txt
Done
```

---

### Sprint 9 - Route Management API Foundation

Goal:

* Add internal/admin route config read API.
* Add route config create/update foundation.
* Add route config enable/disable behavior.
* Add validation before persisting route data.
* Keep runtime reload strategy simple.
* Continue avoiding Admin Dashboard until backend route management behavior is stable.

Completed:

* Added admin API key environment config.
* Added `ADMIN_API_KEY_HEADER`.
* Added `ADMIN_API_KEY`.
* Added admin API key middleware.
* Added `GET /internal/admin/routes`.
* Added `GET /internal/admin/routes/:id`.
* Added `POST /internal/admin/routes`.
* Added `PATCH /internal/admin/routes/:id`.
* Added route management types.
* Added route management mapper.
* Added route management repository.
* Added Prisma-backed route management repository.
* Added route config list behavior.
* Added route config detail behavior.
* Added route config create behavior.
* Added route config update behavior.
* Added enable/disable behavior through PATCH.
* Reused `validateDownstreamRoutes()` before create.
* Reused `validateDownstreamRoutes()` before update.
* Added duplicate `method + gatewayPath` check before create.
* Added duplicate `method + gatewayPath` conflict check before update.
* Added route management API tests.
* Added admin API key env tests.
* Updated `.env.example`.
* Validated create route API in Docker runtime.
* Validated duplicate create returns `409 ROUTE_CONFIG_ALREADY_EXISTS`.
* Validated update route API in Docker runtime.
* Validated disabled route returns `404` after API Gateway restart.
* Cleaned temporary test route from database.
* Confirmed clean seeded DB has 2 route configs.
* Updated test status to 176 passing tests.

Status:

```txt
Done
```

---

### Sprint 10 - Route Management Hardening

Goal:

* Add route config soft delete strategy.
* Add basic route management audit metadata fields.
* Add active-route unique strategy.
* Add safe reload validation endpoint.
* Keep true runtime hot reload deferred until the backend behavior is safer.

Completed:

* Added `created_by` and `updated_by`.
* Added `deleted_at` and `deleted_by`.
* Added `DELETE /internal/admin/routes/:id`.
* Implemented soft delete by setting `enabled=false`, `deleted_at`, `deleted_by`, and `updated_by`.
* Updated admin list/detail/update/delete behavior to exclude soft-deleted route configs.
* Updated duplicate checks to ignore soft-deleted routes.
* Replaced full method + gatewayPath uniqueness with an active-route partial unique index.
* Updated runtime loader to load only enabled and non-deleted route configs.
* Updated seed behavior after removing Prisma compound unique upsert.
* Added optional `x-admin-actor` support.
* Added `POST /internal/admin/routes/reload`.
* Implemented reload validation as `validation-only`.
* Returned `runtimeApplied=false` and `requiresRestart=true`.
* Added tests for soft delete, hidden deleted routes, reload validation, and admin auth behavior.
* Validated Docker runtime for soft delete, recreate-after-delete, and reload validation.
* Updated test status to 176 passing tests.

Status:

```txt
Done
```

---

### Sprint 11 - Recommended Next

Recommended goal:

* Add real runtime route reload only if it can be done safely.
* Or add route management audit log table before true hot reload.
* Or start Admin Dashboard foundation after backend route management hardening is stable.

Recommended direction:

```txt
Route Management Audit Log Foundation before Admin Dashboard UI
```


---

### Later - Service Registry and API Management Foundation

Planned goal:

* Add service registry foundation.
* Add API consumer database.
* Add API key lifecycle.
* Add usage plans and quotas.
* Add Admin Backend API.
* Add Admin Dashboard foundation.
* Add Developer Portal foundation.
* Add OpenAPI documentation foundation.

Status:

```txt
Planned
```

---

### Later - Observability Expansion

Planned goal:

* Add OpenTelemetry tracing.
* Add Jaeger or Tempo trace viewer.
* Add Loki centralized logs.
* Add advanced Grafana dashboards.
* Add alerting.
* Add k6 load testing.

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

* Docker image registry push.
* Deployment automation.
* Kubernetes deployment.
* Production secrets.
* Cloud lightweight demo.
* Final product polish.

Status:

```txt
Future
```