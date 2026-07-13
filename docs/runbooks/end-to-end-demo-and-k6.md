# End-to-End Demo and Lightweight k6 Runbook

## Scope

This runbook covers the bounded Sprint 78 local validation flow:

~~~text
Developer Portal /api-docs
  -> API Gateway /api/product-service/health
  -> Product Service /health
~~~

It does not cover production capacity, stress, soak, scalability, high availability, or SLO validation.

## Safety contract

- Local Docker Compose only.
- GET only.
- No API key, JWT, or Admin credential.
- No seed or destructive database action.
- No image build or pull during the approved runtime proof.
- No service restart or recreation during demo or k6 execution.
- Artifacts remain under `E:\pulsegate-artifacts`.
- Named volumes remain intact.
- Expected persistent evidence: eleven successful usage events and zero rejected events.

## Prerequisites

- Repository: `E:\pulsegate`.
- Clean `main` synchronized with `origin/main`.
- Docker Desktop and Docker Compose available.
- Required images already present locally.
- `ADMIN_API_KEY`, `ADMIN_READ_ONLY_API_KEY`, and `K6_BASE_URL` unset in the parent shell.

## Required services

- PostgreSQL
- Redis
- Product Service
- API Gateway
- Admin Dashboard
- Developer Portal

The approved proof starts these services with existing Compose definitions and `--no-build`.

## Demo execution

~~~powershell
cd E:\pulsegate

powershell.exe `
  -NoProfile `
  -ExecutionPolicy Bypass `
  -File scripts/demo-runtime.ps1 `
  -ArtifactDirectory E:\pulsegate-artifacts\sprint-78-demo
~~~

Expected result:

- Gateway health: 200.
- Product Service health: 200.
- Developer Portal API docs: 200.
- Admin Dashboard root: 200.
- Proxied Product Service health: 200.
- Proxied response: `service=product-service`, `status=ok`.
- Usage-event delta: 1.
- Rejected-event delta: 0.

## k6 execution

~~~powershell
cd E:\pulsegate
npm.cmd run test:k6:smoke
~~~

Approved scenario:

- 1 VU.
- 10 shared iterations.
- 30-second maximum duration.
- 5-second graceful stop.
- 2-second request timeout.

Expected result:

- 10/10 iterations complete.
- 30/30 checks pass.
- Failed smoke request rate: 0%.
- Smoke p95 below 1000 ms.
- Usage-event delta: 10.
- Rejected-event delta: 0.

The observed Sprint 78 smoke p95 was 34.19 ms. This value is evidence for one local run only and is not a production SLO.

## Runtime stability checks

Record container ID, image ID, state, and restart count before and after execution.

Required invariants:

- State remains `running`.
- Restart count remains `0`.
- Container ID remains unchanged.
- Image ID remains unchanged.
- Disposable k6 container count returns to its pre-run value.

## Database checks

Use PostgreSQL only to count bounded rows.

Selected usage route:

~~~text
/api/product-service/health
~~~

Expected deltas:

- Demo: usage `+1`, rejected `+0`.
- k6: usage `+10`, rejected `+0`.
- Release validation: usage `+0`, rejected `+0`.

Do not delete the eleven Sprint 78 usage rows.

## Artifact locations

- Demo summary: `E:\pulsegate-artifacts\sprint-78-demo`.
- Demo runtime log and summary: `E:\pulsegate-artifacts\sprint-78-runtime-validation`.
- k6 runtime log and summary: `E:\pulsegate-artifacts\sprint-78-k6-validation`.
- Release-readiness log and summary: `E:\pulsegate-artifacts\sprint-78-release-readiness`.
- Documentation finalization evidence: `E:\pulsegate-artifacts\sprint-78-documentation`.

Artifacts must not contain Admin keys, API keys, authorization headers, bearer tokens, fake issued-key prefixes, or raw response bodies.

## Scoped cleanup

After validation, remove only the six Sprint-started containers:

~~~powershell
docker compose rm `
  -f `
  -s `
  postgres `
  redis `
  product-service `
  api-gateway `
  admin-dashboard `
  developer-portal
~~~

Do not run `docker compose down -v`. Named volumes and bounded database evidence must remain.

## Failure handling

- Preserve successful evidence and currently running containers until the exact failure is diagnosed.
- Distinguish repository defects from helper-script or shell defects.
- Do not rerun demo or k6 blindly because each successful workload creates persistent usage events.
- Re-record the immediate database baseline before an approved retry.
- Keep the repository clean and do not patch generated artifact files into source control.
