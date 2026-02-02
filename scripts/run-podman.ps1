# Run E-Filing System with Podman (Windows)
# Uses "podman compose" (with space) - same command on Linux; this script is for PowerShell.
# Requires: Podman 4.1+ (built-in compose)
# Usage: .\run-podman.ps1 [ up | down | logs | build ]

param(
    [Parameter(Position = 0)]
    [ValidateSet("up", "down", "logs", "build")]
    [string]$Command = "up"
)

$ComposeFile = "podman-compose.yml"

switch ($Command) {
    "up" {
        Write-Host "Starting E-Filing stack with podman compose..." -ForegroundColor Cyan
        & podman compose -f $ComposeFile up --build -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nApp:  http://localhost:3000" -ForegroundColor Green
            Write-Host "API:  http://localhost:3001" -ForegroundColor Green
        }
    }
    "down" {
        Write-Host "Stopping E-Filing stack..." -ForegroundColor Cyan
        & podman compose -f $ComposeFile down
    }
    "logs" {
        & podman compose -f $ComposeFile logs -f
    }
    "build" {
        Write-Host "Building images..." -ForegroundColor Cyan
        & podman compose -f $ComposeFile build
    }
}
