# Deployment and local development

## Environment

- **Backend:** `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@db:5432/expenses`).
- **Frontend build:** `VITE_API_URL` — empty or same-origin; in Docker behind nginx, use relative `/api` (proxy) or full URL to API.

## Docker Compose (production-style)

From repo root:

```bash
docker compose up --build
```

Services: `db` (Postgres), `api` (Express + migrations on start), `web` (nginx + static SPA). API exposed on host port **4000**; web on **8080** (adjust in `docker-compose.yml`).

## Local development (hot reload)

1. Start Postgres (or `docker compose up db`).
2. Backend: `cd backend && npm install && npx prisma migrate dev && npm run dev`
3. Frontend: `cd frontend && npm install && npm run dev`
4. Set `DATABASE_URL` in `backend/.env`; frontend `vite.config` proxies `/api` to backend.

## Scripts

- `scripts/db-migrate.sh` — run Prisma migrate deploy against `DATABASE_URL` (executable; run from repo root).

## Tests

From `backend/` with Postgres available and `DATABASE_URL` set:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenses" npm test
```

Runs integration tests in [`tests/api.test.ts`](../tests/api.test.ts) via Vitest (`backend/vitest.config.ts`).
