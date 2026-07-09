# Background Scheduler Contract/Runner

Date: 2026-07-09

## Decision

PulseGate will introduce background scheduler semantics through a DB-free contract/runner boundary before wiring any background runtime execution.

Sprint 54 adds:

- Background scheduler trigger contract for command, process-local, and external-scheduler.
- Background scheduler runner plan contract.
- Background scheduler operator output.
- ackgroundScheduler field in scheduler preview command JSON output.
- CLI usage text and tests confirming the output is operator-visible contract data only.

## Boundaries

The following remain intentionally unwired:

- Scheduled/background rollup job.
- Process-local runner loop.
- External scheduler runtime integration.
- Background dry-run invocation.
- Background execute invocation.
- Background AnalyticsRollupBackfillService.runBackfill call.
- Event reads from background triggers.
- Rollup persistence from background triggers.
- Quota counting mutation.
- Raw event deletion.
- Retention execution.

## Rationale

Background runtime execution has a higher safety risk than direct command execution. The contract/runner boundary makes trigger ownership, plan readiness, blocked reasons, runtime gates, and safety flags visible before any background runtime path exists.

Keeping command trigger owned by direct CLI semantics prevents background scheduler work from changing previously validated command dry-run and execute behavior.

## Validation

Sprint 54 validation passed:

- 126 test files.
- 923 tests.
- Typecheck.
- Build.
- git diff --check.

Docker/PostgreSQL runtime validation was not required because the sprint remained DB-free and did not add runtime background service calls.
