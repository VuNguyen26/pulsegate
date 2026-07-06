# Sprint 31 - Analytics Retention Execution Operator Preview Hardening

## Status

Complete.

## Version

v0.32.0

## Summary

Sprint 31 hardened the DB-backed analytics retention operator preview command introduced in Sprint 30.

The sprint focused on safety contract tests, usage text contract tests, and fail-fast command boundary behavior.

The command remains non-destructive.

No retention execute command, delete API, scheduled delete job, migration, quota path change, usage recorder change, rejected recorder change, or summary API rollup switch was added.

## Commits

- b636f8b test(gateway): harden retention operator preview safety contract
- 0102674 test(gateway): document retention operator preview safety usage
- d1a4054 fix(gateway): fail fast invalid retention operator preview execution args
- eb738be test(gateway): lock retention operator preview usage format

## Checkpoints

### Checkpoint 31.1 - Operator Preview Safety Contract Tests

Added stronger safety contract coverage for the operator preview output and command JSON.

Validated that preview output remains non-destructive across safe and incomplete execute-preview scenarios.

Key safety fields stayed locked:

- commandDeletesEvents=false
- candidateReadOnly=true
- deleteRepositoryExecuted=false
- deleteAllowed=false
- destructiveExecutionPerformed=false

### Checkpoint 31.2 - Operator Preview Usage Text Contract

Hardened operator preview usage documentation and tests.

Added examples for:

- disabled preview
- usage-only preview
- rejected-only preview
- both-source preview
- execute-preview inspection

The usage text explicitly documents that the command prints an operator preview only and does not call deleteCandidates.

### Checkpoint 31.3 - Fail-Fast Invalid Execution Args

Added command boundary validation so invalid execution args are rejected before DB-backed candidate reads.

Covered cases:

- confirmation without execute mode
- hard delete limit in dry-run mode
- unsafe confirmation value

This checkpoint found that invalid execution args previously reached the candidate read repository before rejection. The command now validates execution args immediately after splitting CLI args and before building the candidate-read service preview.

### Checkpoint 31.4 - Usage Format Contract

Locked the operator preview usage text format for --hard-delete-limit <n>.

This was test-only and prevents future regression in CLI usage formatting.

## Validation

Automated validation:

- npm run test -> 95 test files / 659 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.

Targeted validation:

- analytics-retention-operator-preview-output.test.ts passed.
- analytics-retention-operator-preview.command.test.ts passed.

Docker/PostgreSQL runtime validation:

- docker compose up -d postgres -> PostgreSQL became healthy.
- npm run db:migrate:deploy --workspace api-gateway -> 7 migrations found, no pending migrations.
- analytics:retention:operator-preview --enabled false -> passed.
- analytics:retention:operator-preview usage preview -> passed.
- analytics:retention:operator-preview rejected preview -> passed.
- analytics:retention:operator-preview both execute-preview -> passed.
- analytics:retention:operator-preview invalid dry-run hard-delete-limit -> failed safely with exit code 1.

Runtime safety output preserved:

- commandDeletesEvents=false
- candidateReadOnly=true
- deleteRepositoryExecuted=false
- deleteAllowed=false
- destructiveExecutionPerformed=false

## Files Changed

Runtime code:

- apps/api-gateway/src/analytics/analytics-retention-operator-preview.command.ts

Tests:

- apps/api-gateway/src/analytics/analytics-retention-operator-preview-output.test.ts
- apps/api-gateway/src/analytics/analytics-retention-operator-preview.command.test.ts

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/runbooks/analytics-retention-operator-preview.md
- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-hardening.md
- docs/sdlc/sprint-history/sprint-31.md

## Safety Notes

Sprint 31 did not expose destructive retention execution.

The operator preview command still:

- Reads candidate counts only.
- Uses the Prisma candidate read repository.
- Does not call deleteCandidates.
- Does not wire the Prisma delete repository.
- Does not delete raw usage events.
- Does not delete raw rejected events.
- Does not affect quota counting.
- Does not affect usage recording.
- Does not affect rejected event recording.
- Does not switch summary APIs to rollup reads.

## Recommended Next Sprint

Sprint 32 recommended directions:

- Rollup Scheduling Foundation
- Analytics Retention Execution Design Review

Retention execution should remain unavailable until command semantics, operator controls, rollback expectations, and runtime validation are explicitly designed and approved.
