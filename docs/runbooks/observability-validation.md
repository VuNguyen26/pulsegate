# Observability and k6 Validation Runbook

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
