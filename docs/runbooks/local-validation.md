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

<!-- SPRINT-71-LOCAL-VALIDATION-START -->
## Sprint 71 Kubernetes static validation

Sprint 71 adds Kubernetes artifacts without replacing the Docker Compose validation workflow.

Static validation:

```powershell
kubectl kustomize deploy/kubernetes/base
kubectl kustomize deploy/kubernetes/overlays/local
kubectl kustomize deploy/kubernetes/overlays/local/applications
```

Expected counts:

- base: 13 resources
- local bootstrap: 10 resources
- local applications: 13 resources

The static check must reject default public exposure, privileged containers, Kubernetes API/RBAC additions, and `latest` application images.

Cluster apply, image loading, rollout, port-forward, restart, termination, and cleanup validation remain Sprint 72 work.

See `docs/runbooks/kubernetes-local.md`.
<!-- SPRINT-71-LOCAL-VALIDATION-END -->

<!-- SPRINT-72-LOCAL-VALIDATION-START -->
## Sprint 72 Kubernetes runtime validation

Validated local environment:

```text
context: docker-desktop
Kubernetes: v1.32.2
nodes: 1 Ready control-plane
namespace: pulsegate
```

Validated sequence:

1. Build four local application images.
2. Render Kustomize targets with counts 13, 10, and 13.
3. Apply local bootstrap resources.
4. Wait for PostgreSQL and Redis.
5. Wait for the ordered migration Job.
6. Confirm 1 Product Service migration and 11 Gateway migrations.
7. Apply four application workloads.
8. Confirm all four application Deployments at 1/1 Ready.
9. Validate internal DNS and HTTP.
10. Validate seven port-forwarded HTTP surfaces.
11. Replace the Gateway pod and confirm new UID, zero restarts, and HTTP 200 health.

The API Gateway image also requires a runtime Redis import smoke because workspace dependencies are installed below `apps/api-gateway/node_modules`.

See `docs/runbooks/kubernetes-local.md`.
<!-- SPRINT-72-LOCAL-VALIDATION-END -->

<!-- SPRINT-76-LOCAL-VALIDATION-START -->
## Sprint 76 security validation hygiene

When temporary Admin credentials are generated for Docker runtime proof, they may remain in the current PowerShell process after containers are recreated.

Before running workspace tests or `npm.cmd run validate:release`, remove them from the shell:

~~~powershell
Remove-Item Env:ADMIN_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:ADMIN_READ_ONLY_API_KEY -ErrorAction SilentlyContinue
~~~

Leaving temporary values in the process can cause Admin route tests to inherit unexpected credentials and return `403` despite correct source behavior.

Sprint 76 release baseline:

- Admin Dashboard: 54 files / 248 tests.
- API Gateway: 163 files / 1177 tests.
- Developer Portal: 2 files / 7 tests.
- Product Service: 10 files / 36 tests.
- Typecheck and production builds passed for all four workspaces.
- Diff checks, clean-tree verification, and origin synchronization passed.
<!-- SPRINT-76-LOCAL-VALIDATION-END -->

<!-- SPRINT-77-LOCAL-VALIDATION-START -->
## Sprint 77 UI validation

Full validation baseline:

- Admin Dashboard: 55 test files / 253 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 8 tests.
- Product Service: 10 test files / 36 tests.
- Root typecheck, build, release validation, and Compose configuration passed.
- Package-lock hash and protected tag remained unchanged.
- Detailed logs are stored outside the repository under `E:\pulsegate-artifacts\sprint-77-full-validation`.

Bounded runtime validation:

1. Confirm API Gateway is already running.
2. Build only `admin-dashboard` and `developer-portal`.
3. Recreate only those UI services with `--no-deps`.
4. Wait for both healthchecks to become healthy.
5. Request all ten Dashboard routes and four Portal routes.
6. Verify production CSS focus selectors.
7. Verify keyboard-focusable Portal code and table regions.
8. Reject HTML containing Admin credential markers, fake issued-key prefixes, mojibake, or `U+FFFD`.
9. Capture container logs outside the repository.
10. Confirm Git refs and the working tree remain unchanged.

PowerShell 5.1 native-command rule:

- Docker BuildKit may write successful progress output to stderr.
- Use the native process exit code as the pass/fail source.
- Read optional JSON properties through property-existence checks under `Set-StrictMode`.
<!-- SPRINT-77-LOCAL-VALIDATION-END -->

<!-- SPRINT-78-LOCAL-VALIDATION-START -->
## Sprint 78 end-to-end demo and lightweight k6 validation

Validated flow:

~~~text
Developer Portal /api-docs
  -> API Gateway /api/product-service/health
  -> Product Service /health
~~~

Bounded runtime evidence:

- Demo: one successful usage event, zero rejected events.
- k6: one VU, ten shared iterations, 10/10 iterations complete, 30/30 checks pass.
- Failed smoke request rate: 0%.
- Smoke-phase p95: 34.19 ms against `p(95)<1000`.
- k6 persistence: ten successful usage events, zero rejected events.
- Required services retained container IDs, image IDs, and zero restart counts.
- Disposable k6 container removed.
- Release validation added no usage or rejected events.
- Six Sprint-started containers removed after validation.
- Named volumes and eleven bounded usage events preserved.
- No production capacity or production SLO claim.

Detailed commands and safety boundaries:

- `docs/runbooks/end-to-end-demo-and-k6.md`
<!-- SPRINT-78-LOCAL-VALIDATION-END -->
