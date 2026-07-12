# Local Validation Runbook

This runbook contains the main local validation commands for PulseGate.

## Full Automated Validation

```powershell
npm run test
npm run typecheck
npm run build
git status
```

Expected result:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
git status         -> review current working tree
```

## Full Docker Stack

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
pulsegate-admin-dashboard  healthy
pulsegate-prometheus       up
pulsegate-grafana          up
```

## API Gateway Health

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Expected:

```txt
status = ok
```

## Product Service Health Through Gateway

```powershell
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Expected:

```txt
200 OK
x-cache: BYPASS
x-request-id
x-response-time-ms
```

## Metrics Endpoint

```powershell
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
```

Expected:

```txt
200 OK
Prometheus text format
```

## Create Local JWT

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

## Protected Product Route With Env Fallback Key

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}

Invoke-RestMethod http://localhost:3000/api/products `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
200 OK
Product list returned
```

## Admin Dashboard Validation

The Admin Dashboard requires a non-empty read-only Admin key shared with the API Gateway.

Before starting the full stack:

```powershell
$env:ADMIN_API_KEY = '<full-access-local-key>'
$env:ADMIN_READ_ONLY_API_KEY = '<read-only-local-key>'
$env:ADMIN_API_KEY_HEADER = 'x-admin-api-key'
```

Start or rebuild the Dashboard service:

```powershell
docker compose up -d --build admin-dashboard
docker compose ps admin-dashboard
```

Expected:

```txt
pulsegate-admin-dashboard
healthy
0.0.0.0:3003->3003/tcp
```

Validate the Overview page:

```powershell
Invoke-WebRequest `
  'http://127.0.0.1:3003/' `
  -UseBasicParsing
```

Expected:

```txt
200 OK
```

Validate the server-only Dashboard BFF:

```powershell
Invoke-RestMethod `
  'http://127.0.0.1:3003/api/admin/runtime-status' |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
data.accessMode = read-only
data.runtime.mode = runtime-registry
data.runtime.available = true
```

The Dashboard container must receive `ADMIN_READ_ONLY_API_KEY` but must not receive the full-access `ADMIN_API_KEY`.

For configuration, failure-state, credential-boundary, image, log, and troubleshooting checks, follow:

- `docs/runbooks/admin-dashboard.md`

## Stop Docker Stack

```powershell
docker compose down
```

## Observability and Bounded k6

Run the bounded health smoke:

```powershell
npm run test:k6:smoke
```

Validate the local observability runtime:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:9090/-/ready
Invoke-RestMethod http://localhost:3002/api/health
```

For unmatched-route cardinality checks, Prometheus target inspection, Grafana datasource/dashboard checks, all five PromQL queries, and k6 guardrails, follow:

- `docs/runbooks/observability-validation.md`

Important boundary:

- Metrics and dashboards are operational signals.
- `gateway.api_usage_events` remains the successful-usage and quota-counting source of truth.
- `gateway.api_rejected_events` remains the rejected/security traffic source of truth.

<!-- SPRINT-65-LOCAL-VALIDATION-START -->
## Developer Portal validation

```powershell
npm.cmd run test -w apps/developer-portal
npm.cmd run typecheck -w apps/developer-portal
npm.cmd run build -w apps/developer-portal

docker compose config --quiet
docker compose build developer-portal admin-dashboard
docker compose up -d developer-portal
docker compose ps developer-portal
```

Validate these URLs:

- `http://127.0.0.1:3004/`
- `http://127.0.0.1:3004/getting-started`
- `http://127.0.0.1:3004/api-docs`
- `http://127.0.0.1:3004/api-keys`

Expected result: HTTP 200 for every route and a `healthy` container status. Portal HTML must not expose Admin credential names or Admin endpoint paths.
<!-- SPRINT-65-LOCAL-VALIDATION-END -->

<!-- SPRINT-66-LOCAL-VALIDATION-START -->
## Sprint 66 Developer Portal validation

Run the clean release validation first:

```powershell
npm.cmd run validate:release
```

Validate the Portal image and runtime:

```powershell
docker compose config --quiet
docker compose build developer-portal
docker compose up -d developer-portal
docker compose ps developer-portal
```

Validate these URLs:

- `http://127.0.0.1:3004/`
- `http://127.0.0.1:3004/getting-started`
- `http://127.0.0.1:3004/api-docs`
- `http://127.0.0.1:3004/api-keys`

Expected results:

- Every route returns HTTP 200.
- A referenced `/_next/static/*.js` asset returns HTTP 200.
- The Developer Portal container reports `healthy`.
- `/api-docs` includes `/api/product-service/health`, `/api/products`, `API_KEY_MISSING`, `JWT_TOKEN_MISSING`, and `DOWNSTREAM_TIMEOUT`.
- `/api-keys` includes `Not connected`, `No key will be created`, and `No connected API-key account`.
- Rendered HTML does not contain Admin credential names, Admin endpoint paths, or a real-looking `pgk_live_` key.
- Production Portal source does not add forms, mutation controls, fetch integration, browser credential storage, or privileged Admin integration for API-key self-service.
<!-- SPRINT-66-LOCAL-VALIDATION-END -->

<!-- SPRINT-68-LOCAL-VALIDATION-START -->
## Sprint 68 weighted routing validation

Automated validation:

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
docker compose config --quiet
git diff --check
```

Prisma schema validation:

```powershell
$env:DATABASE_URL =
  'postgresql://pulsegate:validation-only@127.0.0.1:5432/pulsegate?schema=gateway'

npx.cmd --no-install prisma validate `
  --schema apps/api-gateway/prisma/schema.prisma
```

Database/runtime validation requires:

- deploy the Gateway migrations to bounded PostgreSQL
- verify `gateway.gateway_routes.weighted_upstreams` is nullable JSONB
- verify legacy rows remain SQL `NULL`
- create one isolated weighted route through the Admin API
- reload the runtime registry
- proxy through the weighted route
- clear `weightedUpstreams` with JSON null
- verify SQL `NULL`
- reload and proxy in single-upstream mode
- soft-delete the probe route
- reload and verify it is absent from the active registry

Do not treat random distribution sampling as a health/failover test. Deterministic selector boundary tests are the contract evidence; runtime validation proves persistence, reload, and shared proxy integration.
<!-- SPRINT-68-LOCAL-VALIDATION-END -->

<!-- SPRINT-69-LOCAL-VALIDATION-START -->
## Sprint 69 service discovery validation

Automated validation:

```powershell
npm.cmd run test
npm.cmd run typecheck
npm.cmd run build
docker compose config --quiet
git diff --check
```

Prisma schema validation:

```powershell
$env:DATABASE_URL =
  'postgresql://pulsegate:validation-only@127.0.0.1:5432/pulsegate?schema=gateway'

npx.cmd --no-install prisma validate `
  --schema apps/api-gateway/prisma/schema.prisma
```

Database/runtime validation requires:

- deploy migration `20260712114500_add_gateway_route_service_instances`
- verify `gateway.gateway_routes.service_instances` is nullable JSONB
- create one isolated direct discovery route through the full-access Admin API
- verify Admin list/detail and raw database JSONB roundtrip
- reload the runtime registry
- proxy through the discovery route and expect HTTP 200
- soft-delete the probe route
- reload and verify the removed route returns 404
- verify the database row remains soft-deleted
- force-recreate Gateway and Dashboard images when validating current source

Dashboard runtime validation requires:

- configure one temporary read-only Admin key for both Gateway and Dashboard
- verify read-only GET returns 200 and read-only POST returns 403
- verify Dashboard BFF list/detail preserves `serviceInstances`
- verify `/routes` returns HTTP 200
- verify the read-only credential is absent from rendered HTML
- clean the probe route and verify it disappears from the BFF list

Deterministic tests are the evidence for multi-instance random boundaries and weighted/discovery interaction. The bounded runtime probe proves migration, persistence, reload, proxy integration, Dashboard BFF behavior, credential boundaries, and cleanup. Do not treat this validation as health-check or failover evidence.
<!-- SPRINT-69-LOCAL-VALIDATION-END -->

<!-- SPRINT-70-LOCAL-VALIDATION-START -->
## Sprint 70 health/failover validation

Automated baseline:

```txt
API Gateway: 155 test files / 1140 tests
Typecheck: passed
Build: passed
```

Database guard:

```sql
SELECT count(*)
FROM gateway.gateway_routes
WHERE deleted_at IS NULL
  AND retry_attempts > 7;
```

Expected result: `0`.

Bounded runtime validation must prove:

1. configured discovery persistence roundtrip
2. two qualifying failures
3. client HTTP 200 through failover
4. cooldown exclusion
5. HTTP 503 when no eligible target remains
6. no additional downstream call in fail-closed state
7. no raw instance URL disclosure
8. route soft deletion and runtime removal
9. one retained soft-deleted database row
10. clean working tree and synchronized refs

Validated marker:

```txt
SPRINT_70_RUNTIME_FAILOVER=PASSED
```
<!-- SPRINT-70-LOCAL-VALIDATION-END -->
