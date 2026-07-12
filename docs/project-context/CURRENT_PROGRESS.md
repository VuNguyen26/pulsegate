# Current Progress

## Canonical state after Sprint 72

- Product/documentation version: `v1.12.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: **Sprint 72 - Kubernetes runtime validation and deployment documentation**.
- Latest implementation commit before documentation finalization: `c6229f4091ae4c70b5ee4964b57559f9f47a049d`.
- Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 72 creates no Git tag.
- Next sprint: **Sprint 73 - OpenTelemetry tracing foundation**.

## Sprint 72 implementation commit

- `c6229f4091ae4c70b5ee4964b57559f9f47a049d` - `fix(runtime): include gateway workspace dependencies`

## Delivered behavior

- Validated the Sprint 71 Kustomize foundation on Docker Desktop Kubernetes.
- Applied local PostgreSQL, Redis, Secrets, and ordered migration Job.
- Applied Product Service, API Gateway, Admin Dashboard, and Developer Portal workloads.
- Validated application probes, ClusterIP Services, EndpointSlices, internal DNS, HTTP surfaces, and bounded port-forward access.
- Corrected API Gateway production image workspace dependency packaging.
- Validated Gateway pod replacement and process restart behavior.
- Expanded the Kubernetes local runbook with actual rollout, troubleshooting, rollback, and cleanup guidance.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 155 test files / 1140 tests.
- Developer Portal: 2 test files / 7 tests.
- Root release validation passed.
- Docker Desktop context: `docker-desktop`.
- Kubernetes: v1.32.2.
- Base render: 13 resources.
- Local bootstrap render: 10 resources.
- Local applications render: 13 resources.
- PostgreSQL, Redis, and four application Deployments: 1/1 Ready.
- Migration Job: Complete.
- Product Service migrations: 1.
- API Gateway migrations: 11.
- In-cluster HTTP checks: 8 passed.
- Port-forward HTTP checks: 7 passed.
- Gateway replacement pod: new UID, Ready, zero restarts, HTTP 200.

## Preserved boundaries

- Docker Compose remains supported.
- One application replica each; no HA claim.
- Gateway health remains process-local and per pod.
- No Kubernetes API discovery or distributed health state.
- No Ingress, NodePort, LoadBalancer, public database, or public Redis.
- No ServiceAccount, RBAC, PVC, StatefulSet, Helm, GitOps, cloud platform, or service mesh.
- PostgreSQL and Redis remain ephemeral.
- No production secret-management claim.
- No resource requests/limits without measurements.
- No OpenTelemetry, Loki, billing, marketplace, or enterprise IAM.
- No npm package version bump.
- No Sprint 72 Git tag.

## Fixed roadmap

- Sprint 61 - Admin Dashboard foundation - complete.
- Sprint 62 - Dashboard consumers/API keys/usage plans - complete.
- Sprint 63 - Dashboard quota/usage/rejected events - complete.
- Sprint 64 - Dashboard rollup/retention/scheduler panels - complete.
- Sprint 65 - Developer Portal foundation - complete.
- Sprint 66 - Developer Portal API docs and API-key self-service foundation - complete.
- Sprint 67 - Host-based routing foundation - complete.
- Sprint 68 - Weighted routing foundation - complete.
- Sprint 69 - Service discovery foundation - complete.
- Sprint 70 - Service discovery health/failover hardening - complete.
- Sprint 71 - Kubernetes foundation - complete.
- Sprint 72 - Kubernetes runtime validation and deployment documentation - complete.
- Sprint 73 - OpenTelemetry tracing foundation - next.
- Sprint 74 - Loki logging foundation.
- Sprint 75 - Grafana observability integration.
- Sprint 76 - Platform RBAC/security hardening.
- Sprint 77 - UI state and responsive polish.
- Sprint 78 - E2E demo and bounded k6 validation.
- Sprint 79 - v2 docs, runbooks, and architecture cleanup.
- Sprint 80 - v2.0.0 release; no new feature scope.