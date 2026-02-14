#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.deploy}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
MODE="${1:-}"

command_exists() { command -v "$1" >/dev/null 2>&1; }

require_cmd() {
  local cmd="$1"
  if ! command_exists "$cmd"; then
    echo "[ERRO] Comando obrigatório não encontrado: $cmd"
    exit 1
  fi
}

ensure_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    cp .env.deploy.example "$ENV_FILE"
    echo "[OK] $ENV_FILE criado a partir de .env.deploy.example"
  fi
}

upsert_env() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

read -r -p "Domínio APP (ex: app.seudominio.com): " APP_DOMAIN_INPUT
read -r -p "Domínio API (ex: api.seudominio.com): " API_DOMAIN_INPUT

if [[ -z "$APP_DOMAIN_INPUT" || -z "$API_DOMAIN_INPUT" ]]; then
  echo "[ERRO] APP_DOMAIN e API_DOMAIN são obrigatórios."
  exit 1
fi

require_cmd docker
if ! docker compose version >/dev/null 2>&1; then
  echo "[ERRO] Docker Compose plugin não encontrado (docker compose)."
  exit 1
fi

ensure_env_file
upsert_env "APP_DOMAIN" "$APP_DOMAIN_INPUT"
upsert_env "API_DOMAIN" "$API_DOMAIN_INPUT"
upsert_env "DOMAIN_FRONTEND" "$APP_DOMAIN_INPUT"
upsert_env "DOMAIN_BACKEND" "$API_DOMAIN_INPUT"

set -a
source "$ENV_FILE"
set +a

: "${TRAEFIK_NETWORK:=traefik-public}"
: "${INTERNAL_NETWORK:=watink-internal}"
: "${STACK_NAME:=watink}"

if ! docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1; then
  echo "[ERRO] Rede Traefik '$TRAEFIK_NETWORK' não encontrada. Crie-a no host do Traefik e tente novamente."
  exit 1
fi

if [[ "${MODE}" == "swarm" ]]; then
  require_cmd docker
  if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -qE 'active|pending'; then
    echo "[ERRO] Docker Swarm não está ativo. Rode: docker swarm init"
    exit 1
  fi

  if ! docker network inspect "$INTERNAL_NETWORK" >/dev/null 2>&1; then
    docker network create --driver overlay --attachable "$INTERNAL_NETWORK"
    echo "[OK] Rede interna overlay criada: $INTERNAL_NETWORK"
  fi

  if [[ "${BUILD_LOCAL:-0}" == "1" ]]; then
    docker compose --env-file "$ENV_FILE" -f docker-stack.yml build backend frontend whaileys-engine
  fi

  docker stack deploy --with-registry-auth --compose-file docker-stack.yml "${STACK_NAME}"
  echo "[OK] Stack '${STACK_NAME}' implantada em modo swarm."
else
  if ! docker network inspect "$INTERNAL_NETWORK" >/dev/null 2>&1; then
    docker network create "$INTERNAL_NETWORK"
    echo "[OK] Rede interna bridge criada: $INTERNAL_NETWORK"
  fi

  if [[ "${BUILD_LOCAL:-0}" == "1" ]]; then
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build backend frontend whaileys-engine
  fi

  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d
  echo "[OK] Watink iniciado com Docker Compose."
fi

echo "[INFO] APP: https://${APP_DOMAIN_INPUT}"
echo "[INFO] API: https://${API_DOMAIN_INPUT}"
