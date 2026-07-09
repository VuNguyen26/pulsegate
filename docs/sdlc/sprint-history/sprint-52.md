# Sprint 52 - Rollup Summary API Switch Preview

## Version

v0.53.0

## Summary

Sprint 52 added a guarded rollup summary API switch preview for selected admin summary APIs.

The sprint made a future rollup read-model switch observable without changing default runtime behavior. Summary APIs still use the raw-event summary path unless a caller explicitly requests preview output with `rollupSummaryPreview=true`.

Selected targets:

- consumer usage summary
- API key usage summary
- rejected events summary

## Commits

- e2939b3 feat(gateway): add rollup summary switch preview contract
- 5f02801 feat(gateway): add rollup summary query compatibility preview
- 49accd8 feat(gateway): add rollup summary switch preview output
- a5ab0d6 feat(gateway): add rollup summary preview request mapper
- c721faf feat(gateway): expose rollup summary preview on summary APIs
- 8eaa05e test(gateway): lock rollup summary preview guardrails

## Runtime Behavior

Default summary behavior remains unchanged:

- consumer usage summary returns the existing raw-event summary response
- API key usage summary returns the existing raw-event summary response
- rejected events summary returns the existing raw-event summary response

When `rollupSummaryPreview=true` is present, selected summary APIs include `rollupSummaryPreview` with:

- target
- status
- switch preview
- query compatibility
- fallback plan
- operator decision
- reviewer notes
- safety flags

Current preview output keeps fallback on `raw-event-summary` when rollup data state is unknown.

## Safety Boundaries

Sprint 52 preserved these safety boundaries:

- no default summary response change
- no rollup repository reads from summary API runtime paths
- no runtime switch applied
- no quota counting mutation
- no raw event deletion
- no rollup persistence from summary APIs
- no scheduler/background execution change
- no retention execution
- invalid queries reject before repository calls or preview output
- preview flag must be exactly `true`

## Validation

Final validation before docs:

- 114 test files passed
- 841 tests passed
- typecheck passed
- build passed
- git diff --check passed

Docker/PostgreSQL runtime summary preview validation passed:

- PostgreSQL healthy
- Redis healthy
- Prisma generate passed
- Prisma migrate deploy passed with no pending migrations
- product-service and api-gateway Docker build/start passed
- API Gateway health passed
- validation data seeded for one consumer, one API key, one usage event, and one rejected event
- default summary responses did not include `rollupSummaryPreview`
- consumer usage summary preview returned target `usage-consumer-summary`
- API key usage summary preview returned target `usage-api-key-summary`
- rejected summary preview returned target `rejected-summary`
- all preview outputs retained `raw-event-summary` fallback
- no runtime summary switch was applied

## Next Sprint

Sprint 53 - Switch selected summary reads to rollup read model with fallback