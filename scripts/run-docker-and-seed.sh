#!/bin/bash
set -e

echo "🐳 Starting Docker containers with sudo..."
cd "$(dirname "$0")/.."
sudo docker compose up -d --build

echo "⏳ Waiting for containers to be healthy..."
sleep 15

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until sudo docker exec efiling-postgres pg_isready -U efiling > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

echo "🌱 Setting up backend for seeding..."
cd backend

# Set DATABASE_URL
export DATABASE_URL="postgresql://efiling:efiling123@localhost:5432/efiling_db?schema=public"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations/push
echo "🗄️  Setting up database schema..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "   Running migrations..."
    npx prisma migrate deploy || npx prisma db push --accept-data-loss
else
    echo "   No migrations found, pushing schema..."
    npx prisma db push --accept-data-loss
fi

# Run seed
echo "🌱 Running database seed..."
npm run db:seed

echo "✅ Seed completed!"
echo ""
echo "📋 Test Accounts:"
echo "  Super Admin:        admin / admin123"
echo "  Dept Admin:         finadmin / password123"
echo "  Chat Manager:       chatmanager.fin / password123"
echo "  Approval Authority: approver.fin / password123"
echo "  Section Officers:   john.budget, jane.accounts, mike.audit / password123"
echo "  Inward Desk:        inward.fin / password123"
echo "  Dispatcher:         dispatch.fin / password123"
echo "  Clerk (USER):       clerk.fin / password123"

