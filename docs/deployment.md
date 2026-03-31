# Deployment and local development

## Authentication

- **No signup API** and **no in-app password change.** The only user is defined by **`BUDGET_ADMIN_USERNAME`** / **`BUDGET_ADMIN_PASSWORD`**.
- The API runs **`syncEnvUser()`** on startup (see `backend/src/lib/envUser.ts`): creates the user if missing, or **updates the bcrypt hash** from the env password every time. If env vars are missing or invalid, the process **exits** with an error.
- **`npm run db:seed`** (`prisma/seed.ts`) also calls the same sync — seed requires the same env vars.
- **Sessions:** `budget_session` cookie; logout clears the server row and cookie.

## Environment

Copy **[`.env.example`](../.env.example)** to **`.env`** in the project root (or set the same variables in your host / Unraid template). Docker Compose reads `.env` for **`${VAR}` substitution** in `docker-compose.yml` (e.g. **`BUDGET_ADMIN_*`** only in the default setup).

- **`DATABASE_URL` (Docker Compose):** Set **inside [`docker-compose.yml`](../docker-compose.yml)** on the **`api`** service (`postgresql://postgres:postgres@db:5432/expenses`). The hostname **`db`** is the Compose service name on the internal network. Root **`.env` does not need `DATABASE_URL`** for the stack; it is **not** auto-injected into containers unless you add `env_file` or `environment: ${DATABASE_URL}`.
- **`DATABASE_URL` (API on your machine):** If you run the backend with **`npm run dev`** on the host while Postgres runs in Docker with port **5432** published, put **`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expenses`** in **`backend/.env`** (see **`backend/.env.example`**).
- **`BUDGET_ADMIN_USERNAME`** — Single app user (3–64 chars, `[a-zA-Z0-9_-]+`), stored lowercase. On every API start, this user is **created** if missing or **updated** (password hash refreshed from env).
- **`BUDGET_ADMIN_PASSWORD`** — Plain password in `.env` (8–128 chars). **Change the default before exposing the app.** To rotate: edit `.env`, restart the API (hash is re-synced from env). There is **no** signup and **no** in-app password change.
- **Frontend build:** `VITE_API_URL` — **Recommended: leave unset** so the browser calls `/api/...` on the same host as the SPA (nginx proxies to Node). If you set it, use **origin only** (`https://budget.example.com`) or origin + `/api` — the client strips a duplicate `/api` if both base and path include it. **Never** set `VITE_API_URL` to `https://host/api` while paths are also `/api/...` without this app’s normalizer, or you get `/api/api/...` and **404**s.

**Docker Compose defaults:** If `BUDGET_ADMIN_USERNAME` / `BUDGET_ADMIN_PASSWORD` are unset in `.env`, compose uses **`owner`** / **`password123`** (development only — set real values in `.env` for production).


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
| **404** on `POST /api/auth/login` | Request is **not** proxied to Express — it hits the **static** `location /` and `try_files` / `index.html` (POST often ends up **404**). Or URL is wrong (e.g. double `/api` — see `VITE_API_URL` above). |
| **404** on `/api/auth/me` (Express JSON `Not found`, `x-powered-by: Express`) | **Vite dev proxy:** the **`web`** service env **`API_URL`** must be **`http://api:4000`** with **no** `/api` suffix. A value like `http://api:4000/api` can produce `/api/api/...` on the API and no route match. Check: `docker exec <web-container> printenv API_URL`. Sanity: `docker exec <api-container> wget -qO- http://127.0.0.1:4000/api/auth/me` → `{"user":null}`. |
| API exits on startup | Missing or invalid **`BUDGET_ADMIN_USERNAME`** / **`BUDGET_ADMIN_PASSWORD`** — see **`.env.example`** and container logs. |

**Checklist**

1. From the machine running nginx: `curl -sS http://<api-host>:4000/health` → `{ "ok": true }`. If this fails, fix the API process first.
2. Through the public URL: `curl -sS https://your-domain/health` — if you use the optional [`frontend/nginx.conf`](../frontend/nginx.conf) `location = /health`, this confirms nginx → API routing.
3. `curl -sS -X POST https://your-domain/api/auth/login -H 'Content-Type: application/json' -d '{"username":"owner","password":"<from .env>"}'` — expect `200` + `Set-Cookie`, **not** HTML or 404.
4. In [`frontend/nginx.conf`](../frontend/nginx.conf), `proxy_pass http://api:4000` requires a Compose (or Docker) service named **`api`**. On a bare VM, change to `http://127.0.0.1:4000` (or your API listen address) and reload nginx.
5. **Pangolin / edge auth:** Ensure `/api` is routed to the same upstream as your API and is not blocked or returning an error page as 502.

## Local development (hot reload)

1. Start Postgres (or `docker compose up db`).
2. Backend: put **`DATABASE_URL`**, **`BUDGET_ADMIN_USERNAME`**, and **`BUDGET_ADMIN_PASSWORD`** in **`backend/.env`** (see **`.env.example`** at repo root for naming and rules). Then `cd backend && npm install && npx prisma migrate dev && npm run dev`.
3. Frontend: `cd frontend && npm install && npm run dev` — `vite.config` proxies `/api` to the backend.

## `scripts/` and `tests/` (not in git)

Root [`.gitignore`](../.gitignore) excludes **`scripts/`** and **`tests/`**. Nothing under those paths is tracked; keep your own local helpers or tests if you want them.

- **Migrations:** from `backend/` with `DATABASE_URL` set, run `npx prisma migrate deploy` (production/CI) or `npx prisma migrate dev` (development).
- **PWA icons:** `manifest.webmanifest` expects exact **192×192** and **512×512** assets in `frontend/public/img/`. After changing `icon.png`, regenerate `icon-192.png` and `icon-512.png` with your image tooling (or a personal script).
- **Optional Vitest:** `backend/package.json` still defines `npm test` and `backend/vitest.config.ts` points at `../tests/**/*.test.ts`; that only works if you create a local **`tests/`** tree yourself.
