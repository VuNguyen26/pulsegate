# Sprint 21 - Usage Analytics Cursor Pagination and Investigation Hardening

## Status

Complete.

## Version

v0.22.0

## Goal

Improve raw event investigation scalability by adding cursor pagination to successful usage events listing and rejected events listing.

This sprint intentionally avoided migrations, retention jobs, rollup tables, quota rewrites, usage recorder rewrites, and rejected event recorder rewrites.

---

## Checkpoints

### Checkpoint 21.1 - Usage Events Cursor Pagination Query Foundation

Implemented cursor parsing for:

- GET /internal/admin/usage/events

Behavior:

- cursor is optional.
- cursor is a base64url encoded JSON object.
- cursor payload contains occurredAt and id.
- cursor.occurredAt must be a valid ISO date-time string.
- cursor.id must be a non-empty string.
- offset cannot be used together with cursor.

Files:

- apps/api-gateway/src/api-usage/api-usage-events-listing-query.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing-query.test.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing.types.ts

---

### Checkpoint 21.2 - Usage Events Repository Cursor Pagination

Implemented cursor filtering over gateway.api_usage_events.

Cursor ordering follows existing listing sort:

- occurredAt desc
- id desc

Cursor condition:

- occurredAt < cursor.occurredAt
- or occurredAt = cursor.occurredAt and id < cursor.id

Files:

- apps/api-gateway/src/api-usage/api-usage-events-listing.repository.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing.repository.test.ts

---

### Checkpoint 21.3 - Usage Events Listing nextCursor Response

Added nextCursor to usage events listing pagination response.

Behavior:

- nextCursor is generated from the last item in the current page.
- nextCursor is null when hasNextPage is false.
- nextCursor is null when the page is empty.
- Existing filters and item fields remain unchanged.

Files:

- apps/api-gateway/src/api-usage/api-usage-events-listing.mapper.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing.mapper.test.ts
- apps/api-gateway/src/routes/admin-api-usage.route.test.ts

Commit:

- 2480b89 feat(gateway): add usage events cursor pagination

---

### Checkpoint 21.4 - Rejected Events Cursor Pagination Parity

Implemented matching cursor pagination for:

- GET /internal/admin/api-rejections/events

Behavior:

- rejected events listing supports cursor.
- rejected events listing returns nextCursor.
- offset cannot be used together with cursor.
- rejected events summary rejects cursor because cursor is only meaningful for raw listing.

Files:

- apps/api-gateway/src/api-rejections/api-rejected-events-listing-query.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing-query.test.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.repository.test.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.mapper.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.mapper.test.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.types.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.test.ts

Commit:

- b02482d feat(gateway): add rejected events cursor pagination

---

### Checkpoint 21.5 - Runtime Cursor Pagination Validation

Runtime validation proved:

- GET /health returns 200.
- Successful protected requests can generate usage events.
- Rejected requests can generate rejected events.
- GET /internal/admin/usage/events?limit=1 returns nextCursor.
- GET /internal/admin/usage/events?limit=1&cursor=<nextCursor> returns the next page.
- GET /internal/admin/usage/events?limit=1&offset=1&cursor=<nextCursor> returns 400 INVALID_QUERY_PARAMETER.
- GET /internal/admin/api-rejections/events?limit=1 returns nextCursor.
- GET /internal/admin/api-rejections/events?limit=1&cursor=<nextCursor> returns the next page.
- GET /internal/admin/api-rejections/events?limit=1&offset=1&cursor=<nextCursor> returns 400 INVALID_QUERY_PARAMETER.
- GET /internal/admin/api-rejections/summary?cursor=<nextCursor> returns 400 INVALID_QUERY_PARAMETER.

Runtime status:

- Passed.

---

### Checkpoint 21.6 - Final Compact Documentation

Updated compact docs and runbooks for Sprint 21.

Files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/runbooks/api-usage-analytics.md
- docs/runbooks/api-rejected-events.md
- docs/sdlc/sprint-history/sprint-21.md

---

## Validation

Final validation before documentation:

- npm run test -> 59 test files passed, 414 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime cursor pagination validation -> passed

---

## Design Safety

Preserved boundaries:

- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Rejected requests are not written into gateway.api_usage_events.
- Raw API keys, JWTs, and Authorization headers are not stored or returned.
- Quota checker behavior was not changed.
- Usage recorder behavior was not changed.
- Rejected event recorder behavior was not changed.

---

## Result

Sprint 21 completed cursor pagination hardening for raw successful and rejected event investigation.

Next recommended sprint:

- Sprint 22 - Analytics Retention/Rollup Implementation Foundation
