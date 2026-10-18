#!/bin/bash

# ========================================================
# EventCore CLI Helper (Wrapper for Docker Compose)
# ========================================================

COMMAND=$1
SERVICE=$2

show_help() {
  echo "Use: ./eventcore.sh [comando] [service] [arguments...]"
  echo ""
  echo "Available services:"
  echo "  auth      -> auth-service"
  echo "  front     -> frontend"
  echo ""
  echo "Common examples:"
  echo "  ./eventcore.sh artisan auth key:generate"
  echo "  ./eventcore.sh artisan auth migrate"
  echo "  ./eventcore.sh composer auth install"
  echo "  ./eventcore.sh npm front run build"
  echo "  ./eventcore.sh bash auth                 (open a terminal in the container)"
  echo ""
}

if [ -z "$COMMAND" ] || [ "$COMMAND" = "help" ] || [ "$COMMAND" = "--help" ]; then
  show_help
  exit 0
fi

# Map a short name to the container name in docker-compose
case "$SERVICE" in
  auth)
    CONTAINER="auth-service"
    ;;
  front)
    CONTAINER="frontend"
    ;;
  *)
    echo "Error: '$SERVICE' service not recognized"
    show_help
    exit 1
    ;;
esac

# Shift the first 2 arguments ($1 and $2) to pass the remainder to the container
shift 2

case "$COMMAND" in
  artisan)
    docker compose exec "$CONTAINER" php artisan "$@"
    ;;
  composer)
    docker compose exec "$CONTAINER" composer "$@"
    ;;
  npm)
    docker compose exec "$CONTAINER" npm "$@"
    ;;
  bash|sh)
    docker compose exec -it "$CONTAINER" sh
    ;;
  *)
    echo "Command '$COMMAND' not directly supported. Executing as a generic command..."
    docker compose exec "$CONTAINER" "$COMMAND" "$@"
    ;;
esac