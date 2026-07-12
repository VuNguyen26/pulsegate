# Sprint 72 - Kubernetes runtime validation and deployment documentation

## Status

Complete.

## Product/documentation version

`v1.12.0`

Private npm workspace versions remain `0.1.0`.

No Sprint 72 Git tag was created. Protected annotated tag `v1.0.0` remains unchanged.

## Objective

Validate the Sprint 71 Kubernetes foundation on an approved local/development cluster and replace prospective deployment guidance with actual runtime evidence.

## Implementation

Implementation commit:

- `c6229f4091ae4c70b5ee4964b57559f9f47a049d` - `fix(runtime): include gateway workspace dependencies`

The implementation fixes API Gateway production image module resolution by copying the workspace-local node_modules tree that contains `redis`.

## Cluster evidence

- Context: `docker-desktop`.
- Docker Desktop Kubernetes using kubeadm.
- Kubernetes: v1.32.2.
- One Ready control-plane node.
- No pre-existing PulseGate namespace or resource collision before apply.
- Namespace: `pulsegate`.

## Deployment evidence

- Base render: 13 resources.
- Local bootstrap render: 10 resources.
- Local applications render: 13 resources.
- PostgreSQL: 1/1 Ready.
- Redis: 1/1 Ready.
- Product Service: 1/1 Ready.
- API Gateway: 1/1 Ready.
- Admin Dashboard: 1/1 Ready.
- Developer Portal: 1/1 Ready.
- Migration Job: Complete.
- Product Service migrations: 1.
- API Gateway migrations: 11.

## HTTP and lifecycle evidence

- In-cluster HTTP validation passed for Gateway health, Product health, Dashboard root, Dashboard BFF, and four Portal routes.
- Seven Windows port-forwarded URLs returned HTTP 200.
- Gateway rollout restart created a new pod UID.
- Replacement Gateway pod was Ready with zero restarts.
- Replacement Gateway health returned HTTP 200.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 155 test files / 1140 tests.
- Developer Portal: 2 test files / 7 tests.
- Root release validation passed.
- Typecheck and production builds passed.
- Git diff checks passed.

## Preserved boundaries

- Local/development claim only.
- One application replica each.
- No high-availability or distributed-health claim.
- PostgreSQL and Redis remain ephemeral.
- Services remain ClusterIP.
- No Ingress, NodePort, LoadBalancer, RBAC, ServiceAccount, PVC, StatefulSet, Helm, GitOps, cloud platform, service mesh, Kubernetes API discovery, OpenTelemetry, or Loki.
- No npm version bump.
- No Git tag.

## Documentation

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/runbooks/kubernetes-local.md
- docs/runbooks/local-validation.md
- docs/sdlc/sprint-history/sprint-72.md
- docs/project-context/decisions/2026-07-12-kubernetes-runtime-validation.md

## Next sprint

Sprint 73 - OpenTelemetry tracing foundation.