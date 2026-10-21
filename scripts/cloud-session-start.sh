#!/bin/bash
# Prepares a Claude Code cloud session to match local development (see server/README.md):
# PostgreSQL on 5433 (roles deepdev + app_user, databases deepdev + deepdev_test), Redis on 6380,
# dependencies installed, Prisma client generated, migrations applied, demo data seeded.
# Runs from .claude/settings.json on every session start; does nothing on your own machine.
set -u
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 1
log() { echo "[cloud-setup] $*"; }

# --- PostgreSQL 16 (pre-installed) on port 5433, like docker-compose.yml ---
PGCONF=$(ls /etc/postgresql/*/main/postgresql.conf 2>/dev/null | head -1)
if [ -n "$PGCONF" ] && ! grep -q "^port = 5433" "$PGCONF"; then
  sed -i "s/^#\?port = [0-9]*/port = 5433/" "$PGCONF"
fi
service postgresql start >/dev/null 2>&1 || service postgresql restart >/dev/null 2>&1
for _ in $(seq 1 20); do su postgres -c "pg_isready -p 5433" >/dev/null 2>&1 && break; sleep 1; done
if ! su postgres -c "psql -p 5433 -tAc \"SELECT 1 FROM pg_roles WHERE rolname='deepdev'\"" | grep -q 1; then
  log "creating database roles and databases"
  su postgres -c "psql -p 5433 -v ON_ERROR_STOP=1" <<'SQL'
CREATE ROLE deepdev LOGIN PASSWORD 'deepdev' CREATEDB;
CREATE DATABASE deepdev OWNER deepdev;
SQL
  # Same as server/docker/postgres-init.sql (app_user, test database).
  su postgres -c "psql -p 5433 -d deepdev -v ON_ERROR_STOP=1" < server/docker/postgres-init.sql
fi

# --- Redis 7 (pre-installed) on port 6380 ---
redis-cli -p 6380 ping >/dev/null 2>&1 || redis-server --port 6380 --daemonize yes >/dev/null

# --- Dependencies (skipped while package files are unchanged) ---
install_if_changed() {
  local dir=$1 hashes=$1/node_modules/.cloud-install.sha256
  if ! (cd "$dir" && sha256sum --check --status "node_modules/.cloud-install.sha256" 2>/dev/null); then
    log "npm ci in $dir"
    rm -f "$hashes"
    (cd "$dir" && npm ci --no-audit --no-fund) && (cd "$dir" && sha256sum package.json package-lock.json > node_modules/.cloud-install.sha256)
  fi
}
install_if_changed client
install_if_changed server

# --- API database ---
cd server
[ -f .env ] || cp .env.example .env
npx prisma generate >/dev/null 2>&1
npx prisma migrate deploy >/dev/null 2>&1 && log "migrations applied"
if [ "$(PGPASSWORD=deepdev psql -h localhost -p 5433 -U deepdev -d deepdev -tAc 'SELECT count(*) FROM organization' 2>/dev/null)" = "0" ]; then
  npx prisma db seed >/dev/null 2>&1 && log "demo data seeded (password deepdev123)"
fi
log "ready: run 'npm run dev' in server/ (API :4000) and 'NEXT_PUBLIC_API_MODE=api npm run dev' in client/"
exit 0
