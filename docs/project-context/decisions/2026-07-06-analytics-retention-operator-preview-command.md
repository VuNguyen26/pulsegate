# Decision: Analytics Retention Operator Preview Command

Date: 2026-07-06

## Status

Accepted.

## Context

Sprint 29 added service-level analytics retention execution preview orchestration and candidate-read preview composition.

The bounded Prisma delete repository foundation already exists behind guardrails, but it is destructive if called from an operator-facing flow incorrectly.

Operators need a way to inspect retention planning with real DB-backed candidate counts before any destructive retention execution is considered.

## Decision

Expose a non-destructive operator-facing preview command:

    npm run analytics:retention:operator-preview --workspace api-gateway -- [options]

The command will:

- Parse retention policy and execution preview args.
- Use the Prisma candidate read repository for count-only candidate reads.
- Build the Sprint 29 candidate-read execution service preview.
- Map the result into an operator preview output model.
- Print JSON with explicit safety fields.

The command will not:

- Call deleteCandidates.
- Wire the Prisma delete repository.
- Delete raw usage events.
- Delete raw rejected events.
- Add a retention execute command.
- Add a delete API.
- Add a scheduled/background retention delete job.
- Change quota counting.
- Change usage recording.
- Change rejected event recording.
- Switch summary APIs to rollup reads.

## Required Safety Output

The command output must include:

- commandDeletesEvents=false
- candidateReadOnly=true
- deleteRepositoryExecuted=false
- deleteAllowed=false
- destructiveExecutionPerformed=false

Top-level output must also keep:

- deleteAllowed=false
- destructiveExecutionPerformed=false

Execute-preview args may be accepted for guard inspection, but they must not enable destructive deletion.

## Consequences

Positive:

- Operators can inspect retention execution planning with real PostgreSQL candidate counts.
- Candidate counts remain source-separated for usage and rejected events.
- Runtime validation now covers the service orchestration layer through an operator command.
- The project moves closer to production-style retention operations without exposing deletion.

Tradeoffs:

- The command introduces a DB runtime path and requires DATABASE_URL for enabled previews.
- It adds one more retention command that must be documented clearly to avoid confusing preview with execution.

Risks controlled:

- Delete repository remains unwired.
- deleteCandidates remains unavailable from operator-facing flow.
- Safety flags make non-destructive behavior explicit.
- Existing quota, usage recorder, rejected recorder, and summary API behavior remain unchanged.
