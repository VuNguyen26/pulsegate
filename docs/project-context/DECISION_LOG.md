# Decision Log

## Scope

This file is a compact index of important decisions.

Detailed decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.34.0

## Latest Completed Sprint

Sprint 33 - Rollup Scheduler Runner Design

---

## Recent Decisions

### 2026-07-07 - Analytics rollup scheduler runner starts as preview-only boundary

Decision:

- Add a scheduler runner contract/model after the schedule preview foundation exists.
- Convert schedule plans into dry-run backfill request contracts.
- Expose npm run analytics:rollup:scheduler-preview as a DB-free operator-facing preview command.
- Keep the command preview-only and non-destructive.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service or execute backfill.
- Do not read raw events or persist rollups from the scheduler preview command.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- A scheduler runner boundary should be visible and testable before any real background execution exists.
- Dry-run request contracts make future backfill wiring explicit without coupling preview to persistence.
- Keeping the command DB-free allows runtime validation without Docker/PostgreSQL while preserving source separation and quota safety.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-runner-design.md

---

### 2026-07-06 - Analytics rollup scheduling starts as preview-only foundation

Decision:

- Add rollup schedule planning contracts before any real background scheduler exists.
- Add a schedule preview summary with explicit safety fields.
- Add an operator-facing npm run analytics:rollup:schedule-preview command.
- Keep the command DB-free and preview-only.
- Do not create scheduled/background jobs.
- Do not read raw events or persist rollups from the schedule preview command.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- Scheduled rollups need a clear operator-visible planning boundary before background execution is introduced.
- Previewing the intended window and safety flags reduces the risk of accidentally coupling scheduling to persistence or quota behavior.
- Keeping the command DB-free allows runtime command validation without Docker/PostgreSQL while preserving source separation.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-rollup-scheduling-foundation.md

---

### 2026-07-06 - Analytics retention operator preview command fails fast before DB candidate reads

Decision:

- Harden npm run analytics:retention:operator-preview after exposing the DB-backed operator preview command.
- Preserve non-destructive safety fields in output and tests.
- Validate execution args before DB-backed candidate reads.
- Reject invalid execute-only flags such as dry-run hard-delete-limit before reading candidate counts.
- Lock usage text and safety wording with tests.
- Do not call deleteCandidates.
- Do not wire the Prisma delete repository into the operator preview command.
- Do not expose a retention execute command, delete API, scheduled job, or quota path in Sprint 31.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- The operator preview command is operator-facing and DB-backed, so unsafe CLI input should fail before touching PostgreSQL candidate reads.
- The Prisma delete repository foundation exists, so the preview command must keep an explicit non-destructive boundary.
- Locking JSON safety and usage contracts reduces future regression risk before any retention execution design is considered.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-hardening.md

---

### 2026-07-06 - Analytics retention operator preview command stays read-only and non-destructive

Decision:

- Expose npm run analytics:retention:operator-preview as an operator-facing preview command.
- Use the existing Prisma candidate read repository for count-only DB-backed candidate counts.
- Build output through the candidate-read execution service preview and operator preview output model.
- Return explicit safety flags including commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- Support execute-preview args for guard inspection without enabling delete execution.
- Keep the existing analytics:retention:execution-preview command DB-free with deleteImplementationAvailable=false.
- Do not call deleteCandidates.
- Do not wire the Prisma delete repository into the operator preview command.
- Do not expose a retention execute command, delete API, scheduled job, or quota path in Sprint 30.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Operators need DB-backed candidate counts before any destructive retention execution is considered.
- A dedicated operator preview command validates the service orchestration layer against PostgreSQL while keeping deletion unavailable.
- Explicit safety fields make accidental destructive behavior visible in the output contract.
- Keeping delete repository wiring out of the command protects raw analytics data and quota correctness.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-command.md

---

### 2026-07-06 - Analytics retention execution service orchestration stays non-destructive

Decision:

- Add service-level retention execution preview orchestration after repository safety primitives exist.
- Compose retention policy, plan, execution args, execution guard, delete batch plan, delete operation plan, and optional repository preparation.
- Add a compact service summary model for future operator preview output.
- Add a candidate count loader that normalizes count-only candidate read repository output.
- Add candidate-read preview composition over the existing read-only candidate repository.
- Keep service previews from calling deleteCandidates.
- Keep the existing analytics:retention:execution-preview command DB-free with deleteImplementationAvailable=false.
- Do not expose a retention execute command, delete API, scheduled job, or quota path in Sprint 29.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- The bounded Prisma delete repository exists, so service-level orchestration must remain preview-first and non-destructive.
- Count-only candidate loading lets future operator previews show realistic planning data without deleting raw events.
- A summary model provides a safer output contract before any command or API wiring is considered.
- Keeping delete execution unavailable protects quota correctness and raw analytics event separation.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-execution-service-orchestration-preview.md

---

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
