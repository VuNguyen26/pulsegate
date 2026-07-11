# Analytics Retention Execution Preview Runbook

## Scope

This runbook covers the analytics retention execution preview command added in Sprint 27.

The command is preview-only:
- It does not connect to Prisma.
- It does not connect to PostgreSQL.
- It does not delete raw analytics events.
- It reports deleteImplementationAvailable=false.

Use the existing analytics retention dry-run command when DB-backed candidate counts are needed.

---

## Command

    npm run analytics:retention:execution-preview --workspace api-gateway -- [options]

Options:
- --enabled <true|false>
- --source <usage|rejected|both>
- --usage-retention-days <n>
- --rejected-retention-days <n>
- --mode <dry-run|execute>
- --confirm-execute <confirmation>
- --hard-delete-limit <n>

Execute preview confirmation value:

    I_UNDERSTAND_ANALYTICS_RETENTION_DELETE

---

## Dry-Run Preview Example

    npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90

Expected safety signals:
- executionArgs.mode is dry-run.
- executionGuard.deleteAllowed is false.
- executionGuard.reasons includes DRY_RUN_MODE.
- deleteImplementationAvailable is false.

---

## Execute Preview Example

    npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100

Expected safety signals:
- executionArgs.mode is execute.
- executionArgs.confirmExecute is true.
- executionArgs.hardDeleteLimit is set.
- executionGuard.deleteAllowed may be true when guard flags are satisfied.
- deleteImplementationAvailable remains false.

Important:
- A guard-allowed execute preview is not a delete execution.
- Sprint 27 does not include a delete repository.
- Sprint 27 does not include a retention execute command.

---

## Safety Invariants

Retention execution preview must not:
- delete gateway.api_usage_events rows
- delete gateway.api_rejected_events rows
- affect quota counting
- use rollup tables for quota counting
- change usage recorder behavior
- change rejected event recorder behavior
- switch summary APIs to rollup reads

Quota remains based on gateway.api_usage_events.

Rejected/security traffic remains in gateway.api_rejected_events.

---

## Related Commands

DB-backed candidate dry-run:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"
    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90

Migration deploy before DB-backed validation:

    npm run db:migrate:deploy --workspace api-gateway

---

## Sprint

Added in:
- Sprint 27 - Analytics Retention Execution Guardrails

## Sprint 56 Execute Contract Review Output

Sprint 56 adds `executeContractReview` to retention execution preview JSON.

The review is operator-visible but still non-destructive:

- `executeContractReview.summary.allowed=false`
- `executeContractReview.summary.reviewOnly=true`
- `executeContractReview.summary.destructiveExecutionAllowed=false`
- `executeContractReview.guardrails.operatorConfirmationStatus` reports missing or ready.
- `executeContractReview.guardrails.hardDeleteLimitStatus` reports missing or ready.
- `executeContractReview.guardrails.candidateRecheckStatus` reports missing until a future approved execution design requires it.
- `executeContractReview.guardrails.rollbackExpectationStatus` remains missing until rollback expectation output is hardened.
- `executeContractReview.guardrails.auditOutputStatus` remains missing until audit output expectation is hardened.
- `executeContractReview.safety.deleteCandidatesWired=false`
- `executeContractReview.safety.prismaDeleteRepositoryWiredToOperatorFlow=false`
- `executeContractReview.safety.deletesRawEvents=false`
- `executeContractReview.safety.affectsQuotaCounting=false`
- `executeContractReview.safety.runsDestructiveExecution=false`

Execute preview remains a preview. It does not delete analytics events and does not call `deleteCandidates`.

## Sprint 57 Execute Expectation Hardening

Sprint 57 extends execution preview output with explicit expectation details:

- `executeContractReview.expectations.candidateRecheckExpectation`
- `executeContractReview.expectations.rollbackExpectation`
- `executeContractReview.expectations.auditOutputExpectation`

The output remains review-only:

- `executeContractReview.summary.allowed=false`
- `executeContractReview.summary.reviewOnly=true`
- `executeContractReview.summary.destructiveExecutionAllowed=false`
- `executeContractReview.safety.deleteCandidatesWired=false`
- `executeContractReview.safety.prismaDeleteRepositoryWiredToOperatorFlow=false`
- `executeContractReview.safety.deletesRawEvents=false`
- `executeContractReview.safety.affectsQuotaCounting=false`
- `executeContractReview.safety.runsDestructiveExecution=false`

The execution preview command still does not delete analytics events and still does not call `deleteCandidates`.

<!-- pulsegate:sprint-64-dashboard-visibility:start -->
## Sprint 64 Dashboard visibility

The Admin Dashboard now exposes read-only /rollups, /scheduler, and /retention operator views. These views do not open scheduler execution or retention deletion. Use docs/runbooks/admin-dashboard-analytics-operations.md for endpoint, safety, and troubleshooting guidance.
<!-- pulsegate:sprint-64-dashboard-visibility:end -->
