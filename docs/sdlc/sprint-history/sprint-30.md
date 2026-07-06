# Sprint 30 - Analytics Retention Execution Operator Preview Command

## Status

Complete.

## Version

v0.31.0

## Goal

Expose a non-destructive operator-facing analytics retention preview command around the Sprint 29 service orchestration layer.

Sprint 30 intentionally did not add a retention execute command, delete API, scheduled job, migration, quota integration, or operator-facing raw event deletion.

---

## Commits

- 6607a63 feat(gateway): add analytics retention operator preview output
- 043ccf3 feat(gateway): add analytics retention operator preview command runner
- 13da66a feat(gateway): expose analytics retention operator preview command

---

## Checkpoints

### 30.1 - Analytics Retention Operator Preview Output

Added a command-facing operator preview output model.

The output combines the Sprint 29 service summary with candidate count loader details and explicit safety flags:

- commandDeletesEvents=false
- candidateReadOnly=true
- deleteRepositoryExecuted=false
- deleteAllowed=false
- destructiveExecutionPerformed=false

No command entrypoint, Prisma runtime path, delete repository wiring, migration, API, scheduled job, quota path, or raw event deletion was added in this checkpoint.

### 30.2 - Analytics Retention Operator Preview Command Runner

Added an injectable operator preview command runner.

The runner accepts argv, a candidateReadRepository dependency, and a logger. It splits policy and execution args, builds the candidate-read service preview, maps it into operator preview output, prints JSON, and returns the output for tests.

Tests used fake candidate read repositories and confirmed invalid args are rejected before candidate reads.

No Prisma DB runtime path, npm script, delete repository wiring, migration, API, scheduled job, quota path, or raw event deletion was added in this checkpoint.

### 30.3 - Analytics Retention Operator Preview Command Entrypoint

Exposed the operator preview command:

    npm run analytics:retention:operator-preview --workspace api-gateway -- [options]

The command uses the Prisma candidate read repository to load count-only candidate counts from PostgreSQL before building the operator preview output.

The command remains preview-only:

- It does not call deleteCandidates.
- It does not wire the Prisma delete repository.
- It does not delete raw analytics events.
- It does not create a retention execute command.
- It does not add an API or scheduled job.

---

## Final Validation

Automated validation:

- npm run test -> 95 test files / 653 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime/DB validation:

- docker compose up -d postgres redis -> passed
- npm run db:migrate:deploy --workspace api-gateway -> 7 migrations found, no pending migrations
- npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled false -> passed
- npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90 -> passed
- npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source rejected --rejected-retention-days 90 -> passed
- npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 -> passed
- npm run analytics:retention:operator-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100 -> passed

Runtime safety output confirmed:

- kind=analytics-retention-operator-preview
- candidateCountLoader.dryRunOnly=true
- candidateCountLoader.deleteAllowed=false
- safety.commandDeletesEvents=false
- safety.candidateReadOnly=true
- safety.deleteRepositoryExecuted=false
- safety.deleteAllowed=false
- safety.destructiveExecutionPerformed=false
- deleteAllowed=false
- destructiveExecutionPerformed=false

---

## Safety Notes

Sprint 30 exposed an operator preview command, but it remains non-destructive.

Still not implemented:

- No retention execute command.
- No retention delete API.
- No scheduled/background retention delete job.
- No operator-facing call to deleteCandidates.
- No Prisma delete repository wiring in the operator preview command.
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
- docs/sdlc/sprint-history/sprint-30.md
- docs/runbooks/analytics-retention-operator-preview.md
- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-command.md

---

## Recommended Next Sprint

Sprint 31 - Analytics Retention Execution Operator Preview Hardening or Rollup Scheduling Foundation

Recommended scope:

- Keep destructive retention execution unavailable unless explicitly approved.
- Option A: harden operator preview CLI ergonomics, JSON contract tests, and failure output.
- Option B: start a separate non-destructive scheduled rollup planning foundation.
- Preserve quota correctness and usage/rejected event separation.
