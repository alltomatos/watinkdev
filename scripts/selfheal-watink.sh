#!/usr/bin/env bash
set -euo pipefail

WORKDIR="/root/.openclaw/workspace/watinkdev"
LOGFILE="/var/log/watink-selfheal.log"
LOCKFILE="/tmp/watink-selfheal.lock"

mkdir -p "$(dirname "$LOGFILE")"
touch "$LOGFILE"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S%z')] $*" | tee -a "$LOGFILE"
}

restart_stack_parts() {
  log "ACTION: restarting engine-standard and backend"
  cd "$WORKDIR"
  pm2 restart engine-standard --update-env >> "$LOGFILE" 2>&1 || true
  sleep 2
  pm2 restart backend --update-env >> "$LOGFILE" 2>&1 || true
}

check_api() {
  local code
  code=$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' -H 'Host: api.docker' http://127.0.0.1/public-settings || echo "000")
  [[ "$code" == "200" ]]
}

check_rabbit_consumer() {
  cd "$WORKDIR"
  local consumers
  consumers=$(docker compose -f docker-compose.dev.yml exec -T rabbitmq rabbitmqctl list_queues name consumers 2>/dev/null \
    | awk '$1=="wbot_standard_commands" {print $2}' | tail -n1)
  [[ -n "${consumers:-}" ]] && [[ "$consumers" -ge 1 ]]
}

validate_recovery() {
  local ok_api=0 ok_consumer=0
  check_api && ok_api=1 || true
  check_rabbit_consumer && ok_consumer=1 || true
  [[ $ok_api -eq 1 && $ok_consumer -eq 1 ]]
}

(
  flock -n 9 || exit 0

  api_ok=0
  consumer_ok=0

  check_api && api_ok=1 || true
  check_rabbit_consumer && consumer_ok=1 || true

  if [[ $api_ok -eq 1 && $consumer_ok -eq 1 ]]; then
    exit 0
  fi

  log "DETECTED: unhealthy state api_ok=$api_ok consumer_ok=$consumer_ok"
  restart_stack_parts
  sleep 4

  if validate_recovery; then
    log "RECOVERY: success"
    exit 0
  fi

  log "RECOVERY: failed (manual check required)"
  exit 1

) 9>"$LOCKFILE"
