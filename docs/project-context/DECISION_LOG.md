# Decision Log

## Scope

This file is a compact index of important decisions.

Detailed decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.18.0

## Latest Completed Sprint

Sprint 17 - API Rejection Tracking and Rejected Events Observability

---

## Recent Decisions

### 2026-07-04 - Rejected requests use a separate table

Decision:

- Store failed auth, rate-limited, and quota-denied requests in gateway.api_rejected_events.
- Keep gateway.api_usage_events for successful proxy/cache usage and quota counting.
- Add admin summary endpoint for rejected request observability.

Reason:

- Quota enforcement counts gateway.api_usage_events.
- Recording rejected traffic in that table would risk corrupting quota counts.
- A separate table keeps usage analytics and security/rejection observability cleanly separated.

Detailed record:

- docs/project-context/decisions/2026-07-04-rejected-events-side-table.md

---

### 2026-07-04 - Quota-denied requests are not recorded into api_usage_events yet

Decision:

- Do not record 429 QUOTA_EXCEEDED requests into gateway.api_usage_events in Sprint 16.
- Keep gateway.api_usage_events as the source of truth for successful/proxied/cache-handler usage.
- Add quota metadata to 429 QUOTA_EXCEEDED responses instead.
- Defer rejected request tracking to a future sprint.

Reason:

- Quota checker currently counts gateway.api_usage_events.
- Recording denied requests into the same table without an event type/outcome field would corrupt quota counts.
- A future design should separate successful usage from rejected/security events or clearly classify events.

Detailed record:

- docs/project-context/decisions/2026-07-04-quota-denied-usage-event-tracking.md

---

### 2026-07-03 - Keep main documentation compact

Decision:

- Keep README, architecture overview, requirements, current progress, AI handoff, and decision log compact.
- Move detailed sprint history into docs/sdlc/sprint-history/.
- Move command-heavy validation into docs/runbooks/.
- Move long decisions into docs/project-context/decisions/.

Reason:

- Main docs were getting too large.
- Large docs make future AI handoff and maintenance slower.
- Compact role-based docs are easier to update safely.

---

### 2026-07-03 - Usage plans and quotas use event-based counting first

Decision:

- Use gateway.api_usage_events as the source of truth for initial quota enforcement.
- Support DAILY and MONTHLY quota windows.
- Enforce quota for DB-backed API keys with assigned enabled usage plans.
- Do not enforce quota for env fallback API keys.

Reason:

- Event-based counting reuses Sprint 14 usage tracking.
- It keeps Sprint 15/16 simpler and testable.
- Redis counters and aggregate rollups can be added later.

---

## Historical Decisions

See:

- docs/sdlc/sprint-history/
- docs/project-context/decisions/
