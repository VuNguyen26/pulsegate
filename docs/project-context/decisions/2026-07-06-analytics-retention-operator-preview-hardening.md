# Analytics Retention Operator Preview Hardening

Date: 2026-07-06

## Status

Accepted.

## Context

Sprint 30 exposed a DB-backed analytics retention operator preview command.

The command is intentionally non-destructive and reads candidate counts from PostgreSQL through the Prisma candidate read repository.

The Prisma delete repository foundation already exists behind guardrails, so the operator-facing preview command needs a very clear boundary: it must never become a delete path accidentally.

## Decision

Sprint 31 hardens the operator preview command without adding destructive retention execution.

The command and output contract now emphasize:

- Non-destructive safety fields remain explicit in JSON output.
- Invalid execution-only arguments are validated before DB-backed candidate reads.
- Dry-run mode rejects hard delete limit before the candidate read repository is called.
- Unsafe confirmation values are rejected before candidate reads.
- Usage text and option formatting are test-covered.
- Execute-preview arguments may be inspected, but they do not enable deletion.

Sprint 31 does not:

- Call deleteCandidates.
- Wire the Prisma delete repository into the operator preview command.
- Add a retention execute command.
- Add a retention delete API.
- Add a scheduled/background retention delete job.
- Change quota counting.
- Change usage recording.
- Change rejected event recording.
- Switch summary APIs to rollup reads.

## Validation

Final Sprint 31 validation:

- npm run test -> 95 test files / 659 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- Docker/PostgreSQL runtime validation passed for analytics:retention:operator-preview.
- Prisma migration deploy found 7 migrations and no pending migrations.
- Operator preview validation passed for disabled, usage, rejected, and both execute-preview modes.
- Invalid dry-run hard-delete-limit failed fast with exit code 1 before preview output.

## Consequences

Positive:

- Operator preview is safer before any future retention execution design.
- Invalid CLI input fails before unnecessary DB candidate reads.
- The non-destructive command boundary is locked by tests.
- Existing quota and analytics event separation remain unchanged.

Trade-offs:

- The command still does not execute deletion.
- Retention execution still requires a separate explicit design before any operator-facing destructive path exists.

## Related Files

- apps/api-gateway/src/analytics/analytics-retention-operator-preview.command.ts
- apps/api-gateway/src/analytics/analytics-retention-operator-preview.command.test.ts
- apps/api-gateway/src/analytics/analytics-retention-operator-preview-output.test.ts
- docs/runbooks/analytics-retention-operator-preview.md
- docs/sdlc/sprint-history/sprint-31.md
