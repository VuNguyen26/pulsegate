# Current Progress

## Canonical state after Sprint 71

- Product/documentation version: `v1.11.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: **Sprint 71 - Kubernetes foundation**.
- Latest implementation commit before documentation finalization: `c171135e1d413e6d90d76aed7d83e279a12b8504`.
- Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 71 creates no Git tag.
- Next sprint: **Sprint 72 - Kubernetes runtime validation and deployment documentation**.

## Sprint 71 implementation commits

- `81f9a3f69c96b52c0489988e939706bd2671f6e0` - `feat(runtime): harden backend deployment entrypoints`
- `e77494ab9356ac5ba297a158e1e9150fe35c99fc` - `feat(kubernetes): add deployment manifest foundation`
- `5c8e50a8eb68a75cc50f84bfc2a831cd0c2d7e41` - `feat(kubernetes): add core application manifests`
- `c171135e1d413e6d90d76aed7d83e279a12b8504` - `feat(kubernetes): add local dependency composition`

## Delivered behavior

- Kustomize base plus local bootstrap and local application overlays.
- `pulsegate` namespace.
- One-replica Deployments and ClusterIP Services for the four applications.
- ConfigMap and Secret-reference boundaries.
- Existing HTTP endpoints used for startup, readiness, and liveness probes.
- Disabled service-account token mounting.
- Non-root application containers with `RuntimeDefault` seccomp, no privilege escalation, and dropped capabilities.
- Local-only PostgreSQL 16 and Redis 7 with ephemeral `emptyDir`.
- Explicit ordered migration Job.
- Production backend multi-stage Docker images.
- Compiled JavaScript production startup.
- Gateway Prisma runtime client copied into `dist`.
- Product Service migration deploy script.
- Graceful backend `SIGINT` and `SIGTERM` handling.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 155 test files / 1140 tests.
- Developer Portal: 2 test files / 7 tests.
- Root release validation passed.
- API Gateway and Product Service production images built.
- Product Service migration runtime applied 1 migration.
- API Gateway migration runtime applied 11 migrations.
- Base render: 13 resources.
- Local bootstrap render: 10 resources.
- Local applications render: 13 resources.
- Twelve Kubernetes source files are tracked.
- No Kubernetes resources were applied.

## Preserved boundaries

- Docker Compose remains unchanged and supported.
- No Kubernetes API discovery.
- No Ingress, NodePort, LoadBalancer, public database, or public Redis.
- No ServiceAccount or RBAC.
- No PVC, StatefulSet, or durability claim.
- No Helm, GitOps, cloud-specific platform, or service mesh.
- No production secret-management claim.
- No resource requests/limits without measurement.
- Gateway health remains process-local and per pod.
- One Gateway replica avoids a false distributed-health claim.
- Host routing, weighted routing, service discovery, retry, authentication, quota, cache, transforms, analytics, metrics, and access logs remain unchanged.
- No OpenTelemetry, Loki, billing, marketplace, or enterprise IAM.
- No npm package version bump.
- No Sprint 71 Git tag.

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
- Sprint 72 - Kubernetes runtime validation and deployment documentation - next.
- Sprint 73 - OpenTelemetry tracing foundation.
- Sprint 74 - Loki logging foundation.
- Sprint 75 - Grafana observability integration.
- Sprint 76 - Platform RBAC/security hardening.
- Sprint 77 - UI state and responsive polish.
- Sprint 78 - E2E demo and bounded k6 validation.
- Sprint 79 - v2 docs, runbooks, and architecture cleanup.
- Sprint 80 - v2.0.0 release; no new feature scope.
