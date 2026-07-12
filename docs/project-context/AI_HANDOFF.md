# AI Handoff

PulseGate is complete through **Sprint 72 - Kubernetes runtime validation and deployment documentation**.

## Canonical state

- Product/documentation version: `v1.12.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `c6229f4091ae4c70b5ee4964b57559f9f47a049d`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Sprint 72 creates no tag.
- Next sprint: **Sprint 73 - OpenTelemetry tracing foundation**.

## Validated Kubernetes runtime

- Context: `docker-desktop`.
- Runtime: Docker Desktop Kubernetes, kubeadm, one local control-plane node.
- Kubernetes version: v1.32.2.
- Namespace: `pulsegate`.
- Base render: 13 resources.
- Local bootstrap render: 10 resources.
- Local application render: 13 resources.
- PostgreSQL, Redis, Product Service, API Gateway, Admin Dashboard, and Developer Portal Deployments reached 1/1 Ready.
- Migration Job completed in Product Service -> API Gateway -> completion order.
- Migration counts: 1 Product Service and 11 API Gateway.
- In-cluster HTTP validation passed for 8 approved surfaces.
- Seven port-forwarded HTTP surfaces returned 200.
- Gateway pod replacement produced a new UID, zero restarts, and HTTP 200 health.

## Runtime image correction

The API Gateway production image must copy both:

```text
/app/node_modules
/app/apps/api-gateway/node_modules
```

The workspace-local tree contains the runtime `redis` package used by compiled Gateway output. Commit:

```text
c6229f4091ae4c70b5ee4964b57559f9f47a049d
fix(runtime): include gateway workspace dependencies
```

Do not remove the workspace dependency copy without proving production runtime module resolution.

## Kubernetes contract

- Kustomize uses the version embedded in `kubectl`.
- Bootstrap path: `deploy/kubernetes/overlays/local`.
- Application path: `deploy/kubernetes/overlays/local/applications`.
- Application replicas remain one.
- Services remain ClusterIP.
- PostgreSQL and Redis remain ephemeral `emptyDir` Deployments.
- Dashboard receives only `ADMIN_READ_ONLY_API_KEY`.
- Developer Portal receives no privileged Secret.
- Application service-account token mounting remains disabled.
- Application containers remain non-root with RuntimeDefault seccomp, no privilege escalation, and dropped capabilities.
- No Ingress, NodePort, LoadBalancer, RBAC, ServiceAccount, PVC, StatefulSet, or production secret management exists.

## Health and discovery contract

- Kubernetes Services provide stable internal DNS only.
- PulseGate does not query Kubernetes APIs or Endpoint resources for route discovery.
- Existing configured service discovery remains authoritative.
- Gateway instance health remains process-local and per pod.
- Pod replacement recreates the process-local health registry.
- Multiple Gateway replicas would have independent health views.
- GET-only retry, seven-retry cap, eight-execution cap, and non-GET no-replay remain unchanged.

## Sprint 73 boundary

Sprint 73 owns OpenTelemetry tracing foundation only.

Before patching:

- audit current logging, request ID, Fastify hooks, proxy lifecycle, metrics, Docker, Compose, and Kubernetes configuration
- preserve bounded labels and existing analytics sources of truth
- define trace propagation and sampling explicitly
- keep secrets, API keys, JWTs, raw bodies, and unbounded paths out of attributes
- keep Loki, service mesh, cloud exporter lock-in, billing, marketplace, and enterprise IAM out of scope
- validate Docker Compose and Kubernetes runtime after implementation

Do not change npm workspace versions or create a Git tag.