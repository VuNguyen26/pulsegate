# Sprint 53 - Switch selected summary reads to rollup read model with fallback

## Version

v0.54.0

## Summary

Sprint 53 switched selected bounded summary reads to the analytics rollup read model behind an explicit runtime flag with raw-event-summary fallback.

The sprint kept default runtime behavior unchanged while adding a safe opt-in path for rollup reads on selected admin summary APIs.

Selected targets:

- consumer usage summary
- API key usage summary
- rejected events summary

## Commits

- d4f99b7 feat(gateway): add rollup summary runtime read decision
- 35f2099 feat(gateway): add rollup summary runtime decision mapper
- 7ebb3a9 feat(gateway): add rollup summary read model adapter
- 7d06559 feat(gateway): add rollup summary runtime read resolver
- 2472bd8 feat(gateway): add rollup summary read query mapper
- 7b8b2c9 feat(gateway): add rollup summary runtime read service seam
- 81cccf2 feat(gateway): wire usage summary rollup runtime reads
- 4ef4f0b feat(gateway): wire rejected summary rollup runtime reads

## Runtime Behavior

Default summary behavior remains unchanged:

- consumer usage summary returns the existing raw-event summary response
- API key usage summary returns the existing raw-event summary response
- rejected events summary returns the existing raw-event summary response

When `rollupSummaryRuntimeRead=true` is present, selected bounded summary APIs can read from rollup read models:

- consumer usage summary reads from `gateway.api_usage_rollups`
- API key usage summary reads from `gateway.api_usage_rollups`
- rejected events summary reads from `gateway.api_rejected_rollups`

Runtime rollup reads require compatible bounded query windows.

Fallback returns the raw-event summary response when:

- the runtime flag is absent
- the query is unbounded
- the query shape is unsupported
- rollup records are missing or empty
- the rollup read service fails
- the rollup read service returns the wrong source

`rollupSummaryPreview=true` remains preview output only and stays isolated from runtime read switching.

## Safety Boundaries

Sprint 53 preserved these safety boundaries:

- default summary response behavior remains raw-event summary
- runtime switch requires explicit `rollupSummaryRuntimeRead=true`
- preview output requires explicit `rollupSummaryPreview=true`
- existing summary response shape is preserved
- invalid queries reject before repository calls or preview/runtime output
- unsupported or unbounded runtime reads fall back to raw summary
- no quota counting mutation
- no raw event deletion
- no rollup persistence from summary APIs
- no scheduler/background execution change
- no retention execution
- no Admin UI work

## Validation

Final validation before docs:

- 122 test files passed
- 887 tests passed
- typecheck passed
- build passed
- git diff --check passed

Docker/PostgreSQL runtime usage summary validation passed:

- PostgreSQL healthy
- Redis healthy
- Prisma generate passed
- Prisma migrate deploy passed with no pending migrations
- product-service and api-gateway Docker build/start passed
- API Gateway health passed
- usage validation data seeded for one consumer, one API key, raw usage events, and usage rollup records
- default consumer usage summary returned raw-event totals
- default API key usage summary returned raw-event totals
- consumer usage summary returned rollup totals with `rollupSummaryRuntimeRead=true`
- API key usage summary returned rollup totals with `rollupSummaryRuntimeRead=true`
- unbounded consumer usage runtime-read request fell back to raw-event summary
- preview output did not appear unless explicitly requested

Docker/PostgreSQL runtime rejected summary validation passed:

- PostgreSQL healthy
- Redis healthy
- Prisma generate passed
- Prisma migrate deploy passed with no pending migrations
- product-service and api-gateway Docker build/start passed
- API Gateway health passed
- rejected validation data seeded for one consumer, one API key, raw rejected events, and rejected rollup records
- default rejected summary returned raw-event totals
- rejected summary returned rollup totals with `rollupSummaryRuntimeRead=true`
- unbounded rejected runtime-read request fell back to raw-event summary
- preview output did not appear unless explicitly requested
- when runtime and preview flags were both present, data used the runtime rollup path while preview output remained preview-only

## Next Sprint

Sprint 54 - Background Scheduler Contract/Runner