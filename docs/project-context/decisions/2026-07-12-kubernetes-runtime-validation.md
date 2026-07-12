# Decision: Validate Kubernetes as a bounded local development runtime

Date: 2026-07-12

Sprint: 72

Status: Accepted

## Context

Sprint 71 produced statically validated Kustomize manifests but intentionally made no cluster runtime claim. Sprint 72 needed an owned local cluster, explicit context safety, image loading, migration ordering, rollout, DNS, HTTP, lifecycle, and operational documentation evidence.

## Decision

Use the user-owned Docker Desktop `docker-desktop` kubeadm cluster as the bounded Sprint 72 validation environment.

Keep:

- one replica per application
- ClusterIP Services
- local PostgreSQL and Redis Deployments with `emptyDir`
- one ordered migration Job
- Dashboard read-only credential separation
- an unprivileged Developer Portal
- process-local Gateway service-instance health
- route-owned service discovery
- Docker Compose support

Correct the API Gateway production image so it copies workspace-local runtime dependencies. Require a Redis import smoke from the built image.

Do not add:

- production or high-availability claims
- durable storage
- Ingress, NodePort, or LoadBalancer
- ServiceAccount or RBAC
- Kubernetes API discovery
- service mesh
- Helm or GitOps
- cloud-specific dependencies
- guessed resource requests or limits
- OpenTelemetry or Loki

## Evidence

- Docker Desktop Kubernetes v1.32.2, one Ready node.
- Kustomize resource counts 13 / 10 / 13.
- Six Deployments reached 1/1 Ready.
- Ordered migration Job completed.
- Migration counts 1 / 11.
- In-cluster HTTP validation passed for 8 approved surfaces.
- Seven port-forwarded HTTP routes returned 200.
- Gateway replacement pod had a new UID, zero restarts, and HTTP 200 health.
- Root release validation passed.
- API Gateway tests: 155 files / 1140 tests.
- Admin Dashboard tests: 53 files / 244 tests.
- Developer Portal tests: 2 files / 7 tests.

## Consequences

Docker Desktop Kubernetes is now a validated local/development runtime for PulseGate.

The deployment remains:

- single-node
- single-replica
- ephemeral
- internally exposed only
- without production secret management
- without distributed health state
- without durable storage
- without measured resource sizing

Sprint 73 can begin OpenTelemetry tracing foundation while preserving these Kubernetes boundaries.