# Local Kubernetes Runtime Runbook

## Status

Sprint 72 validates the PulseGate Kubernetes foundation on a user-owned local Docker Desktop Kubernetes cluster.

Validated environment:

```text
Context: docker-desktop
Provisioner: kubeadm
Nodes: 1
Kubernetes: v1.32.2
Namespace: pulsegate
```

This runbook describes a local/development workflow. It does not describe a production, durable, highly available, or cloud deployment.

## Safety preflight

Always verify the context before mutation:

```powershell
kubectl config get-contexts
kubectl config current-context
kubectl cluster-info
kubectl get nodes -o wide
kubectl get namespaces
kubectl get all -n pulsegate
```

Expected approved context:

```text
docker-desktop
```

Stop if:

- the current context differs
- the cluster is shared or not owned by the operator
- unexpected workloads already exist in `pulsegate`
- placeholder Secrets would be unsafe for the target cluster
- the working tree is not clean when performing a release validation

Never decode or print Secret values.

## Artifact paths

```text
deploy/kubernetes/base
deploy/kubernetes/overlays/local
deploy/kubernetes/overlays/local/applications
```

Expected render counts:

```text
base                 13
local bootstrap      10
local applications   13
```

Validate:

```powershell
kubectl kustomize deploy/kubernetes/base
kubectl kustomize deploy/kubernetes/overlays/local
kubectl kustomize deploy/kubernetes/overlays/local/applications
```

## Build local images

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

Docker Desktop Kubernetes uses the Docker Desktop image store in the validated kubeadm setup, so separate `kind load` or `minikube image load` commands were not required.

API Gateway runtime smoke:

```powershell
docker run --rm `
  --workdir /app/apps/api-gateway `
  --entrypoint node `
  pulsegate-api-gateway:local `
  --input-type=module `
  -e "await import('redis'); console.log('REDIS_IMPORT_OK')"
```

Expected:

```text
REDIS_IMPORT_OK
```

The Gateway runtime image must include the API Gateway workspace node_modules tree because npm installs `redis` there.

## Bootstrap rollout

Apply local dependencies and migration resources:

```powershell
kubectl apply -k deploy/kubernetes/overlays/local
```

Wait for dependencies:

```powershell
kubectl rollout status `
  deployment/postgres `
  -n pulsegate `
  --timeout=180s

kubectl rollout status `
  deployment/redis `
  -n pulsegate `
  --timeout=180s
```

Wait for migrations:

```powershell
kubectl wait `
  --for=condition=complete `
  job/pulsegate-migrations `
  -n pulsegate `
  --timeout=360s
```

Inspect migration logs without printing Secret values:

```powershell
kubectl logs `
  job/pulsegate-migrations `
  -n pulsegate `
  -c product-service-migration

kubectl logs `
  job/pulsegate-migrations `
  -n pulsegate `
  -c api-gateway-migration

kubectl logs `
  job/pulsegate-migrations `
  -n pulsegate `
  -c completion
```

Validated migration counts:

```text
Product Service: 1
API Gateway:     11
```

## Application rollout

```powershell
kubectl apply `
  -k deploy/kubernetes/overlays/local/applications
```

Wait for the four rollouts:

```powershell
foreach ($deployment in @(
  'product-service',
  'api-gateway',
  'admin-dashboard',
  'developer-portal'
)) {
  kubectl rollout status `
    "deployment/$deployment" `
    -n pulsegate `
    --timeout=240s
}
```

Inspect:

```powershell
kubectl get pods -n pulsegate -o wide
kubectl get services -n pulsegate
kubectl get endpointslices.discovery.k8s.io -n pulsegate
```

Expected application state:

```text
product-service    1/1 Ready
api-gateway        1/1 Ready
admin-dashboard    1/1 Ready
developer-portal   1/1 Ready
```

## Port-forward validation

Run each command in its own PowerShell window:

```powershell
kubectl port-forward `
  -n pulsegate `
  service/api-gateway `
  13000:3000
```

```powershell
kubectl port-forward `
  -n pulsegate `
  service/admin-dashboard `
  13003:3003
```

```powershell
kubectl port-forward `
  -n pulsegate `
  service/developer-portal `
  13004:3004
```

Validated URLs:

```text
http://127.0.0.1:13000/health
http://127.0.0.1:13003/
http://127.0.0.1:13003/api/admin/runtime-status
http://127.0.0.1:13004/
http://127.0.0.1:13004/getting-started
http://127.0.0.1:13004/api-docs
http://127.0.0.1:13004/api-keys
```

All seven returned HTTP 200 in Sprint 72.

Stop port-forward processes with `Ctrl+C`.

## Pod lifecycle validation

```powershell
kubectl rollout restart `
  deployment/api-gateway `
  -n pulsegate

kubectl rollout status `
  deployment/api-gateway `
  -n pulsegate `
  --timeout=240s

kubectl get pods `
  -n pulsegate `
  -l app.kubernetes.io/name=api-gateway
```

Sprint 72 observed:

- a different pod UID after restart
- a new Gateway pod in Ready state
- restart count 0
- HTTP 200 from `/health`

The process-local service-instance health registry is recreated with the new process. This does not create distributed health state or a high-availability claim.

## Troubleshooting

### `current-context is not set`

Docker Desktop Kubernetes has not created or selected a context. Enable or create the local cluster, then re-audit. Do not apply against kubectl's localhost fallback.

### `ERR_MODULE_NOT_FOUND: Cannot find package 'redis'`

The production Gateway image is missing workspace-local runtime dependencies.

The Dockerfile must copy:

```dockerfile
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api-gateway/node_modules ./apps/api-gateway/node_modules
```

Rebuild the image, run the Redis import smoke, then restart only the Gateway Deployment.

### Startup probe connection refused

A short startup probe failure can occur while a process is still starting. Inspect rollout status, current logs, restart count, and final readiness. Persistent failures require exact logs before patching.

### CrashLoopBackOff

```powershell
kubectl get pods -n pulsegate -o wide
kubectl describe pod <pod-name> -n pulsegate
kubectl logs <pod-name> -n pulsegate --previous
kubectl get events -n pulsegate --sort-by=.metadata.creationTimestamp
```

Preserve partial cluster state until the exact cause is known. Do not blindly reapply or delete the namespace.

### Resource sizing not established

Sprint 72 did not complete an approved resource-sizing exercise. Resource requests and limits remain deferred rather than guessed.

## Security boundary

- Dashboard receives only `ADMIN_READ_ONLY_API_KEY`.
- Dashboard does not receive `ADMIN_API_KEY`.
- Developer Portal receives no privileged Secret.
- Application service-account token mounting is disabled.
- Application containers run as UID/GID 1000.
- RuntimeDefault seccomp is enabled.
- Privilege escalation is disabled.
- All Linux capabilities are dropped.
- Services are ClusterIP only.

Local generated Secret values are development placeholders, not production secret management.

## Data boundary

PostgreSQL and Redis use `emptyDir`.

Consequences:

- pod recreation can lose data
- no durability is claimed
- no backup or restore workflow exists
- no PVC or StatefulSet exists

## Rollback and recovery

For an application-only issue, preserve bootstrap state and inspect the affected Deployment first.

Reapply the tracked application overlay:

```powershell
kubectl apply `
  -k deploy/kubernetes/overlays/local/applications
```

Restart one affected Deployment only after rebuilding its local image:

```powershell
kubectl rollout restart `
  deployment/api-gateway `
  -n pulsegate
```

Do not use force deletion, namespace deletion, or broad `delete all` commands as recovery shortcuts.

## Cleanup

Cleanup destroys local ephemeral data. Confirm context and namespace contents first.

Application cleanup:

```powershell
kubectl delete `
  -k deploy/kubernetes/overlays/local/applications
```

Bootstrap and namespace cleanup:

```powershell
kubectl delete `
  -k deploy/kubernetes/overlays/local
```

Run cleanup only after explicit approval on the user-owned `docker-desktop` context.