# eFMP – E-Filing Management Platform

A full-stack **E-Filing Management Platform** with a web application (Next.js + NestJS) and a cross-platform **Flutter** mobile app. Built for file tracking, dispatch, opinions, chat, analytics, and workflow management.

---

## Repository

- **GitHub:** [https://github.com/r4r00t-sh/eFMP](https://github.com/r4r00t-sh/eFMP)
- **Clone:** `git clone https://github.com/r4r00t-sh/eFMP.git`

---

## Features

- **File management** – Create, track, forward, recall, and approve files with priority (Routine, Urgent, Immediate, Project) and SLA timers
- **Dispatch** – Outward dispatch with history and tracking
- **Opinions** – Request and manage opinions across departments
- **Chat** – Group conversations and real-time presence
- **Admin** – Users, departments, desks, workflows, analytics, redlist
- **Gamification** – Points and leaderboards
- **Notifications** – In-app and real-time (Socket.IO)
- **Backfiles** – Backfile registration and linking
- **Mobile** – Flutter app (Android, iOS, Web) with feature parity to the web UI

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI, Zustand, Socket.IO client |
| **Backend**  | NestJS 11, TypeScript, Prisma, PostgreSQL, Passport JWT |
| **Storage**  | MinIO (S3-compatible) for file uploads |
| **Queue**    | RabbitMQ |
| **Cache**    | Redis (sessions, rate limiting) |
| **Mobile**   | Flutter 3.x, Dart, GoRouter, Provider, Dio |

---

## Project Structure

```
eFMP/
├── backend/          # NestJS API (auth, files, dispatch, opinions, chat, admin, etc.)
├── frontend/          # Next.js web app
├── flutter_app/       # Flutter mobile app (Android, iOS, Web)
├── k8s/               # Kubernetes manifests (namespace, postgres, redis, rabbitmq, minio, backend, frontend, ingress)
├── scripts/           # Run scripts (Podman, host)
├── podman-compose.yml # Local stack (Postgres, Redis, RabbitMQ, MinIO)
└── nginx.conf         # Optional reverse proxy
```

---

## Prerequisites

- **Node.js** 20+ (for backend and frontend)
- **pnpm / npm / yarn** (backend & frontend)
- **Flutter** 3.2+ (for mobile app)
- **PostgreSQL** 16 (or use Podman/Docker)
- **Redis**, **RabbitMQ**, **MinIO** (or use `podman-compose`)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/r4r00t-sh/eFMP.git
cd eFMP
```

### 2. Start infrastructure (Podman/Docker)

```bash
podman compose -f podman-compose.yml up -d
# Or: docker compose -f podman-compose.yml up -d
```

This starts Postgres, Redis, RabbitMQ, and MinIO. Default ports: `5432`, `6379`, `5672`/`15672`, `9000`/`9001`.

### 3. Backend

```bash
cd backend
cp .env.example .env   # if exists; set DATABASE_URL, REDIS_URL, RABBITMQ_URL, MINIO_* etc.
npm install
npx prisma generate
npx prisma db push     # or: npx prisma migrate deploy
npm run db:seed        # optional seed data
npm run start:dev
```

API runs at `http://localhost:3001` (or port in `.env`).

### 4. Frontend (web app)

```bash
cd frontend
cp .env.local.example .env.local   # if exists; set NEXT_PUBLIC_API_URL to backend URL
npm install
npm run dev
```

Web app runs at `http://localhost:3000`.

### 5. Flutter app (optional)

```bash
cd flutter_app
flutter pub get
flutter run
```

Use Android/iOS simulator or `flutter run -d chrome` for web. Point API base URL in app config to your backend (e.g. `http://10.0.2.2:3001` for Android emulator).

---

## Environment Variables

### Backend (`.env`)

- `DATABASE_URL` – PostgreSQL connection string
- `REDIS_URL` – Redis URL (e.g. `redis://localhost:6379`)
- `RABBITMQ_URL` – RabbitMQ URL (e.g. `amqp://efiling:efiling123@localhost:5672`)
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` – MinIO
- `JWT_SECRET` – Secret for JWT signing
- `PORT` – API port (default `3001`)

### Frontend (`.env.local`)

- `NEXT_PUBLIC_API_URL` – Backend API URL (e.g. `http://localhost:3001`)

---

## Deployment

### Kubernetes

Manifests are in `k8s/`. Apply in order (see `k8s/README.md`):

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

Build and push images `efiling-backend` and `efiling-frontend`, then point the manifests to your registry.

### Podman/Docker

- Backend and frontend have `Dockerfile`s in `backend/` and `frontend/`.
- Use `podman-compose` or `docker-compose` together with the existing `podman-compose.yml` (or extend it with backend/frontend services).

---

## Scripts

- `scripts/run-podman.ps1` / `scripts/run-podman.sh` – Start Podman stack
- `scripts/run-backend-on-host.ps1` – Run backend on host (e.g. Windows) against Podmanized DB/Redis/RabbitMQ/MinIO

---

## License

See repository for license information.

---

## Contributing

1. Fork the repo: [https://github.com/r4r00t-sh/eFMP](https://github.com/r4r00t-sh/eFMP)
2. Create a branch, make changes, and open a Pull Request.
