# Deployment and local development

## Environment

- **Backend:** `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@db:5432/expenses`).
- **Frontend build:** `VITE_API_URL` — **Recommended: leave unset** so the browser calls `/api/...` on the same host as the SPA (nginx proxies to Node). If you set it, use **origin only** (`https://budget.example.com`) or origin + `/api` — the client strips a duplicate `/api` if both base and path include it. **Never** set `VITE_API_URL` to `https://host/api` while paths are also `/api/...` without this app’s normalizer, or you get `/api/api/...` and **404**s.

## Auth migration (existing databases)

Migration `20260331124500_add_users_sessions_scoping` creates user **`owner`** with password **`password123`** (bcrypt) and assigns all existing categories and settings to that user. **Change the password in Settings after first login.** New installs can instead sign up a new user from `/account` (empty DB) or use `npm run db:seed` for a fresh `owner` only when no users exist.

## Docker Compose (development with hot reload)

From repo root:

```bash
docker compose up --build
```

After changing **backend or frontend** `package.json`, either run `docker compose up` (the dev commands run `npm install` on start so the `node_modules` volume picks up new deps) or rebuild: `docker compose build api web`. If the API container crashes on startup, check `docker compose logs api` — missing modules usually mean the image/volume predates a dependency add.

Services: `db`, `api`, and `web` share an explicit **`budget-net`** bridge network (see `docker-compose.yml`). **Only `web`** publishes a host port: **`8081` → `8080`** (Vite). The **API is not exposed** on the host; the browser uses `http://localhost:8081` (or your tunnel to `server:8081`) and same-origin **`/api/...`**; Vite proxies to **`http://api:4000`** over `budget-net`, where the hostname `api` resolves to the API container.

**Tunnel use case:** Point the tunnel at **`server:8081` only**. Do not tunnel port 4000 unless you intentionally want the API public. Postgres **`5432`** is optional on the host for local tools — comment it out in `docker-compose.yml` on a production server if you want DB unreachable from outside Docker.

**Reverse proxies (e.g. Pangolin):** Forward `Cookie` and `Set-Cookie` for `/api` so session auth works. PWA install still benefits from unauthenticated static asset paths as documented in `ui-pages.md`.

## Production: 502 / 404 on `/api/auth/*`

| Symptom | Likely cause |
|--------|----------------|
| **502** on `GET /api/auth/me` | Nginx (or tunnel) **cannot reach** the Node API: wrong `proxy_pass` host/port, API not running, firewall, or API not on the same Docker network as nginx (`api` hostname only works inside Compose). |
| **404** on `POST /api/auth/signup` | Request is **not** proxied to Express — it hits the **static** `location /` and `try_files` / `index.html` (POST often ends up **404**). Or URL is wrong (e.g. double `/api` — see `VITE_API_URL` above). |
| **404** on `/api/auth/me` (Express JSON `Not found`, `x-powered-by: Express`) | **Vite dev proxy:** the **`web`** service env **`API_URL`** must be **`http://api:4000`** with **no** `/api` suffix. A value like `http://api:4000/api` can produce `/api/api/...` on the API and no route match. Check: `docker exec <web-container> printenv API_URL`. Sanity: `docker exec <api-container> wget -qO- http://127.0.0.1:4000/api/auth/me` → `{"user":null}`. |

**Checklist**

1. From the machine running nginx: `curl -sS http://<api-host>:4000/health` → `{ "ok": true }`. If this fails, fix the API process first.
2. Through the public URL: `curl -sS https://your-domain/health` — if you use the optional [`frontend/nginx.conf`](../frontend/nginx.conf) `location = /health`, this confirms nginx → API routing.
3. `curl -sS -X POST https://your-domain/api/auth/signup -H 'Content-Type: application/json' -d '{"username":"x","password":"y"}'` — expect `201` or validation error JSON, **not** HTML or 404.
4. In [`frontend/nginx.conf`](../frontend/nginx.conf), `proxy_pass http://api:4000` requires a Compose (or Docker) service named **`api`**. On a bare VM, change to `http://127.0.0.1:4000` (or your API listen address) and reload nginx.
5. **Pangolin / edge auth:** Ensure `/api` is routed to the same upstream as your API and is not blocked or returning an error page as 502.

## Local development (hot reload)

1. Start Postgres (or `docker compose up db`).
2. Backend: `cd backend && npm install && npx prisma migrate dev && npm run dev`
3. Frontend: `cd frontend && npm install && npm run dev`
4. Set `DATABASE_URL` in `backend/.env`; frontend `vite.config` proxies `/api` to backend.

## Scripts (`/scripts`)

Tracked shell helpers; see [`scripts/.gitignore`](../scripts/.gitignore) for patterns that stay **uncommitted** (local overrides, `output/`, etc.).

- **`scripts/db-migrate.sh`** — `DATABASE_URL=... ./scripts/db-migrate.sh` from repo root runs `prisma migrate deploy` in `backend/`.
- **`scripts/generate-pwa-icons.sh`** — macOS `sips`: rebuilds `frontend/public/img/icon-192.png` and `icon-512.png` from `icon.png` after you change the master icon (required for correct PWA manifest sizes).

## Tests (`/tests`)

Integration tests hit a **real Postgres** database and **wipe** related tables in `beforeEach`. Use a dev database only.

From `backend/` with Postgres reachable (Compose publishes **db:5432** to the host):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenses" npm test
```

- Source: [`tests/api.test.ts`](../tests/api.test.ts)
- Config: `backend/vitest.config.ts`
- Artifacts (coverage, logs, `tmp/`) are listed in [`tests/.gitignore`](../tests/.gitignore) and root `.gitignore`; **do not commit** those outputs.
