# Analytics Rollup Read Runbook

## Scope

This runbook covers the read-only analytics rollup endpoint added in Sprint 25.

Endpoint:

- GET /internal/admin/analytics/rollups

The endpoint is intended for internal/admin inspection of analytics rollup tables. It remains the direct rollup inspection endpoint. Selected usage and rejected summary APIs can also opt in to rollup read-model summaries with `rollupSummaryRuntimeRead=true`, while default summary behavior remains raw-event summary.

---

## Prerequisites

Start the local Docker stack:

cd E:\pulsegate

docker compose up -d --build

Deploy API Gateway migrations into the Docker Postgres database:

docker compose exec -T api-gateway npm run db:migrate:deploy --workspace api-gateway

Confirm rollup tables exist:

docker compose exec -T postgres psql -U pulsegate -d pulsegate -c "select table_schema, table_name from information_schema.tables where table_schema = 'gateway' and table_name like '%rollups%' order by table_name;"

Expected tables:

- gateway.api_usage_rollups
- gateway.api_rejected_rollups

---

## Base Query

Required query parameters:

- source: usage or rejected.
- from: inclusive requested ISO timestamp.
- to: exclusive requested ISO timestamp.
- granularity: hour or day.

Optional query parameters:

- limit
- routePath
- routeMethod
- statusCode
- apiKeyAuthSource
- apiKeyId
- consumerId
- cacheStatus for usage rollups only
- rejectionReason for rejected rollups only

---

## Usage Rollup Read

cd E:\pulsegate

$BaseUrl = "http://localhost:3000"
$AdminKey = "local-admin-key"

Invoke-RestMethod "$BaseUrl/internal/admin/analytics/rollups?source=usage&from=2026-07-05T00:00:00.000Z&to=2026-07-06T00:00:00.000Z&granularity=day&limit=10" `
  -Method GET `
  -Headers @{ "x-admin-api-key" = $AdminKey } | ConvertTo-Json -Depth 30

Expected result:

- HTTP 200.
- data.source is usage.
- data.granularity matches the request.
- data.window contains requested and rebuild window fields.
- data.items is an array.
- count can be 0 when no rollup rows exist.

---

## Rejected Rollup Read

cd E:\pulsegate

$BaseUrl = "http://localhost:3000"
$AdminKey = "local-admin-key"

Invoke-RestMethod "$BaseUrl/internal/admin/analytics/rollups?source=rejected&from=2026-07-05T00:00:00.000Z&to=2026-07-06T00:00:00.000Z&granularity=day&limit=10" `
  -Method GET `
  -Headers @{ "x-admin-api-key" = $AdminKey } | ConvertTo-Json -Depth 30

Expected result:

- HTTP 200.
- data.source is rejected.
- data.granularity matches the request.
- data.window contains requested and rebuild window fields.
- data.items is an array.
- count can be 0 when no rollup rows exist.

---

## Missing Admin Key Validation

cd E:\pulsegate

$BaseUrl = "http://localhost:3000"

try {
  Invoke-RestMethod "$BaseUrl/internal/admin/analytics/rollups?source=usage&from=2026-07-05T00:00:00.000Z&to=2026-07-06T00:00:00.000Z&granularity=day" `
    -Method GET `
    -ErrorAction Stop | ConvertTo-Json -Depth 20
} catch {
  $_.Exception.Response.StatusCode.value__
}

Expected result:

- HTTP 401.

---

## Invalid Source-Specific Filter Validation

cacheStatus is only valid for usage rollups.

cd E:\pulsegate

$BaseUrl = "http://localhost:3000"
$AdminKey = "local-admin-key"

try {
  Invoke-RestMethod "$BaseUrl/internal/admin/analytics/rollups?source=rejected&from=2026-07-05T00:00:00.000Z&to=2026-07-06T00:00:00.000Z&granularity=day&cacheStatus=HIT" `
    -Method GET `
    -Headers @{ "x-admin-api-key" = $AdminKey } `
    -ErrorAction Stop | ConvertTo-Json -Depth 20
} catch {
  $_.Exception.Response.StatusCode.value__
}

Expected result:

- HTTP 400.
- Error code is INVALID_QUERY_PARAMETER.

---

## Operational Notes

- Run db:migrate:deploy when a local Docker database is missing analytics rollup tables.
- Empty items are valid when no rollup rows exist yet.
- The endpoint reads rollup tables only.
- Existing summary APIs still default to raw-event summary. Selected bounded consumer usage, API key usage, and rejected summary reads can opt in to rollup read models with `rollupSummaryRuntimeRead=true`; unsupported, unbounded, missing, empty, failed, or source-mismatched rollup reads fall back to raw-event summary.
- Quota counting still uses gateway.api_usage_events.
- Do not use this endpoint as proof that retention deletion is safe.
- Do not delete raw events until a retention safety sprint explicitly implements and validates that behavior.

---

## Related Files

- apps/api-gateway/src/analytics/analytics-rollup-read-query.ts
- apps/api-gateway/src/analytics/analytics-usage-rollup-read.repository.ts
- apps/api-gateway/src/analytics/analytics-rejected-rollup-read.repository.ts
- apps/api-gateway/src/analytics/analytics-rollup-read-service.ts
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts
- apps/api-gateway/src/app.ts
- apps/api-gateway/prisma/schema.prisma

## Summary API Runtime Read Opt-In

Sprint 53 adds an opt-in summary runtime-read path that reuses the rollup read repositories.

Selected endpoints:

- `GET /internal/admin/usage/consumers/:consumerId/summary`
- `GET /internal/admin/usage/api-keys/:apiKeyId/summary`
- `GET /internal/admin/api-rejections/summary`

Behavior:

- Default summary requests still use raw-event summary repositories.
- Add `rollupSummaryRuntimeRead=true` to request a rollup read-model summary.
- Provide bounded `from` and `to` query parameters for the runtime rollup path.
- Usage summary runtime reads use `gateway.api_usage_rollups`.
- Rejected summary runtime reads use `gateway.api_rejected_rollups`.
- Empty, missing, unsupported, unbounded, failed, or source-mismatched rollup reads fall back to raw-event summary.
- `rollupSummaryPreview=true` remains a separate preview output flag.
- Quota counting remains raw-event/runtime request based and does not use rollup tables.

## Sprint 54 Scheduler Boundary Note

Sprint 54 does not change rollup read APIs or selected summary runtime reads.

- ollupSummaryRuntimeRead=true remains the only summary runtime read switch.
- Scheduler preview ackgroundScheduler output does not control summary API runtime reads.
- Background scheduler contracts do not read rollup repositories and do not change raw-summary fallback behavior.

## Sprint 55 Scheduler Runtime Boundary Note

Sprint 55 does not change this feature path.

The sprint only opens a guarded direct CLI `process-local` + `dry-run` scheduler runtime path for analytics rollup service invocation. It does not add scheduled/background jobs, external scheduler execution, execute mode expansion, quota mutation, raw event deletion, or retention execution.

<!-- pulsegate:sprint-64-dashboard-visibility:start -->
## Sprint 64 Dashboard visibility

The Admin Dashboard now exposes read-only /rollups, /scheduler, and /retention operator views. These views do not open scheduler execution or retention deletion. Use docs/runbooks/admin-dashboard-analytics-operations.md for endpoint, safety, and troubleshooting guidance.
<!-- pulsegate:sprint-64-dashboard-visibility:end -->
