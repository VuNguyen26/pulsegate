# AI Handoff

PulseGate is complete through **Sprint 71 - Kubernetes foundation**.

## Canonical state

- Product/documentation version: `v1.11.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `c171135e1d413e6d90d76aed7d83e279a12b8504`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Sprint 71 creates no tag.
- Next sprint: **Sprint 72 - Kubernetes runtime validation and deployment documentation**.

## Kubernetes artifact contract

- Kustomize is used through the version embedded in `kubectl`.
- Base path: `deploy/kubernetes/base`.
- Local bootstrap path: `deploy/kubernetes/overlays/local`.
- Local application path: `deploy/kubernetes/overlays/local/applications`.
- Namespace: `pulsegate`.
- Application images:
  - `pulsegate-api-gateway:local`
  - `pulsegate-product-service:local`
  - `pulsegate-admin-dashboard:local`
  - `pulsegate-developer-portal:local`
- Application Services are ClusterIP only.
- Application replicas remain `1`.
- No Ingress, NodePort, LoadBalancer, ServiceAccount, or RBAC exists.

## Runtime and migration contract

- API Gateway and Product Service production images are multi-stage and run compiled JavaScript as user `node`.
- Gateway build copies its generated Prisma client into `dist/generated/prisma`.
- Backend servers handle `SIGINT` and `SIGTERM` through `app.close()`.
- Product Service exposes `db:migrate:deploy`.
- Local PostgreSQL and Redis are ephemeral Deployments with `emptyDir`.
- One Job executes Product Service migration before API Gateway migration.
- Applications are rendered separately so migration completion can precede application rollout.
- No seed runs in the migration Job.

## Configuration and security contract

- ConfigMaps contain non-secret settings.
- Base application manifests contain Secret references only.
- The local overlay generates explicit local-development placeholder Secrets.
- The Dashboard receives only `ADMIN_READ_ONLY_API_KEY`.
- The Dashboard does not receive `ADMIN_API_KEY`.
- The Developer Portal receives no privileged Secret.
- Application service-account token mounting is disabled.
- Application workloads run non-root with `RuntimeDefault` seccomp, no privilege escalation, and dropped capabilities.
- PostgreSQL and Redis are not publicly exposed.

## Health and discovery contract

- Kubernetes Services provide stable internal DNS only.
- PulseGate does not query Kubernetes APIs or Endpoint resources.
- Existing configured service discovery remains authoritative.
- Gateway instance health remains process-local and per pod.
- Pod restart resets health.
- Multiple Gateway replicas would have independent health views.
- Sprint 71 keeps one Gateway replica and makes no high-availability claim.
- GET-only retry, seven-retry cap, eight-execution cap, and non-GET no-replay remain unchanged.

## Validation evidence

- Root release validation passed.
- API Gateway: 155 test files / 1140 tests.
- Admin Dashboard: 53 test files / 244 tests.
- Developer Portal: 2 test files / 7 tests.
- Both production backend Docker images built.
- Product Service migration applied 1 migration.
- API Gateway migration applied 11 migrations.
- Base render produced 13 resources.
- Local bootstrap render produced 10 resources.
- Local applications render produced 13 resources.
- No cluster apply occurred.

## Sprint 72 handoff

Sprint 72 must audit the actual available cluster/runtime before applying anything.

Expected work:

- select or create an approved local cluster
- load the four local images into that cluster
- apply local bootstrap resources
- wait for PostgreSQL, Redis, and migration Job completion
- apply application resources
- validate rollouts, probes, DNS, and port-forwarded HTTP surfaces
- validate routing, Admin credential separation, quota/cache/analytics behavior, and failover invariants
- validate graceful termination
- validate pod restart and process-local health reset
- measure resources before adding requests/limits
- document rollback, troubleshooting, and cleanup

Sprint 72 must not silently add Kubernetes API discovery, a service mesh, cloud platform dependencies, production secret management, OpenTelemetry, Loki, billing, marketplace, enterprise IAM, npm version changes, or a Git tag.
