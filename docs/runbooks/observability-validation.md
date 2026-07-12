# Observability, tracing, and k6 Validation Runbook

This runbook validates the local PulseGate observability path without destructive traffic or production-scale load.

## Scope

The flow validates:

- API Gateway health
- `/metrics`
- bounded unmatched-route labels
- Prometheus scrape health
- Grafana health and Prometheus datasource
- provisioned dashboard queries
- bounded k6 health smoke

It does not validate quota correctness from metrics and does not create or delete analytics data.

## Start the Stack

~~~powershell
cd E:\pulsegate

docker compose up -d --build
docker compose ps
~~~

Expected ports:

- API Gateway: `3000`
- Grafana: `3002`
- Prometheus: `9090`

## Gateway and Metrics

~~~powershell
Invoke-RestMethod "http://localhost:3000/health" |
  ConvertTo-Json -Depth 10

Invoke-WebRequest `
  -UseBasicParsing `
  -Uri "http://localhost:3000/metrics" |
  Select-Object StatusCode, Content
~~~

Expected metric families:

- `http_requests_total`
- `http_request_duration_seconds`
- `http_response_cache_total` after cache outcomes exist

## Unmatched Route Cardinality

~~~powershell
$token = [Guid]::NewGuid().ToString("N")
$pathA = "/observability-smoke/$token/a"
$pathB = "/observability-smoke/$token/b"

foreach ($path in @($pathA, $pathB)) {
  try {
    Invoke-WebRequest `
      -UseBasicParsing `
      -Uri ("http://localhost:3000{0}" -f $path) `
      -TimeoutSec 5 | Out-Null
  } catch {
    [int]$_.Exception.Response.StatusCode
  }
}

$metrics = (Invoke-WebRequest `
  -UseBasicParsing `
  -Uri "http://localhost:3000/metrics").Content

$metrics -split "`n" |
  Where-Object {
    $_ -match 'route="__unmatched__".*status_code="404"'
  }

$metrics.Contains($pathA)
$metrics.Contains($pathB)
~~~

Expected:

- Both requests return `404`.
- The counter uses `route="__unmatched__"`.
- Both final Boolean checks are `False`.

## Prometheus Target

~~~powershell
$targets = Invoke-RestMethod `
  -Uri "http://localhost:9090/api/v1/targets"

$targets.data.activeTargets |
  Where-Object {
    $_.labels.job -eq "pulsegate-api-gateway"
  } |
  Select-Object scrapeUrl, health, lastError
~~~

Expected target:

- `http://api-gateway:3000/metrics`
- `health = up`

## Grafana Runtime

~~~powershell
Invoke-RestMethod "http://localhost:3002/api/health" |
  ConvertTo-Json -Depth 10

$token = [Convert]::ToBase64String(
  [System.Text.Encoding]::ASCII.GetBytes("admin:admin")
)
$headers = @{ Authorization = "Basic $token" }

Invoke-RestMethod `
  -Uri "http://localhost:3002/api/datasources/uid/pulsegate-prometheus/health" `
  -Headers $headers |
  ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Uri "http://localhost:3002/api/dashboards/uid/pulsegate-api-gateway-overview" `
  -Headers $headers |
  Select-Object -ExpandProperty dashboard |
  Select-Object title, uid, @{ Name = "panelCount"; Expression = { $_.panels.Count } }
~~~

Expected:

- Grafana database health is `ok`.
- Datasource status is `OK`.
- Dashboard UID is `pulsegate-api-gateway-overview`.
- Panel count is `5`.

## Bounded k6 Smoke

~~~powershell
npm run test:k6:smoke
~~~

The tracked smoke contract is bounded to:

- 1 VU
- 10 iterations
- 30-second maximum duration
- 5-second graceful stop
- 2-second request timeout
- readiness retry before smoke traffic
- `rate==0` for smoke request failures
- p95 smoke duration below 1000 ms
- all checks passing

Override the gateway base URL only when needed:

~~~powershell
$env:K6_BASE_URL = "http://api-gateway:3000"
npm run test:k6:smoke
Remove-Item Env:K6_BASE_URL
~~~

Do not point this lightweight script at production without a separate explicit load-test plan.

## Stop the Stack

~~~powershell
docker compose down
~~~

Do not add `-v` unless local PostgreSQL, Prometheus, and Grafana volumes are intentionally being removed.


<!-- SPRINT-73-TRACING-RUNBOOK-START -->
## OpenTelemetry tracing validation

Sprint 73 tracing is a local instrumentation foundation. Runtime sampling is AlwaysOff and no exporter or collector is configured, so production validation focuses on packaging, HTTP behavior, propagation safety, and structured-log correlation. Deterministic span assertions are covered by automated tests.

### Automated validation

```powershell
npm.cmd run test --workspace api-gateway
npm.cmd run test --workspace product-service
npm.cmd run typecheck
npm.cmd run build
```

Expected Sprint 73 baseline:

- API Gateway: 158 test files / 1160 tests.
- Product Service: 2 test files / 8 tests.

### Docker Compose runtime validation

```powershell
docker compose up -d postgres redis

docker compose run --rm --no-deps --entrypoint npm product-service `
  --prefix apps/product-service run db:migrate:deploy

docker compose run --rm --no-deps --entrypoint npm api-gateway `
  --prefix apps/api-gateway run db:migrate:deploy

docker compose up -d product-service api-gateway
```

Validate health and one traced proxy request:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/health

$traceId = "4bf92f3577b34da6a3ce929d0e0e4736"

Invoke-WebRequest `
  -UseBasicParsing `
  -Uri http://127.0.0.1:3000/api/product-service/health `
  -Headers @{
    traceparent = "00-$traceId-00f067aa0ba902b7-01"
    tracestate  = "vendor=value"
    baggage     = "credential=must-not-propagate"
  }
```

Expected:

- All three requests return HTTP 200.
- Responses do not expose `traceparent`, `tracestate`, or `baggage`.
- The proxy response remains the Product Service health contract.

Check Gateway correlation:

```powershell
docker compose logs `
  --no-color `
  --since 5m `
  api-gateway |
  Select-String `
    -Pattern "4bf92f3577b34da6a3ce929d0e0e4736|spanId"
```

Expected:

- The fixed trace ID appears on the proxy request completion log.
- `spanId` is a 16-character lowercase hexadecimal value.
- Baggage content and credentials do not appear in logs.

Cleanup:

```powershell
docker compose down --remove-orphans
```

### Tracing boundaries

- Runtime spans are not exported because the sampler is AlwaysOff and no exporter exists.
- Do not add raw headers, credentials, bodies, query values, request IDs, user identifiers, or raw URLs to span attributes.
- Traces are not quota, analytics, billing, routing, health, or authentication truth.
- Kubernetes manifests are unchanged; render validation is sufficient for Sprint 73 unless an explicit cluster-runtime validation is separately approved.
<!-- SPRINT-73-TRACING-RUNBOOK-END -->
