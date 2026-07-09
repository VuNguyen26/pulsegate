# Analytics Retention Execution Service Preview Runbook

## Scope

This runbook documents the backend-only analytics retention execution service preview foundation added in Sprint 29.

It is not an operator command runbook.

There is currently no retention execute command, delete API, scheduled job, or UI action that calls deleteCandidates through this service.

---

## Current Status

Implemented foundations:

- Execution service preview.
- Execution service summary model.
- Candidate count loader.
- Candidate-read execution preview composition.
- Unit tests for dry-run, blocked execute, source-specific planning, candidate count loading, repository prepare preview, and summary output.

Still unavailable:

- No operator-facing retention execute command.
- No retention delete API.
- No scheduled/background retention delete job.
- No production delete workflow.

---

## Service Preview Flow

The service preview composes:

1. Retention policy input.
2. Retention plan.
3. Execution args.
4. Execution guard.
5. Candidate counts.
6. Delete batch plan.
7. Delete operation plan.
8. Optional repository prepare operation.
9. Safe preview and summary output.

Candidate-read preview composition can load counts from the existing candidate read repository before building the service preview.

---

## Safety Model

The Sprint 29 service preview must remain non-destructive.

Required safety conditions:

- Usage and rejected candidates stay separated.
- Candidate count loading is count-only.
- Prepared repository operations are candidate recheck previews only.
- deleteCandidates is not called by the service preview.
- destructiveExecutionPerformed remains false.
- executionResults remain empty in preview-only flows.
- Existing analytics:retention:execution-preview command remains DB-free and reports deleteImplementationAvailable=false.
- No quota path uses retention preview or repository delete primitives.

---

## Validation Commands

Run automated validation:

    npm run test
    npm run typecheck
    npm run build

Run targeted service preview tests:

    npm run test --workspace api-gateway -- analytics-retention-execution-service.test.ts
    npm run test --workspace api-gateway -- analytics-retention-execution-service-summary.test.ts
    npm run test --workspace api-gateway -- analytics-retention-execution-candidate-count-loader.test.ts
    npm run test --workspace api-gateway -- analytics-retention-execution-service-candidate-read-preview.test.ts

Expected result:

- Targeted tests pass.
- Full tests pass.
- Typecheck passes.
- Build passes.
- No raw events are deleted.

---

## Current Guardrails

Do not wire service preview to destructive operator execution until a separate design is approved.

Do not call deleteCandidates from an operator-facing command, API, scheduled job, or quota path.

Do not use retention service preview for quota counting.

Do not use retention service preview from runtime summary APIs.

Do not merge usage and rejected event retention paths.

---

## Related Runbooks

- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-delete-repository.md

## Sprint 56 Execute Contract Review Output

Sprint 56 promotes `executeContractReview` into the retention execution service preview contract.

The service preview now returns review-only execute contract output together with policy, plan, execution args, execution guard, delete batch plan, delete operation plan, prepared operation previews, and summary data.

Important boundaries:

- Service preview may prepare repository operation previews through candidate recheck logic.
- Service preview still does not call `deleteCandidates`.
- `executionResults` remain empty in preview-only flows.
- `destructiveExecutionPerformed=false`.
- `executeContractReview.summary.allowed=false`.
- `executeContractReview.safety.deletesRawEvents=false`.
- `executeContractReview.safety.affectsQuotaCounting=false`.
- `executeContractReview.safety.runsRetentionExecution=false`.

Candidate recheck can be visible as a ready review guardrail when a repository preparation executor is injected, but that still does not authorize destructive execution.

## Sprint 57 Fail-Closed Preparation Output

Sprint 57 hardens retention execution service preview output.

New service preview summary output:

- `preparedOperationErrors[]`
- per-source `preparedOperationError`

If candidate recheck preparation fails, the service preview returns fail-closed output instead of allowing delete execution.

The fail-closed preparation error includes:

- `source`
- `requestedLimit`
- `message`
- `failClosedReason=CANDIDATE_RECHECK_PREPARATION_FAILED`
- `deleteAllowed=false`

The service preview remains non-destructive:

- It does not call `deleteCandidates`.
- It does not delete raw events.
- It does not mutate quota counting.
- It does not expose a retention execute command, delete API, or scheduled delete job.
- `destructiveExecutionPerformed=false`.
