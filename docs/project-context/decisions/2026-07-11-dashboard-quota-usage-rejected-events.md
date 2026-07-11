# Dashboard quota, usage, and rejected-event read boundary

Date: 2026-07-11

Status: Accepted

Product/documentation version: `v1.3.0`.

## Context

Sprints 61-62 established a separate Admin Dashboard, a server-only read-only Admin credential, fixed GET-only BFF resources, strict DTO validation, and read views for consumers, API keys, usage plans, and route state.

Sprint 63 needed quota, successful usage, and rejected/security event investigation without creating a generic Admin API proxy, exposing full-access credentials, changing quota semantics, merging event stores, or opening scheduler/retention execution.

## Decision

Add dedicated Dashboard pages:

```txt
/usage-analytics
/rejected-events
```

Add only these fixed Dashboard BFF resources:

```txt
GET /api/admin/usage/consumers/:consumerId/summary
GET /api/admin/usage/api-keys/:apiKeyId/summary
GET /api/admin/api-keys/:apiKeyId/quota
GET /api/admin/usage-plans/:usagePlanId/usage-summary
GET /api/admin/usage/events
GET /api/admin/api-rejections/summary
GET /api/admin/api-rejections/events
```

The Dashboard server calls only corresponding fixed Gateway Admin GET endpoints with `ADMIN_READ_ONLY_API_KEY`.

## Query Contract

- Reject unknown and duplicate keys.
- Bound date windows to 31 days.
- Default event limit to 20 and cap it at 100.
- Bound identifiers, route paths, methods, status codes, cache states, rejection reasons, and cursors.
- Expose opaque cursor navigation only.
- Do not expose offset pagination.
- Do not expose rollup summary flags.

## Response Contract

- Validate exact keys and bounded arrays.
- Validate identity consistency for subject-specific results.
- Validate summary totals and cursor state.
- Keep successful usage and rejected/security DTOs separate.
- Treat rejected-event metadata as upstream-only input.
- Reject sensitive metadata.
- Remove metadata before producing the Dashboard DTO.
- Never render raw metadata.
- Normalize errors and use no-store responses.

## Data Semantics

- `gateway.api_usage_events` remains the source of truth for successful usage and quota counting.
- `gateway.api_rejected_events` remains the source of truth for rejected/security traffic.
- The Dashboard does not merge successful and rejected events.
- Rollups and metrics remain outside quota enforcement.

## Security

- `ADMIN_READ_ONLY_API_KEY` remains server-side only.
- Full-access `ADMIN_API_KEY` remains absent from the Dashboard.
- Browser input cannot select arbitrary methods, hosts, paths, targets, or headers.
- Fixed Admin URLs must use the configured Gateway origin and `/internal/admin/` path.
- No mutation controls are added.
- No generic proxy is added.

## Consequences

Positive:

- Operators gain bounded quota and event investigation.
- Shared analytics primitives are available for Sprint 64.
- Arbitrary rejected metadata does not enter the browser DTO.
- Existing quota and event semantics remain unchanged.

Trade-offs:

- Dashboard event navigation is cursor-only even though Gateway repositories also support offset.
- Dashboard summary requests intentionally do not expose the rollup runtime switch.
- Sprint 64 must add rollup/scheduler/retention views through new explicit resources rather than a generic proxy.

## Non-Goals

- No Gateway implementation change.
- No database schema or migration.
- No quota behavior change.
- No event recorder change.
- No scheduler execution expansion.
- No retention execution.
- No raw-event deletion.
- No Dashboard mutation.
- No enterprise IAM.
- No new Git tag.

## Validation

- Admin Dashboard: 38 test files / 200 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root tests, typecheck, build, Compose config, and diff checks passed.
- Next.js build exposed both pages and seven fixed BFF routes.
