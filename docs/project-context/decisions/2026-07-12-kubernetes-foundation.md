# Decision: Bounded local Kubernetes foundation

Date: 2026-07-12

Status: Accepted

Sprint: 71

## Context

PulseGate had validated Docker Compose runtime paths but no Kubernetes deployment artifacts.

The project needed a Kubernetes foundation without claiming production readiness, replacing configured service discovery with Kubernetes API discovery, introducing distributed Gateway health, exposing internal services publicly, or adding a cloud-specific platform.

The Gateway service-instance health registry is process-local. This constrains replica and high-availability claims until runtime behavior is validated explicitly.

Database migration ownership also needed to remain explicit and race-free.

## Decision

Use Kustomize through the version embedded in `kubectl`.

Create:

```text
deploy/kubernetes/base
deploy/kubernetes/overlays/local
deploy/kubernetes/overlays/local/applications
```

Use namespace:

```text
pulsegate
```

Define four one-replica application Deployments and four ClusterIP Services.

Use ConfigMaps for non-secret settings and Secret references for credentials.

Keep the Admin Dashboard on `ADMIN_READ_ONLY_API_KEY` only. Give the Developer Portal no privileged Secret.

Disable service-account token mounting for application pods.

Run application containers non-root with `RuntimeDefault` seccomp, no privilege escalation, and dropped capabilities.

Use local PostgreSQL 16 and Redis 7 Deployments with `emptyDir` and ClusterIP Services.

Use one migration Job with ordered init containers:

1. Product Service `prisma migrate deploy`
2. API Gateway `prisma migrate deploy`

Render application resources separately so migration completion can precede application rollout.

Harden backend Docker images and shutdown behavior before Kubernetes use.

## Rationale

Kustomize is already available and avoids introducing another deployment dependency.

Separate bootstrap and application phases make migration ownership explicit.

One application replica preserves honest process-local health semantics.

Internal ClusterIP Services preserve existing exposure boundaries.

Local-only generated Secrets make development composition reproducible while remaining explicit that production secret management is absent.

Ephemeral data dependencies are sufficient for a foundation and avoid inventing durability before runtime requirements are measured.

## Consequences

Positive:

- Kubernetes artifacts are reviewable and statically renderable.
- Existing application ports and health endpoints are reused.
- Secret ownership remains workload-specific.
- Migration ordering is explicit.
- Application containers have a bounded security baseline.
- Docker Compose remains available.
- Sprint 72 has a concrete runtime validation target.

Limitations:

- No cluster apply evidence exists yet.
- No production readiness or high availability is claimed.
- Gateway health is independent per pod.
- PostgreSQL and Redis data is ephemeral.
- No resource requests/limits are defined.
- No production secret management exists.
- No ingress, autoscaling, disruption budget, network policy, or durable storage exists.

## Rejected alternatives

### Helm

Rejected for Sprint 71 because the repository has no current chart requirement and embedded Kustomize is already available.

### Per-replica migration init containers

Rejected because multiple replicas could race and migration ownership would be implicit.

### Kubernetes API service discovery

Rejected because it would replace the bounded route-owned discovery contract and introduce Kubernetes permissions and control-plane coupling.

### Multiple Gateway replicas

Rejected for Sprint 71 because process-local health would produce independent state without runtime validation.

### PVC or StatefulSet for local databases

Rejected because Sprint 71 does not yet have measured durability, backup, or lifecycle requirements.

### Hardcoded resource limits

Rejected because arbitrary sizing would create false operational confidence.

## Validation

- Root release validation passed.
- Backend production images built.
- Product Service and API Gateway migration commands passed against temporary PostgreSQL.
- Base, local bootstrap, and local applications Kustomize targets rendered successfully.
- Static scans found no default public exposure, ServiceAccount/RBAC, privileged container, or `latest` application image.
- Protected tag and private package versions remained unchanged.

## Follow-up

Sprint 72 shall validate an approved local cluster, image loading, bootstrap apply, migration completion, application rollout, Service DNS, HTTP surfaces, graceful termination, pod restart, per-pod health reset, resource measurements, rollback, troubleshooting, and cleanup.
