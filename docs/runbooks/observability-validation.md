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

<!-- SPRINT-74-OBSERVABILITY-RUNBOOK-START -->
## Sprint 74 Loki logging validation

### Scope

Sprint 74 validates structured backend stdout collection through Grafana Alloy into Loki.

Collected services are limited to:

- API Gateway
- Product Service

### Expected Loki labels

Every accepted backend stream must contain exactly:

- `service`
- `level`
- `event`

The following values must remain in the JSON body and must not become labels:

- request ID
- trace ID
- span ID

### Runtime checks

1. Start API Gateway, Product Service, Loki, and Alloy through Docker Compose.
2. Confirm API Gateway and Product Service health return HTTP 200.
3. Confirm Loki `/ready` returns `ready`.
4. Confirm Alloy `/-/ready` reports ready.
5. Send requests with explicit bounded request IDs.
6. Query Loki by the fixed `service` label.
7. Locate the matching JSON body by request ID.
8. Confirm request ID, trace ID, and span ID are present in the body.
9. Confirm stream labels are exactly `event`, `level`, and `service`.
10. Stop Loki and Alloy.
11. Confirm API Gateway and Product Service health still return HTTP 200.
12. Restart Loki and Alloy and confirm both recover.

### Security checks

Reject validation when any stream label contains:

- request ID
- trace ID
- span ID
- raw request path
- raw URL
- API key
- JWT
- credential
- database URL
- Redis credential
- Kubernetes Secret
- free-form exception message

### Deployment checks

- Product Service migration deploy shall report 1 migration and no pending migration.
- API Gateway migration deploy shall report 11 migrations and no pending migration.
- Kustomize render counts shall remain 13 base, 10 local bootstrap, and 13 local applications.
- Cluster apply is not required when the configured Kubernetes API is unreachable.
- Do not automatically enable or reconfigure the user-owned Kubernetes cluster.

### Storage boundary

Loki filesystem storage is local/development-only.

This validation does not establish production retention, durability, replication, backup, restore, capacity, or high availability.

<!-- SPRINT-75-RUNBOOK-START -->
## Sprint 75 Grafana and Loki validation

### Provisioned resources

Grafana provisions:

- Prometheus datasource UID `pulsegate-prometheus`.
- Loki datasource UID `pulsegate-loki`.
- Metrics dashboard UID `pulsegate-api-gateway-overview`.
- Logs dashboard UID `pulsegate-logs-overview`.
- Folder `PulseGate`.

The Loki datasource uses proxy access to `http://loki:3100`, is non-default, and is read-only because it is provisioned from source control. Loki has no public host port.

### Logs dashboard

The dashboard contains four panels:

1. Log Volume by Service.
2. Recent Higher-Severity Logs.
3. Recent Structured Logs.
4. Correlation and Security Boundary.

Variables are limited to `service`, `level`, and `event`. The two logs panels use a maximum of 100 lines. The default dashboard range is 15 minutes.

### Label and correlation boundary

The exact stored label allowlist is `service`, `level`, and `event`.

`requestId`, `traceId`, and `spanId` remain JSON body fields and must not become labels or dashboard variables.

For a bounded correlation search in Grafana Explore, select one fixed service, use a short time range, and apply a body filter containing the exact correlation identifier.

### Dashboard polling

The provider uses `updateIntervalSeconds: 30`. This forces polling rather than relying on filesystem watch events that may not propagate through Docker Desktop bind mounts.

After changing provider configuration, restart only Grafana. Later dashboard additions, updates, and deletions should be detected by polling without another restart.

### Outage and recovery validation

1. Record container IDs and start times.
2. Stop only Alloy and Loki.
3. Confirm API Gateway, Product Service, Grafana, and Prometheus remain running.
4. Confirm application health remains HTTP 200.
5. Confirm Prometheus queries still work.
6. Confirm the Loki datasource becomes unavailable.
7. Confirm structured stdout still contains fresh request IDs.
8. Start Loki and wait for datasource health.
9. Start Alloy and confirm its process is running.
10. Generate fresh requests and verify their logs reach Loki through Alloy.
11. Confirm unaffected containers were not restarted or recreated.

Use process state plus fresh end-to-end log transport as the authoritative Alloy recovery proof. Do not depend on a guessed readiness string.

### Security boundary

Do not expose API keys, JWTs, authorization headers, cookies, request or response bodies, database or Redis credentials, Secret values, arbitrary header maps, or raw exception objects.

Grafana and Loki remain operational tooling. They are not authentication, authorization, quota, billing, analytics, routing, failover, or audit sources of truth.

### Kubernetes boundary

Sprint 75 changes no Kubernetes manifest and collects no Kubernetes workload logs. Static Kustomize rendering proves deployment compatibility.

### Sprint 76 handoff

Sprint 76 may harden Admin RBAC and platform security after auditing the current authentication, authorization, credential, actor-attribution, browser-exposure, and fail-closed boundaries.

Do not change Grafana, Loki, Alloy, Prometheus, tracing, routing, quota, or analytics behavior merely to implement Admin security.
<!-- SPRINT-75-RUNBOOK-END -->
