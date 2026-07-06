# Sprint 28 - Analytics Retention Execution Repository Safety Foundation

## Status

Complete.

## Version

v0.29.0

## Goal

Add repository-level safety foundations for future analytics retention execution while keeping destructive operator controls unavailable.

Sprint 28 intentionally did not add a retention execute command, API, scheduled job, or quota integration.

---

## Commits

- 7f19493 feat(gateway): add analytics retention delete repository safety contract
- 50f9ce4 feat(gateway): add analytics retention delete repository port
- 85b1106 feat(gateway): add analytics retention delete operation plan
- 0752b87 feat(gateway): add analytics retention prisma delete repository

---

## Checkpoints

### 28.1 - Analytics Retention Delete Repository Safety Contract

Added a pure TypeScript repository operation safety decision model.

The model blocks unsafe delete operations when:

- Delete batch plan is blocked.
- Requested source is not selected.
- Cutoff is invalid.
- Requested limit is invalid.
- Requested limit exceeds hard delete limit.
- Requested limit exceeds source max delete count.
- Candidate recheck has not completed.
- Candidate count before delete is invalid or zero.
- Requested limit exceeds rechecked candidate count.

No Prisma, PostgreSQL, command, API, or delete behavior was added in this checkpoint.

### 28.2 - Analytics Retention Delete Repository Port

Added a repository port and executor.

The executor enforces a two-step flow:

1. prepareDeleteOperation rechecks candidate count.
2. executePreparedDelete calls deleteCandidates only when safety decision is allowed.

Tests use a fake repository and verify blocked safety decisions do not call delete.

No Prisma implementation, command, API, or runtime delete behavior was added in this checkpoint.

### 28.3 - Analytics Retention Delete Operation Plan

Added a pure TypeScript operation planner that derives repository operation requests from:

- AnalyticsRetentionPlan
- AnalyticsRetentionDeleteBatchPlan

The planner uses retention source cutoffs and batch source max delete counts. It skips zero-sized source operations, keeps usage and rejected sources separate, and blocks source-plan mismatches.

No Prisma implementation, command, API, or runtime delete behavior was added in this checkpoint.

### 28.4 - Analytics Retention Prisma Delete Repository

Added a Prisma implementation behind the delete repository port.

Safety behavior:

- Counts candidates separately for usage and rejected sources.
- Refuses delete when safety decision is blocked.
- Refuses delete when source, cutoff, or limit does not match safety decision.
- Refuses delete when candidate recheck count is invalid or zero.
- Selects bounded candidate IDs first with take=limit.
- Deletes by id in selected IDs only.
- Does not perform unbounded cutoff deleteMany.
- Keeps usage and rejected delete paths separate.

The implementation is not wired into any operator-facing command, API, scheduled job, or quota path.

---

## Final Validation

Automated validation:

- npm run test -> 89 test files / 621 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime/DB validation:

- docker compose up -d postgres redis -> containers started or reused
- npm run db:migrate:deploy --workspace api-gateway -> 7 migrations found, no pending migrations
- analytics:retention:dry-run DB-backed both-source validation -> candidateCount=0 for usage and rejected, dryRunOnly=true, deleteAllowed=false
- analytics:retention:execution-preview execute-preview validation -> execution guard allowed, deleteImplementationAvailable=false

---

## Safety Notes

Sprint 28 added a Prisma repository capable of deleting bounded selected IDs, but it remains unexposed.

Still not implemented:

- No retention execute command.
- No retention delete API.
- No scheduled/background retention delete job.
- No quota path uses retention repository.
- No summary API uses rollup tables.
- No migration or schema change.

Preserved:

- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Usage and rejected event retention paths stay separate.
- Usage recorder, rejected event recorder, and quota checker were not changed.

---

## Documentation Updated

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-28.md
- docs/runbooks/analytics-retention-delete-repository.md
- docs/project-context/decisions/2026-07-06-analytics-retention-delete-repository-safety.md

---

## Recommended Next Sprint

Sprint 29 - Analytics Retention Execution Service Orchestration Preview

Recommended scope:

- Compose guard, batch plan, operation planner, candidate recheck, and repository executor at service level.
- Keep execution preview command delete-free unless explicitly approved.
- Do not expose destructive operator command until service-level behavior and runtime validation are explicitly designed.
