# Sprint 15 - Usage Plans and Quota Foundation

## Status

Done.

## Version

v0.16.0

## Goal

Add the first Usage Plans and Quota foundation for PulseGate API Management.

Sprint 15 builds on:

- Sprint 13 API consumers and issued API keys.
- Sprint 14 API usage event tracking and usage summary APIs.

The main goal is to define usage plans, assign plans to API keys, and enforce simple runtime quotas using the existing event-based usage tracking foundation.

---

## Scope Completed

Sprint 15 completed:

- Usage plan schema.
- Usage plan migration.
- Usage plan quota window enum.
- API key usage plan assignment column.
- Admin usage plan management APIs.
- API key usage plan assignment API.
- Usage quota checker.
- DAILY and MONTHLY UTC quota window calculation.
- Event-based quota counting from gateway.api_usage_events.
- Runtime quota enforcement in the downstream proxy preHandler.
- 429 QUOTA_EXCEEDED response when quota is exhausted.
- Focused tests.
- Full repository validation.
- Docker runtime quota validation.

---

## Checkpoints

### Checkpoint 15.1 - Usage Plan Schema Foundation

Added:

- gateway.usage_plans table.
- UsagePlanQuotaWindow enum.
- api_keys.usage_plan_id nullable relation.
- Prisma relation between ApiKey and UsagePlan.

Migration:

- apps/api-gateway/prisma/migrations/20260704042342_add_usage_plans/migration.sql

Commit:

- c8894fb feat(gateway): add usage plan schema

Validation:

- prisma validate passed.
- prisma migrate status passed.
- npm run test passed.
- npm run typecheck passed.
- npm run build passed.

---

### Checkpoint 15.2 - Usage Plan Admin APIs

Added:

- GET /internal/admin/usage-plans
- POST /internal/admin/usage-plans
- GET /internal/admin/usage-plans/:id
- PATCH /internal/admin/usage-plans/:id

Added usage plan module:

- usage-plan-management.types.ts
- usage-plan-management.mapper.ts
- usage-plan-management.repository.ts
- admin-usage-plan.route.ts

Commit:

- d7beb13 feat(gateway): add usage plan admin APIs

Validation:

- Focused usage plan route and mapper tests passed.
- Full test/typecheck/build passed.

---

### Checkpoint 15.3 - Assign Usage Plans to API Keys

Added:

- PATCH /internal/admin/api-keys/:id/usage-plan

Behavior:

- Assign usage plan with usagePlanId string.
- Unassign usage plan with usagePlanId null.
- Return 404 API_KEY_NOT_FOUND when key is missing.
- Return 404 USAGE_PLAN_NOT_FOUND when plan is missing.
- Include usagePlanId in API key responses.

Commit:

- e78c560 feat(gateway): assign usage plans to api keys

Validation:

- 42 test files passed.
- 304 tests passed.
- npm run typecheck passed.
- npm run build passed.

---

### Checkpoint 15.4 - Runtime Quota Enforcement

Added:

- UsageQuotaChecker.
- Event-based quota evaluation.
- DAILY quota window.
- MONTHLY quota window.
- Runtime quota check for DB-backed API keys with assigned usage plans.
- 429 QUOTA_EXCEEDED response.

Runtime behavior:

- DB-backed API keys with enabled usage plans are quota-enforced.
- API keys without usage plans are not quota-enforced.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
- Public routes are not quota-enforced.
- Quota check runs before cache/proxy execution.

Commit:

- be44473 feat(gateway): enforce usage plan quotas

Validation:

- 44 test files passed.
- 314 tests passed.
- npm run typecheck passed.
- npm run build passed.
- Docker runtime quota validation passed.

---

## Runtime Validation Summary

Docker runtime validation proved:

- API Gateway and Product Service start successfully.
- Gateway migrations are applied.
- Admin API can create API consumer.
- Admin API can issue DB-backed API key.
- Admin API can create usage plan with quotaLimit=1 and quotaWindow=DAILY.
- Admin API can assign usage plan to API key.
- Valid DB-backed API key plus valid JWT can call GET /api/products.
- First GET /api/products returns 200.
- Second GET /api/products returns 429 QUOTA_EXCEEDED.

Expected over-quota response:

    {
      "error": {
        "code": "QUOTA_EXCEEDED",
        "message": "API key quota has been exceeded for the current quota window.",
        "requestId": "..."
      }
    }

Runbook:

- docs/runbooks/usage-plans-and-quotas.md

---

## Final Validation

Latest final validation:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime quota validation -> passed

Automated test result:

- 44 test files passed
- 314 tests passed

---

## Important Files

Schema and migration:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/prisma/migrations/20260704042342_add_usage_plans/migration.sql

Usage plan management:

- apps/api-gateway/src/usage-plans/usage-plan-management.types.ts
- apps/api-gateway/src/usage-plans/usage-plan-management.mapper.ts
- apps/api-gateway/src/usage-plans/usage-plan-management.repository.ts
- apps/api-gateway/src/routes/admin-usage-plan.route.ts

API key usage plan assignment:

- apps/api-gateway/src/api-keys/api-key-management.types.ts
- apps/api-gateway/src/api-keys/api-key-management.mapper.ts
- apps/api-gateway/src/api-keys/api-key-management.repository.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts

Runtime quota enforcement:

- apps/api-gateway/src/usage-plans/usage-quota-checker.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts
- apps/api-gateway/src/routes/product-proxy.route.ts
- apps/api-gateway/src/app.ts

Tests:

- apps/api-gateway/src/usage-plans/usage-plan-management.mapper.test.ts
- apps/api-gateway/src/routes/admin-usage-plan.route.test.ts
- apps/api-gateway/src/api-keys/api-key-management.mapper.test.ts
- apps/api-gateway/src/routes/admin-api-key.route.test.ts
- apps/api-gateway/src/usage-plans/usage-quota-checker.test.ts
- apps/api-gateway/src/proxy/downstream-proxy-quota.test.ts

---

## Decisions Made

### Attach usage plans to API keys first

Usage plan assignment is currently API key-level.

Reason:

- Runtime request context already has apiKeyId.
- API key-level quota is easier to validate first.
- Consumer-level inheritance can be added later.

### Keep quota event-based first

Quota uses gateway.api_usage_events as source of truth.

Reason:

- Reuses Sprint 14 foundation.
- Keeps behavior auditable.
- Avoids premature Redis counter or rollup complexity.

### Enforce after auth and before cache/proxy

Quota check happens after API key/JWT validation and before cache/proxy execution.

Reason:

- Invalid requests should not consume quota.
- Cache HIT should still be quota-controlled for DB-backed keys with plans.
- Over-quota requests should not reach downstream services.

---

## Current Limitations After Sprint 15

- Quota-denied requests are not recorded as usage events yet.
- Failed auth requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Quota usage summary APIs are not implemented yet.
- Quota usage Grafana panels are not implemented yet.
- Redis quota counters are not implemented yet.
- Aggregate rollup table is not implemented yet.
- Retention policy is not implemented yet.
- Env fallback API keys are not quota-enforced.
- Disabled usage plans currently skip quota enforcement.

---

## Recommended Next Sprint

Sprint 16 - Quota Observability and Usage Management Hardening

Recommended scope:

- Add admin quota usage summary foundation.
- Add API key quota usage endpoint.
- Consider usage plan usage summary endpoint.
- Decide how to track quota-denied requests.
- Keep docs compact and move command-heavy validation into runbooks.