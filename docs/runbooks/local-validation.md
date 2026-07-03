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

## Stop Docker Stack

```powershell
docker compose down
```
