# Sprint 26 - Analytics Retention Safety Foundation

## Status

Complete.

## Version

v0.27.0

## Goal

Add a safe foundation for future analytics event retention without deleting raw events, changing quota counting, or switching existing runtime analytics to rollup reads.

## Scope

Sprint 26 intentionally focused on dry-run safety:

- Parse retention policy inputs.
- Keep usage and rejected retention sources separate.
- Compute safe cutoff plans.
- Count candidate raw events read-only.
- Expose a dry-run command for operator preview.
- Reject execute mode.
- Preserve quota correctness.

Out of scope:

- Raw event deletion.
- Retention execute mode.
- Scheduled/background retention job.
- Summary API switch to rollup reads.
- Quota checker changes.
- Usage recorder changes.
- Rejected event recorder changes.
- New migrations.

---

## Commits

- 2c0faa8 feat(gateway): add analytics retention policy parser
- fec3333 feat(gateway): add analytics retention candidate reader
- 20548dc feat(gateway): add analytics retention dry-run service
- de1825b feat(gateway): add analytics retention dry-run args parser
- ba972fa feat(gateway): add analytics retention dry-run command

---

## Checkpoints

### 26.1 - Analytics Retention Policy Parser / Plan Model

Added:

- Retention source model: usage, rejected, both.
- Dry-run-only mode model.
- Separate usage and rejected retention day windows.
- Default disabled policy.
- Minimum retention day guardrail.
- Retention cutoff plan generation.
- Unit tests for valid, invalid, disabled, and cutoff behavior.

Safety:

- Pure TypeScript.
- No DB reads.
- No DB writes.
- No deletion.
- No migration.

### 26.2 - Analytics Retention Candidate Read Repository

Added:

- Read-only candidate count repository.
- Counts gateway.api_usage_events older than usage cutoff.
- Counts gateway.api_rejected_events older than rejected cutoff.
- Skips DB reads when retention is disabled.
- Keeps output dryRunOnly=true and deleteAllowed=false.
- Unit tests with mocked Prisma delegates.

Safety:

- SELECT/count only.
- No deletion.
- Usage and rejected events stay separate.

### 26.3 - Analytics Retention Dry-Run Service

Added:

- Service orchestration for policy parsing, plan creation, and candidate reads.
- Dry-run result shape containing policy, plan, candidates, dryRunOnly, and deleteAllowed.
- Unit tests for enabled, disabled, invalid policy, and invalid clock paths.

Safety:

- No DB wiring inside service.
- No delete path.
- No execute mode.

### 26.4 - Analytics Retention Dry-Run Command Args Parser

Added:

- CLI args parser for future dry-run command.
- Usage text.
- Support for --enabled, --source, --mode, --usage-retention-days, and --rejected-retention-days.
- Support for --key value and --key=value.
- Validation for unknown args, missing values, invalid booleans, invalid sources, invalid mode, and invalid integer day values.

Safety:

- Parser only.
- No DB.
- No command execution.
- No package script change in this checkpoint.

### 26.5 - Analytics Retention Dry-Run Command

Added:

- npm script: analytics:retention:dry-run.
- Command file that wires Prisma candidate reader and dry-run service.
- JSON preview output.
- Direct-run error handling with usage text.
- Manual validation against local Docker PostgreSQL.

Safety:

- Command only supports dry-run.
- Execute mode is rejected.
- Command only counts candidate events.
- No raw event deletion.

---

## Final Validation

Automated validation:

- npm run test -> 80 test files passed, 551 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.

DB/runtime command validation:

- docker compose up -d postgres -> postgres running.
- npm run db:migrate:deploy --workspace api-gateway -> 7 migrations found, no pending migrations.
- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled false -> returned disabled dry-run JSON.
- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90 -> returned usage candidateCount with deleteAllowed=false.
- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source rejected --rejected-retention-days 90 -> returned rejected candidateCount with deleteAllowed=false.
- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90 -> returned usage and rejected candidate counts with deleteAllowed=false.
- npm run analytics:retention:dry-run --workspace api-gateway -- --mode execute -> failed safely and printed usage text.

Final git state before docs:

- HEAD/origin/main: ba972fa feat(gateway): add analytics retention dry-run command
- Working tree clean.

---

## Current Behavior After Sprint 26

Retention dry-run command:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

Command output includes:

- policy
- plan
- candidates
- dryRunOnly=true
- deleteAllowed=false

Retention behavior:

- Disabled by default.
- Dry-run only.
- Source can be usage, rejected, or both.
- Usage and rejected retention windows are separate.
- Candidate counts are read-only.
- execute mode is rejected.
- Raw events are not deleted.

---

## Safety Boundaries Preserved

- gateway.api_usage_events remains source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains source of truth for rejected/security traffic.
- Rollup tables are not used for quota counting.
- Existing usage and rejected summary APIs still read raw event tables.
- No retention delete path exists.
- No scheduled/background job exists.
- Quota checker was not changed.
- Usage recorder was not changed.
- Rejected event recorder was not changed.

---

## Recommended Next Sprint

Sprint 27 - Analytics Retention Execution Guardrails

Recommended scope:

- Design explicit retention execution mode.
- Add hard delete limits.
- Recheck candidate counts before delete.
- Keep usage and rejected retention execution separate.
- Require explicit operator intent.
- Preserve quota correctness.
- Avoid summary API or recorder changes unless explicitly selected.
