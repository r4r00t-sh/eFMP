#!/usr/bin/env bash
# Run E-Filing System with Podman (Linux / macOS / WSL / Git Bash)
# Uses "podman compose" (with space) - same command on Windows; this script is for bash.
# Usage: ./run-podman.sh [ up | down | logs | build ]

set -e
COMPOSE_FILE="podman-compose.yml"
CMD="${1:-up}"

case "$CMD" in
  up)
    echo "Starting E-Filing stack with podman compose..."
    podman compose -f "$COMPOSE_FILE" up --build -d
    echo ""
    echo "App:  http://localhost:3000"
    echo "API:  http://localhost:3001"
    ;;
  down)
    echo "Stopping E-Filing stack..."
    podman compose -f "$COMPOSE_FILE" down
    ;;
  logs)
    podman compose -f "$COMPOSE_FILE" logs -f
    ;;
  build)
    echo "Building images..."
    podman compose -f "$COMPOSE_FILE" build
    ;;
  *)
    echo "Usage: $0 { up | down | logs | build }"
    exit 1
    ;;
esac
