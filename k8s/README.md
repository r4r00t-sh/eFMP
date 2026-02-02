# E-Filing System – Kubernetes

Manifests to run the E-Filing stack in Kubernetes (namespace `efiling`).

## Prerequisites

- `kubectl` configured for your cluster
- Optional: [Ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/) (e.g. nginx-ingress) for `ingress.yaml`
- For local dev: [Kind](https://kind.sigs.k8s.io/) or [Minikube](https://minikube.sigs.k8s.io/)

## Apply order

Apply in this order so dependencies exist before workloads that use them:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

Or apply the whole directory (order may matter on first run; if something fails, re-run):

```bash
kubectl apply -f k8s/
```

## Images

Backend and frontend use:

- `efiling-backend:latest`
- `efiling-frontend:latest`

Build and load (example for Kind):

```bash
# From repo root
docker build -t efiling-backend:latest ./backend
docker build -t efiling-frontend:latest ./frontend

# Kind: load into cluster
kind load docker-image efiling-backend:latest efiling-frontend:latest
```

For a real registry, tag and push, then set `imagePullPolicy: Always` and correct `image` in `backend.yaml` / `frontend.yaml`.

## Frontend API URL

`NEXT_PUBLIC_API_URL` is fixed at **build time** in Next.js. For production:

- Build the frontend image with the correct API base URL, e.g.:
  - Same origin: `NEXT_PUBLIC_API_URL=/api` (if Ingress forwards `/api` to the backend)
  - Or full URL: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- Rebuild the frontend image when changing this value.

## Secrets

`k8s/secrets.yaml` holds placeholder values. **Before production:**

1. Replace all secrets (DB, RabbitMQ, MinIO, JWT, `database-url`, `rabbitmq-url`) with real values.
2. Prefer a secret manager (e.g. Sealed Secrets, External Secrets, cloud secret manager) instead of plain YAML.

## Access

- **With Ingress**: Set `efiling.local` (or your host) in `/etc/hosts` to the Ingress IP, then open `http://efiling.local`.
- **Without Ingress**: Use port-forward:
  - Frontend: `kubectl port-forward -n efiling svc/frontend 3000:3000`
  - Backend: `kubectl port-forward -n efiling svc/backend 3001:3001`
  - Then use `http://localhost:3000` and ensure the frontend was built with `NEXT_PUBLIC_API_URL=http://localhost:3001`.

## MinIO bucket

Create the bucket `efiling-documents` (e.g. via MinIO console or mc). Backend expects this bucket name.

## Optional: one-shot apply script

```bash
#!/bin/bash
set -e
for f in namespace.yaml secrets.yaml pvc.yaml postgres.yaml redis.yaml rabbitmq.yaml minio.yaml backend.yaml frontend.yaml ingress.yaml; do
  kubectl apply -f "k8s/$f"
done
```
flutter