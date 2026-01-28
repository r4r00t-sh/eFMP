# Setup Guide - Gateway E-Filing System

## Quick Start

### 1. Start Infrastructure (Docker Compose)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (port 5672, Management UI: 15672)
- MinIO (port 9000, Console: 9001)

### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file (copy from .env.example if needed)
# DATABASE_URL="postgresql://efiling:efiling123@localhost:5432/efiling_db?schema=public"

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Start backend
npm run start:dev
```

Backend will run on `http://localhost:3001`

### 3. Setup Frontend

```bash
cd frontend
npm install

# Create .env.local file
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## Initial Data Setup

### Create First Super Admin

You can use the registration endpoint or create directly in the database:

```bash
# Using API
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Super Admin",
    "role": "SUPER_ADMIN"
  }'
```

### Create Organisation & Department

```sql
-- Connect to PostgreSQL
psql -U efiling -d efiling_db

-- Create Organisation
INSERT INTO "Organisation" (id, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Your Organisation', NOW(), NOW());

-- Get organisation ID and create department
INSERT INTO "Department" (id, name, code, "organisationId", "isInwardDesk", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Inward Desk',
  'INWARD',
  '<organisation-id>',
  true,
  NOW(),
  NOW()
);
```

## Service Credentials

### RabbitMQ Management UI
- URL: http://localhost:15672
- Username: `efiling`
- Password: `efiling123`

### MinIO Console
- URL: http://localhost:9001
- Access Key: `minioadmin`
- Secret Key: `minioadmin123`

### PostgreSQL
- Host: `localhost`
- Port: `5432`
- Database: `efiling_db`
- Username: `efiling`
- Password: `efiling123`

## Development Workflow

### Database Changes

```bash
cd backend

# Create migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### View Database

```bash
cd backend
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555`

## Testing WebSocket Connection

```javascript
// In browser console or test script
const socket = io('http://localhost:3001/presence', {
  auth: { userId: 'your-user-id' }
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('heartbeat');
});
```

## Troubleshooting

### Port Already in Use
- Change ports in `docker-compose.yml` or stop conflicting services

### Database Connection Failed
- Ensure Docker containers are running: `docker ps`
- Check DATABASE_URL in backend/.env

### Prisma Client Not Generated
```bash
cd backend
npx prisma generate
```

### MinIO Bucket Not Created
- Bucket is auto-created on first file upload
- Or create manually via MinIO Console

## Production Deployment

1. Update all `.env` files with production values
2. Change JWT_SECRET to a strong random string
3. Use proper database credentials
4. Configure CORS in `backend/src/main.ts`
5. Build frontend: `cd frontend && npm run build`
6. Use process manager (PM2) for backend
7. Set up reverse proxy (Nginx) if needed

