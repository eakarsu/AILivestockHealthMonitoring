#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
[[ -f .env ]] || { echo "Create .env from .env.example; defaults are not generated." >&2; exit 1; }
set -a
source ./.env
set +a
API_DIR="backend"
UI_DIR="frontend"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

check() {
  command -v node >/dev/null || { echo "node is required" >&2; return 1; }
  command -v npm >/dev/null || { echo "npm is required" >&2; return 1; }
  [[ -f .env ]] || { echo "Create .env from .env.example; defaults are not generated." >&2; return 1; }
  grep -Eq '^JWT_SECRET=.{32,}$' .env || { echo "JWT_SECRET must contain at least 32 characters." >&2; return 1; }
  grep -Eq '^GOVERNANCE_TENANT_ID=[A-Za-z0-9][A-Za-z0-9._:-]+$' .env ||
    { echo "GOVERNANCE_TENANT_ID is required for signed tenant claims." >&2; return 1; }
  grep -Eq '^DATABASE_URL=.+|^DB_HOST=.+' .env ||
    { echo "DATABASE_URL or explicit DB_* settings are required." >&2; return 1; }
  if grep -Eqi 'password123|secure123|your_.*key|change[_-]?me|placeholder' .env; then
    echo "Refusing placeholder or demo credentials." >&2
    return 1
  fi
  echo "Configuration shape is valid; credentials and connectivity were not verified."
}

migrate() {
  check
  [[ "${ALLOW_SCHEMA_MIGRATION:-false}" == "true" ]] ||
    { echo "Set ALLOW_SCHEMA_MIGRATION=true for this explicit operation." >&2; return 1; }
  : "${DATABASE_URL:?DATABASE_URL is required for the migration process.}"
  command -v psql >/dev/null || { echo "psql is required" >&2; return 1; }
  while IFS= read -r migration; do
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
  done < <(find backend/migrations -maxdepth 1 -type f -name '*.sql' | sort)
  node backend/scripts/prepareRuntime.js
}

start_services() {
  check
  [[ -d "$API_DIR/node_modules" && -d "$UI_DIR/node_modules" ]] ||
    { echo "Dependencies are absent; run reviewed locked installs separately." >&2; return 1; }

  if [[ "${ALLOW_SCHEMA_MIGRATION:-false}" == "true" ]]; then migrate; fi
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "Port $port is already in use; refusing to terminate another process." >&2
      return 1
    fi
  done

  BACKEND_PORT="$BACKEND_PORT" npm --prefix "$API_DIR" start &
  api_pid=$!
  PORT="$FRONTEND_PORT" BROWSER=none CI=true REACT_APP_API_ORIGIN="http://127.0.0.1:$BACKEND_PORT" npm --prefix "$UI_DIR" start &
  ui_pid=$!

  cleanup() {
    kill "$api_pid" "$ui_pid" 2>/dev/null || true
    wait "$api_pid" "$ui_pid" 2>/dev/null || true
  }
  trap cleanup EXIT INT TERM
  wait "$api_pid" "$ui_pid"
}

case "${1:-start}" in
  check) check ;;
  migrate) migrate ;;
  start) start_services ;;
  *) echo "Usage: ./start.sh [check|migrate|start]" >&2; exit 64 ;;
esac
