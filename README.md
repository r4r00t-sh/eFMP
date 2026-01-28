# Gateway Enterprise E-Filing System

A comprehensive, gamified, self-hosted e-filing system built with Next.js 15 and NestJS.

## Architecture

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Shadcn UI (Nova/Neutral theme)
- **State Management**: Zustand
- **Real-time**: Socket.IO Client

### Backend
- **Framework**: NestJS (Modular Architecture)
- **ORM**: Prisma (PostgreSQL)
- **Real-time**: WebSockets (Socket.IO)
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Storage**: MinIO (S3-compatible)

### Infrastructure
- **Database**: PostgreSQL 16
- **Cache/Real-time**: Redis 7
- **Message Queue**: RabbitMQ 3
- **Object Storage**: MinIO
- **Deployment**: Docker Compose

## Features

### 1. Organizational Hierarchy
- Organisation > Department > Division > User
- External files land at "Inward Desk" departments
- Internal forwarding with cascading dropdowns (Division -> User)
- Double-confirmation modal for routing

### 2. Role-Based Dashboards
- **Inward Desk**: Digitization, tagging, and initial routing
- **Section Officer**: File workbench with PDF viewer (Left) and Rich-Text Note editor (Right)
- **Dept Admin**: Oversight, performance analytics, and "Active Desk" monitoring
- **Super Admin**: Global analytics and "Recall Protocol" (withdraw any file from any stage)

### 3. Presence Engine
- WebSocket-based heartbeat system
- Frontend pings every 3 minutes
- Status detection: "Active", "Absent", or "Session Timeout"
- Redis-backed presence tracking

### 4. Actionable Toast System
- RabbitMQ-driven notifications
- On file receipt: Toast with [Request Extra Time] button
- On request: Sender gets toast with [Approve] | [Deny] buttons

### 5. Gamification
- Base: 1000 points
- Deduct 50 for each "Red List" (overdue) file
- Add 100 for monthly zero-overdue streaks
- Live scores displayed in Navbar

### 6. Timing Engine
- Visual "Battery/Clock" countdown for desk-hops
- Automatic "Red List" tagging when Time <= 0
- Holiday/weekend adjustments

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Start Infrastructure Services**
```bash
docker-compose up -d
```

2. **Setup Backend**
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL="postgresql://efiling:efiling123@localhost:5432/efiling_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://efiling:efiling123@localhost:5672
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=efiling-documents
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Project Structure

```
EFiling-System/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication & JWT
│   │   ├── files/         # File management
│   │   ├── departments/   # Department/Division APIs
│   │   ├── presence/      # WebSocket presence gateway
│   │   ├── gamification/  # Points system
│   │   ├── timing/        # Timing engine & countdown
│   │   ├── redlist/       # Red List cron job
│   │   ├── prisma/        # Prisma service
│   │   ├── redis/         # Redis service
│   │   ├── rabbitmq/      # RabbitMQ service
│   │   └── minio/         # MinIO service
│   └── prisma/
│       └── schema.prisma  # Database schema
├── frontend/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── navbar.tsx    # Main navigation
│   │   ├── presence-client.tsx
│   │   └── toast-consumer.tsx
│   └── lib/              # Utilities & API client
└── docker-compose.yml    # Infrastructure services
```

## Key Modules

### Backend Modules
- **AuthModule**: JWT-based authentication
- **FilesModule**: File CRUD, forwarding, recall
- **PresenceModule**: WebSocket gateway for presence tracking
- **GamificationModule**: Points calculation and streaks
- **TimingModule**: Time remaining calculations with cron
- **RedListModule**: Automatic red-listing of overdue files

### Frontend Pages
- `/login`: Authentication
- `/dashboard`: Role-based dashboard
- `/files`: File listing and management
- `/files/[id]`: File detail view (split-pane)
- `/admin/*`: Admin dashboards

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get current user

### Files
- `POST /files` - Create new file
- `GET /files/:id` - Get file details
- `POST /files/:id/forward` - Forward file
- `POST /files/:id/request-extra-time` - Request extra time
- `POST /files/:id/recall` - Recall file (Super Admin only)

### Departments
- `GET /departments` - List all departments
- `GET /departments/inward-desk` - Get inward desk departments
- `GET /departments/:id/divisions` - Get divisions
- `GET /departments/:id/divisions/:divisionId/users` - Get users by division

## WebSocket Events

### Presence Namespace (`/presence`)
- `heartbeat` - Client sends heartbeat
- `get-presence` - Get user presence status

## Development

### Running Migrations
```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Generating Prisma Client
```bash
cd backend
npx prisma generate
```

### Accessing Services
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **RabbitMQ Management**: `http://localhost:15672` (efiling/efiling123)
- **MinIO Console**: `http://localhost:9001` (minioadmin/minioadmin123)
- **Backend API**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000`

## License

Private - Enterprise Use Only

