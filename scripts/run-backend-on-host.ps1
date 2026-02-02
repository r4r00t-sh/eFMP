# Run backend on Windows HOST so it binds to 0.0.0.0:3001 and is reachable at http://YOUR_IP:3001
# (Podman on Windows often only forwards container ports to localhost, so 192.168.1.x:3001 fails.)
#
# Usage: .\run-backend-on-host.ps1
# Prereqs: Podman running; Node 20+ in PATH; run from repo root.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$RepoRoot\backend\package.json")) {
    Write-Error "Run from repo root or ensure backend/ exists. Repo root: $RepoRoot"
}

# 1) Start only infra (postgres, redis, rabbitmq, minio) - no backend/frontend
Write-Host "Starting Postgres, Redis, RabbitMQ, MinIO in Podman..." -ForegroundColor Cyan
Push-Location $RepoRoot
& podman compose -f podman-compose.yml up -d postgres redis rabbitmq minio
Pop-Location
if ($LASTEXITCODE -ne 0) { Write-Error "podman compose up failed" }

# 2) Wait for Postgres
Write-Host "Waiting for Postgres (15s)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# 3) Env for backend connecting to services on localhost
$env:DATABASE_URL = "postgresql://efiling:efiling123@localhost:5432/efiling_db?schema=public"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:RABBITMQ_URL = "amqp://efiling:efiling123@localhost:5672"
$env:MINIO_ENDPOINT = "localhost"
$env:MINIO_PORT = "9000"
$env:MINIO_USE_SSL = "false"
$env:MINIO_ACCESS_KEY = "minioadmin"
$env:MINIO_SECRET_KEY = "minioadmin123"
$env:MINIO_BUCKET_NAME = "efiling-documents"
$env:JWT_SECRET = "your-super-secret-jwt-key-change-in-production"
$env:JWT_EXPIRES_IN = "7d"
$env:PORT = "3001"
$env:NODE_ENV = "development"
$env:FRONTEND_URL = "http://localhost:3000"

# 4) Backend: generate, migrate, seed, start
# Run Prisma via cmd so stderr (e.g. "Loaded Prisma config...") is discarded and doesn't trigger PowerShell error display
Push-Location "$RepoRoot\backend"
try {
    Write-Host "Prisma generate..." -ForegroundColor Cyan
    cmd /c "npx prisma generate 2>nul"
    if ($LASTEXITCODE -ne 0) { throw "prisma generate failed" }

    Write-Host "Prisma migrate deploy (or db push if DB not empty)..." -ForegroundColor Cyan
    cmd /c "npx prisma migrate deploy 2>nul"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migrate failed - syncing schema with db push..." -ForegroundColor Yellow
        cmd /c "npx prisma db push 2>nul"
    }
    Write-Host "Prisma seed..." -ForegroundColor Cyan
    cmd /c "npx prisma db seed 2>nul"

    Write-Host "Building backend..." -ForegroundColor Cyan
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

    Write-Host "Starting backend on host (0.0.0.0:3001) - reachable at http://YOUR_IP:3001" -ForegroundColor Green
    Write-Host "Allow port 3001 in Windows Firewall if needed: New-NetFirewallRule -DisplayName 'EFiling API 3001' -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow" -ForegroundColor Yellow
    & npm run start
} finally {
    Pop-Location
}
