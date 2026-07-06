# Decision Log

## Scope

This file is a compact index of important decisions.

Detailed decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.29.0

## Latest Completed Sprint

Sprint 28 - Analytics Retention Execution Repository Safety Foundation

---

## Recent Decisions

### 2026-07-06 - Analytics retention delete repository primitives stay behind guardrails

Decision:

- Add repository-level retention delete safety primitives only after execution guardrails and delete batch planning existed.
- Add a repository safety contract that requires source, cutoff, requested limit, candidate recheck, and batch-plan safety.
- Add a repository port/executor that rechecks candidates before prepared delete execution.
- Add an operation planner that derives repository requests from retention plan cutoffs and delete batch max counts.
- Add a Prisma repository implementation that selects bounded candidate IDs before deleting.
- Keep usage and rejected event delete paths separate.
- Keep analytics:retention:execution-preview reporting deleteImplementationAvailable=false.
- Do not expose a retention execute command, API, scheduled job, or quota path in Sprint 28.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Retention deletion is destructive and must be built behind layered safety checks.
- Selecting bounded IDs before delete avoids unbounded cutoff-based deleteMany operations.
- Keeping the repository unexposed preserves operator safety while allowing focused unit and runtime validation.
- Maintaining event separation protects quota correctness and rejected/security traffic observability.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-delete-repository-safety.md

---

### 2026-07-06 - Analytics retention execution starts with guardrails and preview only

Decision:

- Add execution guard model before any delete repository or execute command.
- Require explicit execute mode, confirmation phrase, and hard delete limit for execute preview.
- Add execution preview composition over policy, plan, args, and guard decision.
- Add npm run analytics:retention:execution-preview command.
- Keep execution preview DB-free and delete-free.
- Return deleteImplementationAvailable=false from execution preview.
- Add delete batch plan model with candidate recheck requirement and one total hard delete cap.
- Do not delete raw usage or rejected events in Sprint 27.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Retention execution is destructive and must be guarded before any repository-level delete primitive exists.
- A DB-free execution preview lets operators inspect guard decisions without touching data.
- Candidate recheck and hard delete limits need to be modeled before implementing delete operations.
- Keeping usage and rejected paths separate preserves current data ownership and quota safety.

---

### 2026-07-05 - Analytics retention starts as dry-run-only safety foundation

Decision:

- Add retention policy parsing and a retention plan model before any delete execution.
- Keep usage and rejected retention policies separate.
- Add minimum retention day guardrails.
- Add a read-only candidate repository that counts rows older than computed cutoffs.
- Add a dry-run service that returns policy, plan, and candidate count output.
- Add a dry-run command exposed as npm run analytics:retention:dry-run.
- Return dryRunOnly=true and deleteAllowed=false in retention previews.
- Reject execute mode in Sprint 26.
- Do not delete raw usage or rejected events.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Retention can affect quota and analytics correctness if introduced too quickly.
- A dry-run-only command gives operators visibility into candidate impact before any destructive behavior exists.
- Keeping usage and rejected event retention separate preserves current data ownership and security/usage separation.
- Rejecting execute mode prevents accidental raw event deletion before explicit guardrails are designed.

---

### 2026-07-05 - Analytics rollup read model stays read-only and separate from summaries

Decision:

- Add a read-only analytics rollup query model.
- Add separate read repositories for usage rollups and rejected rollups.
- Add a small read service that dispatches by source.
- Expose GET /internal/admin/analytics/rollups for internal/admin rollup reads.
- Require source, from, to, and granularity.
- Support usage-specific cacheStatus filtering only for usage rollups.
- Support rejected-specific rejectionReason filtering only for rejected rollups.
- Keep existing usage and rejected summary APIs on raw event tables.
- Keep quota counting on gateway.api_usage_events.
- Do not add retention deletion or scheduled/background jobs in Sprint 25.

Reason:

- Rollup tables need an observable read path before retention work.
- A separate read-only endpoint validates rollup table access without changing existing analytics semantics.
- Keeping summary APIs event-based prevents accidental behavior changes.
- Keeping quota counting on raw successful usage events protects quota correctness.

---

### 2026-07-05 - Analytics rollup persistence uses separate tables and dimension hashes

Decision:

- Add separate rollup tables for successful usage and rejected/security traffic.
- Use dimensionHash as a stable unique upsert key for rollup persistence.
- Build dimensionHash from rollup dimensions only, not metrics.
- Keep usage and rejected rollup repositories separate.
- Add an internal persistence service that aggregates raw-shaped events and delegates to repositories.
- Do not switch runtime summary APIs to rollup reads in Sprint 23.
- Do not change quota counting, usage recording, rejected event recording, retention, or runtime APIs.

Reason:

- PostgreSQL unique constraints over nullable dimensions are not safe for idempotent rollup upserts because NULL values do not compare as equal.
- A dimension hash gives a stable upsert key across nullable dimensions.
- Separate usage and rejected rollup tables preserve existing data ownership and quota safety.
- Keeping runtime reads on raw event tables avoids silently changing analytics or quota behavior before a backfill strategy exists.

---

### 2026-07-05 - Analytics rollup foundation starts as code/test-only helpers

Decision:

- Add UTC time bucket helpers for future rollups.
- Add rollup window planner for partial bucket rebuild planning.
- Add usage event aggregate builder for future successful usage rollups.
- Add rejected event aggregate builder for future rejected/security traffic rollups.
- Keep helpers code/test-only in Sprint 22.
- Do not add migrations, rollup tables, retention jobs, backfill commands, runtime API changes, quota rewrites, or recorder rewrites.

Reason:

- Rollup and retention need careful foundations around time boundaries, backfill scope, partial recalculation, and quota correctness.
- Code/test-only helpers provide a safe foundation before persistence.
- Keeping successful usage and rejected/security event aggregation separate preserves current data ownership and quota safety.

---

### 2026-07-05 - Event investigation uses cursor pagination for large listings

Decision:

- Add cursor pagination to successful usage events listing.
- Add cursor pagination to rejected events listing.
- Use occurredAt and id as cursor fields because both listings sort by occurredAt desc and id desc.
- Return nextCursor in raw event listing pagination responses.
- Reject requests that combine offset and cursor.
- Reject cursor on rejected event summary because cursor is only meaningful for raw event listing.
- Do not change usage recording, rejected event recording, quota counting, migrations, retention jobs, or rollup tables.

Reason:

- Offset pagination becomes less efficient and less stable on larger event datasets.
- Cursor pagination improves admin investigation continuity without changing storage schema.
- Keeping this as read-only listing behavior protects quota correctness and event separation.

---

### 2026-07-04 - Successful usage event investigation uses read-only listing API

Decision:

- Add raw successful usage event listing over gateway.api_usage_events.
- Expose GET /internal/admin/usage/events.
- Use safe pagination with limit, offset, total, and hasNextPage.
- Support filters by time range, route, method, status code, cache status, auth source, API key, and consumer.
- Keep rejected/security traffic in gateway.api_rejected_events.
- Do not change quota counting, usage recorder behavior, retention jobs, rollup tables, or migrations.

Reason:

- Admins need raw successful usage investigation similar to rejected event drilldown.
- A read-only listing endpoint is enough for Sprint 20.
- Keeping successful usage and rejected/security traffic separate protects quota correctness.

---

### 2026-07-04 - Usage analytics retention and rollup remain design-only in Sprint 19

Decision:

- Add filtered successful usage summary APIs over gateway.api_usage_events.
- Keep retention and rollup as documented design direction in Sprint 19.
- Do not add retention jobs, aggregate rollup tables, or migrations yet.
- Keep successful usage events and rejected/security events separate.

Reason:

- Filtered summaries provide immediate admin analytics value.
- Retention and rollup need careful schema and lifecycle design before implementation.
- gateway.api_usage_events is still used for quota counting, so changes must not corrupt quota behavior.

Detailed record:

- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

### 2026-07-04 - Rejected event drilldown uses filterable read endpoints

Decision:

- Keep rejected event drilldown as read-only admin APIs over gateway.api_rejected_events.
- Add raw rejected event listing with safe pagination.
- Add filters to rejected events summary.
- Reuse the same query parser and filter model for rejected summary and listing APIs.
- Keep gateway.api_usage_events for successful proxy/cache usage and quota counting.

Reason:

- Admins need both aggregate and raw rejected traffic visibility.
- Filterable read endpoints are enough for Sprint 18 without introducing rollup tables.
- Keeping successful usage and rejected/security traffic separate protects quota correctness.

---

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

Detailed record:

- docs/project-context/decisions/2026-07-03-documentation-compaction.md

---

## Historical Decisions

See:

- docs/sdlc/sprint-history/
- docs/project-context/decisions/
