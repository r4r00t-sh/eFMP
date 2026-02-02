#!/bin/sh
set -e

echo "Generating Prisma Client..."
npx prisma generate

echo "Running migrations..."
if ! npx prisma migrate deploy 2>/dev/null; then
  echo "Migrate deploy failed (e.g. DB not empty). Syncing schema with db push..."
  npx prisma db push
fi

echo "Starting application..."
exec node dist/src/main.js

