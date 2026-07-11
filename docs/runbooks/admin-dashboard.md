# Admin Dashboard Runbook

This runbook documents local setup and validation for the PulseGate Admin Dashboard introduced in Sprint 61 and extended with bounded resource read views in Sprint 62.

## Runtime Ports

| Service | Port |
| --- | --- |
| API Gateway | `3000` |
| Product Service | `3001` |
| Grafana | `3002` |
| Admin Dashboard | `3003` |
| PostgreSQL | `5432` |
| Redis | `6379` |
| Prometheus | `9090` |

## Security Model

The Dashboard uses a server-only read-only Admin API credential.

Required variables:

```txt
PULSEGATE_GATEWAY_BASE_URL
ADMIN_READ_ONLY_API_KEY
```

Optional variables:

```txt
ADMIN_API_KEY_HEADER
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS
```

Defaults:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS=3000
```

The Dashboard must not receive:

```txt
ADMIN_API_KEY
```

The full-access Admin credential must remain outside the Dashboard process and container.

The browser never sends the Admin credential to the API Gateway.

Browser requests call only:

```txt
GET /api/admin/runtime-status
```

The Dashboard server calls only:

```txt
GET /internal/admin/routes/runtime
```

Sprint 61 does not provide a generic Admin API proxy or mutation controls.

## Local npm Development

Start the API Gateway and its dependencies first.

Set a separate read-only key for the API Gateway process:

```powershell
$env:ADMIN_API_KEY = '<full-access-local-key>'
$env:ADMIN_READ_ONLY_API_KEY = '<read-only-local-key>'

docker compose up -d --build `
  postgres `
  redis `
  product-service `
  api-gateway
```

Validate the Gateway directly:

```powershell
Invoke-RestMethod `
  'http://127.0.0.1:3000/internal/admin/routes/runtime' `
  -Headers @{
    'x-admin-api-key' = '<read-only-local-key>'
  } |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
mode = runtime-registry
available = true
routeCount >= 0
```

Configure the Dashboard terminal:

```powershell
$env:PULSEGATE_GATEWAY_BASE_URL = 'http://127.0.0.1:3000'
$env:ADMIN_READ_ONLY_API_KEY = '<read-only-local-key>'
$env:ADMIN_API_KEY_HEADER = 'x-admin-api-key'
$env:ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS = '3000'
```

Start the Dashboard:

```powershell
npm run dev:dashboard
```

Open:

```txt
http://127.0.0.1:3003
```

## Docker Compose Runtime

Provide a non-empty read-only key before starting the Dashboard:

```powershell
$env:ADMIN_API_KEY = '<full-access-local-key>'
$env:ADMIN_READ_ONLY_API_KEY = '<read-only-local-key>'
$env:ADMIN_API_KEY_HEADER = 'x-admin-api-key'
```

Start the required services:

```powershell
docker compose up -d --build `
  postgres `
  redis `
  product-service `
  api-gateway `
  admin-dashboard
```

Inspect state:

```powershell
docker compose ps
```

Expected Dashboard state:

```txt
pulsegate-admin-dashboard
Up
healthy
0.0.0.0:3003->3003/tcp
```

The Compose Dashboard uses:

```txt
PULSEGATE_GATEWAY_BASE_URL=http://api-gateway:3000
```

## Overview Validation

Validate the page:

```powershell
Invoke-WebRequest `
  'http://127.0.0.1:3003/' `
  -UseBasicParsing
```

Expected:

```txt
200 OK
```

Validate the Dashboard BFF:

```powershell
Invoke-RestMethod `
  'http://127.0.0.1:3003/api/admin/runtime-status' |
  ConvertTo-Json -Depth 10
```

Expected response includes:

```txt
data.accessMode = read-only
data.runtime.mode = runtime-registry
data.runtime.available = true
data.runtime.routeCount
data.runtime.routes
```

The Overview panel displays:

- connectivity state
- access mode
- runtime mode
- loaded version
- registered route count
- loaded timestamp

## Missing Configuration Validation

Start the Dashboard without:

```txt
PULSEGATE_GATEWAY_BASE_URL
```

or without:

```txt
ADMIN_READ_ONLY_API_KEY
```

Expected BFF response:

```txt
503
ADMIN_DASHBOARD_CONFIG_MISSING
```

Invalid configuration returns:

```txt
503
ADMIN_DASHBOARD_CONFIG_INVALID
```

## Invalid Credential Validation

Configure the Dashboard with a key not accepted by the Gateway:

```powershell
$env:PULSEGATE_GATEWAY_BASE_URL = 'http://127.0.0.1:3000'
$env:ADMIN_READ_ONLY_API_KEY = '<invalid-read-only-key>'
```

Call:

```powershell
curl.exe -i `
  'http://127.0.0.1:3003/api/admin/runtime-status'
```

Expected:

```txt
HTTP 403
ADMIN_DASHBOARD_FORBIDDEN
```

The response may contain a safe Gateway `requestId`.

It must not contain the rejected credential.

## Credential Boundary Validation

Inspect Dashboard container environment variable names:

```powershell
docker compose exec -T admin-dashboard sh -lc `
  'test -n "$ADMIN_READ_ONLY_API_KEY" && test -z "$ADMIN_API_KEY"'
```

Expected exit code:

```txt
0
```

Inspect image environment configuration:

```powershell
docker image inspect `
  pulsegate-admin-dashboard `
  --format '{{json .Config.Env}}'
```

The image configuration must not contain:

```txt
ADMIN_API_KEY
ADMIN_READ_ONLY_API_KEY
```

Credentials are injected at container runtime, not image build time.

## Browser-Side Secret Checks

The following must remain absent from browser-facing production source:

```txt
NEXT_PUBLIC_ADMIN_API_KEY
NEXT_PUBLIC_ADMIN_READ_ONLY_API_KEY
ADMIN_READ_ONLY_API_KEY
x-admin-api-key
localStorage
sessionStorage
```

The browser request to the BFF contains only:

```txt
accept: application/json
```

The Admin header is added only by the Dashboard server when calling the Gateway.

## Automated Validation

Run:

```powershell
npm test
npm run typecheck
npm run build
docker compose config --quiet
git diff --check
```

Current Sprint 62 baseline:

```txt
Admin Dashboard: 38 test files / 200 tests
API Gateway: 136 test files / 988 tests
Typecheck: passed
Build: passed
Compose config: passed
Runtime mutation count: 0
```



## Health and Logs

Inspect Dashboard health:

```powershell
docker inspect `
  --format '{{.State.Health.Status}}' `
  pulsegate-admin-dashboard
```

Inspect Dashboard logs:

```powershell
docker compose logs --tail 120 admin-dashboard
```

Inspect Gateway logs:

```powershell
docker compose logs --tail 120 api-gateway
```

Admin credentials must not appear in logs.

## Troubleshooting

### Dashboard returns 503 configuration error

Check that these variables are non-empty:

```txt
PULSEGATE_GATEWAY_BASE_URL
ADMIN_READ_ONLY_API_KEY
```

### Dashboard returns 401

The Gateway did not receive an accepted Admin credential.

Check:

- configured header name
- read-only key value
- Gateway environment
- Dashboard environment

### Dashboard returns 403

The credential was rejected or does not have access to the requested Admin resource.

The original runtime-status flow expects the read-only credential to access:

```txt
GET /internal/admin/routes/runtime
```

### Dashboard returns 504

The Gateway request exceeded:

```txt
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS
```

Check Gateway health and Docker networking before increasing the timeout.

### Dashboard returns 502

The Gateway returned an unexpected or invalid payload.

Inspect Gateway logs and verify the runtime-registry endpoint contract.

### Port 3003 is already in use

Inspect the listener:

```powershell
Get-NetTCPConnection `
  -LocalPort 3003 `
  -State Listen `
  -ErrorAction SilentlyContinue
```

Stop the previous Dashboard process or container before retrying.

## Stop the Dashboard

Stop only the Dashboard service:

```powershell
docker compose stop admin-dashboard
```

Remove only the Dashboard container:

```powershell
docker compose rm -f admin-dashboard
```

Do not use:

```txt
docker compose down -v
```

unless Docker volume deletion is explicitly intended and approved.

## Safety Boundaries

This runbook must not be used to introduce:

- Dashboard mutation controls
- full-access Admin credentials in the Dashboard
- a generic Admin API proxy
- browser-stored Admin credentials
- consumer, API key, usage-plan, or route mutations in Sprint 61
- quota behavior changes
- scheduler execution expansion
- retention execution
- raw-event deletion
- database-backed administrator or organization models

## Sprint 62 Resource Read Views

Sprint 62 extends the Dashboard with bounded read-only resources. The server-only credential and fixed-resource model from Sprint 61 remain unchanged.

### Pages

```txt
http://localhost:3003/consumers
http://localhost:3003/api-keys
http://localhost:3003/usage-plans
http://localhost:3003/routes
```

### Dashboard BFF resources

```txt
GET /api/admin/consumers
GET /api/admin/consumers/:consumerId
GET /api/admin/consumers/:consumerId/api-keys
GET /api/admin/usage-plans
GET /api/admin/usage-plans/:usagePlanId
GET /api/admin/routes
GET /api/admin/routes/:routeId
GET /api/admin/routes/runtime
```

These routes are fixed, GET-only, and no-store. Browser input cannot select arbitrary Gateway paths, methods, hosts, or headers.

### Quick validation

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  http://localhost:3003/consumers

Invoke-RestMethod `
  http://localhost:3003/api/admin/consumers |
  ConvertTo-Json -Depth 20

Invoke-WebRequest `
  -UseBasicParsing `
  http://localhost:3003/api-keys

Invoke-RestMethod `
  http://localhost:3003/api/admin/usage-plans |
  ConvertTo-Json -Depth 20

Invoke-RestMethod `
  http://localhost:3003/api/admin/routes |
  ConvertTo-Json -Depth 30

Invoke-RestMethod `
  http://localhost:3003/api/admin/routes/runtime |
  ConvertTo-Json -Depth 30
```

### Expected read-only behavior

- Consumer list/detail responses contain safe consumer metadata.
- API key responses are scoped to the selected consumer.
- API key responses contain metadata and prefixes only, never raw issued keys.
- Usage-plan list/detail responses preserve identity and quota metadata.
- Persisted route configuration and runtime route registry are displayed separately.
- Missing resources map to bounded `404` responses.
- Unsupported BFF mutation methods return `405`.
- Gateway mutations attempted with the read-only key return `403 ADMIN_API_KEY_READ_ONLY`.

### Current validation baseline

```txt
Admin Dashboard: 38 test files / 200 tests
API Gateway: 136 test files / 988 tests
Typecheck: passed
Build: passed
Compose config: passed
Runtime mutation count: 0
```

### Forbidden behavior

Do not:

- add a generic Admin API proxy
- forward arbitrary browser-selected paths or methods
- provide full-access `ADMIN_API_KEY` to the Dashboard
- expose Admin credentials in browser data or logs
- render or store raw issued API keys
- add create, update, revoke, assign, delete, or reload controls without a separate approved checkpoint
- treat route downstream URLs as proxy targets
- change quota counting, event recording, scheduler execution, retention execution, or raw-event deletion behavior

## Sprint 63 Quota, Usage, and Rejected-Event Views

Product/documentation version: `v1.3.0`.

New pages:

```txt
http://localhost:3003/usage-analytics
http://localhost:3003/rejected-events
```

Fixed Dashboard BFF resources:

```txt
GET /api/admin/usage/consumers/:consumerId/summary
GET /api/admin/usage/api-keys/:apiKeyId/summary
GET /api/admin/api-keys/:apiKeyId/quota
GET /api/admin/usage-plans/:usagePlanId/usage-summary
GET /api/admin/usage/events
GET /api/admin/api-rejections/summary
GET /api/admin/api-rejections/events
```

Operational behavior:

- All resources are GET-only and no-store.
- The server uses only `ADMIN_READ_ONLY_API_KEY`.
- Event pages default to 20 rows and allow at most 100.
- Date ranges are bounded to 31 days.
- Dashboard navigation uses opaque cursors, not offset.
- Unknown/duplicate keys, offset, and rollup flags are rejected.
- Successful usage and rejected/security events are separate.
- Rejected-event raw metadata is never rendered.
- No create, update, assign, revoke, reload, delete, scheduler execute, or retention execute control exists.

Validation:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
docker compose config --quiet
```
