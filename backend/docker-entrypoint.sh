#!/bin/sh
set -e

echo "Generating Prisma Client..."
npx prisma generate

echo "Starting application..."
exec node dist/src/main.js

