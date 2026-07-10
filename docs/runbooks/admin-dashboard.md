# Admin Dashboard Runbook

This runbook documents local setup and validation for the PulseGate Admin Dashboard introduced in Sprint 61.

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

Current Sprint 61 baseline:

```txt
Admin Dashboard: 5 test files / 22 tests
API Gateway: 136 test files / 988 tests
Typecheck: passed
Build: passed
Compose config: passed
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

Sprint 61 expects the read-only credential to access:

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
