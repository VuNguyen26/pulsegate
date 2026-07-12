# Local Kubernetes Foundation Runbook

## Status

Sprint 71 provides a statically validated local/development Kubernetes foundation.

Sprint 71 did **not** apply these resources to a cluster. Commands that apply or mutate cluster state belong to Sprint 72 runtime validation and must be run only after the cluster and image-loading strategy are audited.

## Artifact paths

```text
deploy/kubernetes/base
deploy/kubernetes/overlays/local
deploy/kubernetes/overlays/local/applications
```

Purpose:

- `base` â€” namespace plus four application ConfigMaps, Deployments, and ClusterIP Services.
- `overlays/local` â€” namespace, local-only Secrets, PostgreSQL, Redis, and migration Job.
- `overlays/local/applications` â€” the four application workloads for the post-migration rollout phase.

## Static validation

```powershell
cd E:\pulsegate

kubectl kustomize deploy/kubernetes/base
kubectl kustomize deploy/kubernetes/overlays/local
kubectl kustomize deploy/kubernetes/overlays/local/applications
```

Expected resource counts:

```text
base                 13
local bootstrap      10
local applications   13
```

Expected kinds:

```text
base:
  Namespace=1
  ConfigMap=4
  Deployment=4
  Service=4

local bootstrap:
  Namespace=1
  Secret=4
  Deployment=2
  Service=2
  Job=1

local applications:
  Namespace=1
  ConfigMap=4
  Deployment=4
  Service=4
```

## Local image contract

```text
pulsegate-api-gateway:local
pulsegate-product-service:local
pulsegate-admin-dashboard:local
pulsegate-developer-portal:local
```

Build examples:

```powershell
docker build `
  -t pulsegate-api-gateway:local `
  -f apps/api-gateway/Dockerfile `
  .

docker build `
  -t pulsegate-product-service:local `
  -f apps/product-service/Dockerfile `
  .

docker build `
  -t pulsegate-admin-dashboard:local `
  -f apps/admin-dashboard/Dockerfile `
  .

docker build `
  -t pulsegate-developer-portal:local `
  -f apps/developer-portal/Dockerfile `
  .
```

Loading images into kind, minikube, k3d, or another cluster is cluster-specific and remains a Sprint 72 decision.

## Intended Sprint 72 rollout order

Do not treat this as Sprint 71 runtime evidence.

```text
1. Audit cluster context and existing resources.
2. Build and load all four local images.
3. Apply deploy/kubernetes/overlays/local.
4. Wait for PostgreSQL and Redis readiness.
5. Wait for Job/pulsegate-migrations completion.
6. Inspect migration logs.
7. Apply deploy/kubernetes/overlays/local/applications.
8. Wait for four application rollouts.
9. Validate Services, probes, DNS, and port-forwarded HTTP.
```

Prospective commands after Sprint 72 audit:

```powershell
kubectl apply -k deploy/kubernetes/overlays/local

kubectl wait `
  --for=condition=available `
  deployment/postgres `
  deployment/redis `
  -n pulsegate `
  --timeout=180s

kubectl wait `
  --for=condition=complete `
  job/pulsegate-migrations `
  -n pulsegate `
  --timeout=300s

kubectl logs `
  job/pulsegate-migrations `
  -n pulsegate `
  --all-containers

kubectl apply -k deploy/kubernetes/overlays/local/applications
```

## Secret boundary

The local overlay contains explicit placeholder values beginning with `local-development-`.

They are:

- committed only for bounded local/development composition
- not production credentials
- not a secret-management platform
- not suitable for shared or public clusters

Before any non-local deployment, replace this mechanism with an explicitly reviewed secret delivery model.

The Admin Dashboard receives only `ADMIN_READ_ONLY_API_KEY`. It must never receive `ADMIN_API_KEY`.

## Data boundary

PostgreSQL and Redis use `emptyDir`.

Consequences:

- pod replacement can lose data
- no durability is claimed
- no backup/restore behavior exists
- no PVC or StatefulSet exists
- cleanup can remove all local data

A durable data design is outside Sprint 71.

## Health and discovery boundary

Application probes prove only that the process HTTP endpoint responds.

They do not prove:

- PostgreSQL or Redis dependency health
- downstream Product Service health
- distributed Gateway health
- external registry health
- active service-instance polling

Gateway service-instance health remains in memory and per pod. Restarting the Gateway pod resets that state.

Kubernetes DNS does not replace PulseGate route-owned `serviceInstances`, and the applications do not query Kubernetes APIs.

## Exposure boundary

All Services are ClusterIP.

There is no:

- Ingress
- NodePort
- LoadBalancer
- public PostgreSQL
- public Redis
- generic Admin API exposure

Sprint 72 may use bounded `kubectl port-forward` for validation without changing the committed exposure model.

## Security boundary

Application workloads:

- disable automatic service-account token mounting
- run as UID/GID 1000
- require non-root execution
- use `RuntimeDefault` seccomp
- disallow privilege escalation
- drop all Linux capabilities

Not yet asserted:

- read-only root filesystem
- resource requests/limits
- autoscaling
- disruption budgets
- network policies

Those require runtime evidence or a separately approved security design.

## Cleanup boundary

Cleanup commands are destructive to local ephemeral data. Sprint 72 must inspect current context and namespace contents before running them.

Potential cleanup after explicit approval:

```powershell
kubectl delete -k deploy/kubernetes/overlays/local/applications
kubectl delete -k deploy/kubernetes/overlays/local
```

Never run cleanup against an unknown or shared context.
