# Decision: Analytics Retention Execute Contract Review

## Date

2026-07-09

## Status

Accepted

## Context

Retention execution is destructive because it may delete raw analytics events. Earlier sprints added dry-run, execution guardrails, repository safety primitives, service preview, and operator preview, but no operator-facing execute command exists.

Sprint 56 needed to make the execute contract visible without opening deletion.

## Decision

Add a review-only `executeContractReview` contract and expose it through retention preview outputs.

The review reports:

- Operator confirmation status.
- Hard delete limit status.
- Candidate recheck expectation.
- Rollback expectation.
- Audit output expectation.
- Safety flags for delete wiring, raw event deletion, quota counting, background jobs, and retention execution.

`executeContractReview.summary.allowed` remains `false`.

## Consequences

- Execution preview JSON includes `executeContractReview`.
- Service preview JSON includes `executeContractReview`.
- Operator preview JSON includes `executeContractReview`.
- Command usage text documents the review-only output.
- Operator preview can show ready confirmation/hard-delete-limit/candidate-recheck guardrails without permitting destructive execution.
- Retention execute remains unavailable.

## Validation

Validation passed with:

- 133 test files / 956 tests passed.
- Typecheck passed.
- Build passed.

Docker/PostgreSQL runtime validation was not required because Sprint 56 did not add a new DB runtime path or destructive execution path.

## Boundaries

This decision does not authorize:

- Retention execute command.
- Retention delete API.
- Scheduled retention delete job.
- Calling `deleteCandidates` from an operator-facing flow.
- Wiring the Prisma retention delete repository into command/API/job execution.
- Quota mutation.
- Raw event deletion.
- Rollup summary changes.
- Admin UI.