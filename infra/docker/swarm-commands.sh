#!/bin/bash
# FinMark Docker Swarm Demo Commands
# Run from the repository root:
#   bash infra/docker/swarm-commands.sh [init|build|deploy|status|scale-up|scale-down|self-healing|teardown]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
STACK_FILE="$ROOT_DIR/infra/docker/docker-stack.yml"
ENV_FILE="$ROOT_DIR/.env"
STACK_NAME="finmark"

echo "=== FinMark Docker Swarm Setup ==="

init_swarm() {
  if docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "Swarm already active"
  else
    docker swarm init
    echo "Swarm initialized"
  fi
}

build_images() {
  echo "Building images from $ROOT_DIR ..."
  cd "$ROOT_DIR"
  docker build -t finmark/api-gateway:latest -f services/api-gateway/Dockerfile .
  docker build -t finmark/report-svc:latest -f services/report-svc/Dockerfile .
  docker build -t finmark/user-auth-svc:latest -f services/user-auth-svc/Dockerfile .
  docker build -t finmark/order-svc:latest -f services/order-svc/Dockerfile .
  docker build -t finmark/admin-svc:latest -f services/admin-svc/Dockerfile .
  docker build -t finmark/product-svc:latest -f services/product-svc/Dockerfile .
  docker build -t finmark/feedback-svc:latest -f services/feedback-svc/Dockerfile .
  echo "All images built"
}

# stack deploy ignores env_file — merge .env via compose config first
deploy() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing $ENV_FILE — copy from .env.example first"
    exit 1
  fi

  local rendered
  rendered="$(mktemp)"
  # Resolve env into a swarm-ready compose file
  docker compose --env-file "$ENV_FILE" -f "$STACK_FILE" config > "$rendered"

  # Deploy from infra/docker so relative config paths (nginx/prometheus) resolve
  cd "$ROOT_DIR/infra/docker"
  docker stack deploy -c "$rendered" "$STACK_NAME"
  rm -f "$rendered"

  echo "Stack deployed"
  docker service ls
}

status() {
  echo "=== Swarm Services ==="
  docker service ls
  echo ""
  echo "=== Report Service Instances ==="
  docker service ps "${STACK_NAME}_report-svc" || true
  echo ""
  echo "=== API Gateway Instances ==="
  docker service ps "${STACK_NAME}_api-gateway" || true
}

scale_up() {
  echo "Scaling report-svc to 5 replicas..."
  docker service scale "${STACK_NAME}_report-svc=5"
  echo "Done — Swarm DNS / nginx resolver pick up new tasks automatically"
  docker service ps "${STACK_NAME}_report-svc"
}

scale_down() {
  docker service scale "${STACK_NAME}_report-svc=3"
  echo "Scaled back to 3 replicas"
}

demo_self_healing() {
  echo "Finding a report-svc container to kill..."
  CONTAINER=$(docker ps --filter "name=${STACK_NAME}_report-svc" -q | head -1)
  if [[ -z "$CONTAINER" ]]; then
    echo "No report-svc container found — is the stack deployed?"
    exit 1
  fi
  echo "Killing container: $CONTAINER"
  docker kill "$CONTAINER"
  echo "Container killed — watch Swarm restart it automatically"
  echo "Run: docker service ps ${STACK_NAME}_report-svc"
}

teardown() {
  docker stack rm "$STACK_NAME"
  echo "Stack removed (containers drain for a few seconds)"
}

case "${1:-}" in
  init)          init_swarm ;;
  build)         build_images ;;
  deploy)        deploy ;;
  status)        status ;;
  scale-up)      scale_up ;;
  scale-down)    scale_down ;;
  self-healing)  demo_self_healing ;;
  teardown)      teardown ;;
  *)
    echo "Usage: bash infra/docker/swarm-commands.sh [init|build|deploy|status|scale-up|scale-down|self-healing|teardown]"
    exit 1
    ;;
esac
