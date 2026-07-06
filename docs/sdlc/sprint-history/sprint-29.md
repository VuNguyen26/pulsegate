# Sprint 29 - Analytics Retention Execution Service Orchestration Preview

## Status

Complete.

## Version

v0.30.0

## Goal

Add a service-level orchestration preview for future analytics retention execution while keeping destructive operator controls unavailable.

Sprint 29 intentionally did not add a retention execute command, delete API, scheduled job, migration, quota integration, or operator-facing raw event deletion.

---

## Commits

- d5e6dbc feat(gateway): add analytics retention execution service preview
- 332c371 feat(gateway): add analytics retention execution service summary
- 7f5ab5e feat(gateway): add analytics retention execution candidate count loader
- 52bae70 feat(gateway): add analytics retention candidate-read execution preview

---

## Checkpoints

### 29.1 - Analytics Retention Execution Service Preview

Added a service-level preview model that composes retention policy parsing, retention plan creation, execution args parsing, execution guard evaluation, delete batch planning, delete operation planning, and optional repository prepare operation.

The service preview returns safe flags including dryRunOnly, deleteAllowed, deleteImplementationAvailable, executionResults, and destructiveExecutionPerformed=false.

No command, API, Prisma delete wiring, scheduled job, migration, or raw event deletion was added.

### 29.2 - Analytics Retention Execution Service Summary

Added a compact summary mapper for service preview output.

The summary includes enabled status, mode, selected source, generatedAt, hardDeleteLimit, safety flags, totals, reasons, source-level summaries, and prepared operation safety summaries when available.

The summary is non-destructive and does not execute repository deletes.

### 29.3 - Analytics Retention Execution Candidate Count Loader

Added a candidate count loader that uses the existing count-only candidate read repository.

The loader calls summarizeCandidates(plan), normalizes usage and rejected candidate counts, preserves source separation, rejects mismatched or invalid candidate summaries by reason, and keeps dryRunOnly=true and deleteAllowed=false.

No delete repository, command, API, job, migration, quota path, or recorder path was changed.

### 29.4 - Analytics Retention Candidate-Read Execution Preview

Added a candidate-read preview composition layer.

The composition builds retention policy and plan, loads count-only candidates, builds service preview with loaded candidate counts, optionally prepares repository operations for candidate recheck preview, and does not call deleteCandidates.

This provides the backend foundation for a future non-destructive operator-facing preview command.

---

## Final Validation

Automated validation:

- npm run test -> 93 test files / 646 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime/DB validation:

- No new Docker/runtime validation was required in Sprint 29 because no command, API, migration, scheduled job, or operator-facing delete execution was added.
- Latest DB/runtime validation remains Sprint 28: migration deploy had no pending migrations, retention dry-run was DB-backed and deleteAllowed=false, and execution preview reported deleteImplementationAvailable=false.

---

## Safety Notes

Sprint 29 added service-level orchestration around existing retention primitives, but it remains preview-only.

Still not implemented:

- No retention execute command.
- No retention delete API.
- No scheduled/background retention delete job.
- No operator-facing call to deleteCandidates.
- No quota path uses retention repository.
- No summary API uses rollup tables.
- No migration or schema change.

Preserved:

- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Usage and rejected event retention paths stay separate.
- Usage recorder, rejected event recorder, and quota checker were not changed.
- The existing analytics:retention:execution-preview command remains DB-free and reports deleteImplementationAvailable=false.

---

## Documentation Updated

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-29.md
- docs/runbooks/analytics-retention-execution-service-preview.md
- docs/project-context/decisions/2026-07-06-analytics-retention-execution-service-orchestration-preview.md

---

## Recommended Next Sprint

Sprint 30 - Analytics Retention Execution Operator Preview Command

Recommended scope:

- Add a non-destructive operator-facing command around the Sprint 29 service orchestration layer.
- Use count-only candidate read repository access.
- Keep deleteCandidates unavailable from operator-facing flows.
- Do not expose destructive execution until command/API semantics, runtime validation, rollback expectations, and operator controls are explicitly designed.

