#!/usr/bin/env bash
# One-command local setup for Helikon (macOS / Linux).
#
#   ./setup.sh           first run, or re-run any time: steps already done are skipped
#   ./setup.sh --start   same, then starts the app (pnpm dev)
#   ./setup.sh --fresh   deletes the local database and uploads (asks first)
#
# Needs: Node 24, Docker Desktop (running). pnpm is enabled through Corepack if missing.
set -euo pipefail
cd "$(dirname "$0")"

START=false
FRESH=false
for arg in "$@"; do
  case "$arg" in
    --start) START=true ;;
    --fresh) FRESH=true ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "Nepoznata opcija: $arg (pogledaj ./setup.sh --help)"; exit 1 ;;
  esac
done

bold() { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✔\033[0m %s\n" "$1"; }
fail() { printf "  \033[31m✘ %s\033[0m\n" "$1"; exit 1; }

psql_db() { docker compose exec -T db psql -U helikon -d "$1" -tAc "$2" 2>/dev/null | tr -d '[:space:]'; }

bold "1/6 Provjera alata"
command -v node >/dev/null || fail "Node nije instaliran. Instaliraj Node 24."
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" = "24" ] || fail "Potreban je Node 24, a sada je $(node -v)."
command -v pnpm >/dev/null || corepack enable >/dev/null 2>&1 || fail "pnpm nije instaliran, a 'corepack enable' nije uspio."
command -v docker >/dev/null || fail "Docker nije instaliran. Instaliraj Docker Desktop."
docker info >/dev/null 2>&1 || fail "Docker ne radi. Pokreni Docker Desktop pa ponovo ./setup.sh"
ok "Node $(node -v), pnpm $(pnpm -v), Docker"

bold "2/6 .env"
if [ ! -f .env ]; then
  SECRET=$(openssl rand -base64 32 | tr -d '\n/+=')
  # macOS and Linux sed differ in -i; write through a temp file instead
  sed "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=\"$SECRET\"|" .env.example > .env.tmp && mv .env.tmp .env
  ok ".env napravljen iz .env.example (sa novim BETTER_AUTH_SECRET)"
else
  ok ".env već postoji (ne mijenjam ga)"
fi

bold "3/6 Postgres, Mailpit i S3 (Docker)"
if $FRESH; then
  printf "  Ovo BRIŠE lokalnu bazu i slike. Upiši 'obrisi' za nastavak: "
  read -r answer
  [ "$answer" = "obrisi" ] || fail "Prekinuto. Ništa nije obrisano."
  docker compose down -v
fi
docker compose up -d --wait
[ "$(psql_db postgres "select count(*) from pg_database where datname='helikon_test'")" = "1" ] \
  || docker compose exec -T db psql -U helikon -d postgres -c 'CREATE DATABASE helikon_test' >/dev/null
ok "Postgres (5435), Mailpit (http://localhost:8026), S3 (9100)"

bold "4/6 Paketi"
pnpm install
ok "Paketi instalirani"

bold "5/6 Migracije"
pnpm -s db:migrate
ok "Tabele spremne"

bold "6/6 Admin korisnik"
USERS=$(psql_db helikon 'select count(*) from "user"' || echo 0)
if [ "${USERS:-0}" != "0" ]; then
  ok "Korisnici već postoje ($USERS). Novi: pnpm user:create"
else
  echo "  Napravi svoj admin nalog (uloga ADMINISTRATOR):"
  pnpm -s user:create
fi

if $START; then pnpm dev; fi
