# Sprint 71 - Kubernetes foundation

## Goal

Add a bounded, reviewable Kubernetes manifest and deployment foundation for local/development use while preserving Docker Compose and every existing Gateway routing, health, security, quota, analytics, and fail-closed boundary.

## Scope

Delivered:

- backend production entrypoint hardening
- graceful backend shutdown
- Kustomize base and local overlay structure
- namespace, application ConfigMaps, Deployments, and ClusterIP Services
- Secret-reference boundaries
- application probes and security contexts
- local PostgreSQL and Redis composition
- ordered migration Job
- separate bootstrap and application render targets
- static manifest and migration runtime validation

Deferred:

- actual cluster apply
- image loading into a cluster
- Kubernetes rollout and DNS validation
- port-forwarded runtime validation
- resource measurement and requests/limits
- durable PostgreSQL/Redis
- production secret management
- ingress, autoscaling, network policy, or high availability

## Implementation commits

1. `81f9a3f69c96b52c0489988e939706bd2671f6e0`
   - `feat(runtime): harden backend deployment entrypoints`
2. `e77494ab9356ac5ba297a158e1e9150fe35c99fc`
   - `feat(kubernetes): add deployment manifest foundation`
3. `5c8e50a8eb68a75cc50f84bfc2a831cd0c2d7e41`
   - `feat(kubernetes): add core application manifests`
4. `c171135e1d413e6d90d76aed7d83e279a12b8504`
   - `feat(kubernetes): add local dependency composition`

## Runtime hardening

API Gateway and Product Service now:

- build TypeScript into `dist`
- start with compiled JavaScript
- use multi-stage Node.js 20 Alpine Dockerfiles
- run as the non-root `node` user
- expose ports 3000 and 3001
- close Fastify resources on `SIGINT` and `SIGTERM`

Gateway build copies its generated Prisma runtime into `dist/generated/prisma`.

Product Service now exposes `db:migrate:deploy`.

## Manifest foundation

Tracked Kubernetes files: 12.

Base resources:

- namespace: 1
- ConfigMaps: 4
- Deployments: 4
- Services: 4

Application replicas: 1 each.

Application Services: ClusterIP only.

Application image tags:

- `pulsegate-api-gateway:local`
- `pulsegate-product-service:local`
- `pulsegate-admin-dashboard:local`
- `pulsegate-developer-portal:local`

## Local composition

Bootstrap resources:

- namespace: 1
- generated local-only Secrets: 4
- PostgreSQL Deployment and Service
- Redis Deployment and Service
- migration Job

PostgreSQL and Redis storage uses `emptyDir`.

Migration order:

1. Product Service
2. API Gateway
3. completion container

Application manifests render separately from bootstrap resources.

## Security boundaries

- No ServiceAccount or RBAC.
- `automountServiceAccountToken: false`.
- Application workloads run non-root as UID/GID 1000.
- Application workloads use `RuntimeDefault` seccomp.
- Application containers disallow privilege escalation and drop all capabilities.
- Dashboard receives the read-only Admin key only.
- Developer Portal receives no privileged Secret.
- No public database or Redis.
- No Ingress, NodePort, or LoadBalancer.
- No real production secret is committed.

## Preserved application invariants

- Exact host routing unchanged.
- Weighted routing unchanged.
- Configured service discovery unchanged.
- Health state remains process-local.
- GET-only retry unchanged.
- Retry attempts remain capped at 7.
- Total downstream executions remain capped at 8.
- Non-GET requests are not replayed.
- Authentication, quota, rate limit, cache, transforms, analytics, metrics, and access logs remain on the shared pipeline.
- Dashboard credentials remain server-only.
- Developer Portal gains no management capability.

## Validation

Passed:

- `npm.cmd run validate:release`
- Admin Dashboard: 53 test files / 244 tests
- API Gateway: 155 test files / 1140 tests
- Developer Portal: 2 test files / 7 tests
- API Gateway production image build
- Product Service production image build
- Product Service migration runtime: 1 migration
- API Gateway migration runtime: 11 migrations
- base Kustomize render: 13 resources
- local bootstrap render: 10 resources
- local applications render: 13 resources
- protected tag verification
- Git diff and ref checks

No Kubernetes resource was applied.

## Version

Product/documentation version:

```text
v1.11.0
```

Private npm workspace versions remain:

```text
0.1.0
```

No Sprint 71 Git tag was created.

## Next sprint

Sprint 72 - Kubernetes runtime validation and deployment documentation.
