# Deployment and local development

## Compose files and git

- **[`docker-compose.yml`](../docker-compose.yml)** is **tracked** in git so installs and contributors share the same stacks.
- **`docker-compose.override.yml`** is **gitignored**. If you need machine-only ports or env, add that file next to `docker-compose.yml`; Compose loads it automatically when present ([Docker Compose merge](https://docs.docker.com/compose/how-tos/multiple-compose-files/)).

## Authentication

- **No signup API** and **no in-app password change.** The only user is defined by **`BUDGET_ADMIN_USERNAME`** / **`BUDGET_ADMIN_PASSWORD`**.
- The API runs **`syncEnvUser()`** on startup (see `backend/src/lib/envUser.ts`): creates the user if missing, or **updates the bcrypt hash** from the env password every time. If env vars are missing or invalid, the process **exits** with an error.
- **`npm run db:seed`** (`prisma/seed.ts`) also calls the same sync — seed requires the same env vars.
- **Sessions:** `budget_session` cookie; logout clears the server row and cookie.

## Environment

**[`.env.example`](../.env.example)** is **committed** to the repo and is included in a normal **`git clone`**. Copy it to **`.env`** in the project root (or set the same variables in your host / Unraid template). Docker Compose reads `.env` for **`${VAR}` substitution** in `docker-compose.yml` (e.g. **`BUDGET_ADMIN_*`** only in the default setup). If the file is missing after clone, run **`git ls-files .env.example`** — if empty, run **`git add -f .env.example`** once (a global ignore rule may have blocked it) and push again.

- **`DATABASE_URL` (Docker Compose):** Set **inside [`docker-compose.yml`](../docker-compose.yml)** on the **`api`** service (`postgresql://postgres:postgres@db:5432/expenses`). The hostname **`db`** is the Compose service name on the internal network. Root **`.env` does not need `DATABASE_URL`** for the stack; it is **not** auto-injected into containers unless you add `env_file` or `environment: ${DATABASE_URL}`.
- **`DATABASE_URL` (API on your machine):** If you run the backend with **`npm run dev`** on the host while Postgres runs in Docker with port **5432** published, put **`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expenses`** in **`backend/.env`** (see **`backend/.env.example`**).
- **`BUDGET_ADMIN_USERNAME`** — Single app user (3–64 chars, `[a-zA-Z0-9_-]+`), stored lowercase. On every API start, this user is **created** if missing or **updated** (password hash refreshed from env).
- **`BUDGET_ADMIN_PASSWORD`** — Plain password in `.env` (8–128 chars). **Change the default before exposing the app.** To rotate: edit `.env`, restart the API (hash is re-synced from env). There is **no** signup and **no** in-app password change.
- **Frontend build:** `VITE_API_URL` — **Recommended: leave unset** so the browser calls `/api/...` on the same host as the SPA (nginx proxies to Node). If you set it, use **origin only** (`https://budget.example.com`) or origin + `/api` — the client strips a duplicate `/api` if both base and path include it. **Never** set `VITE_API_URL` to `https://host/api` while paths are also `/api/...` without this app’s normalizer, or you get `/api/api/...` and **404**s.

**Docker Compose defaults:** If `BUDGET_ADMIN_USERNAME` / `BUDGET_ADMIN_PASSWORD` are unset in `.env`, compose uses **`owner`** / **`password123`** (development only — set real values in `.env` for production).


## Docker Compose (production / public release)

Default **[`docker-compose.yml`](../docker-compose.yml)** is intended for **fresh installs** and production-like runs:

- **`web`:** Built SPA served by **nginx** inside the image. Host **`8081` → container `80`**. The browser loads the app on **`http://localhost:8081`**; **`/api`** is proxied to the **`api`** service (see [`frontend/nginx.conf`](../frontend/nginx.conf)).
- **`api`:** **Compiled** Node app (`runner` image stage). On **every container start**, the entrypoint runs **`npx prisma migrate deploy`**, then starts the server. That is **expected**: on a new database it applies all migrations once; on an already-migrated database it is a **no-op**. It is **not** the same as `migrate dev` (which creates migrations).
- **`db`:** Postgres 16 with a named volume **`pgdata`**.

From repo root:

```bash
docker compose up --build
```

After dependency changes in `package.json`, run **`docker compose up --build`** (or `docker compose build` then `up`) so images pick up new lockfiles.

**Hardening on a server:** Comment out or remove the **`5432:5432`** port mapping on **`db`** if you do not need host access to Postgres. Point reverse proxies at **`8081`** (or map `web` to `80:80` and use your edge TLS). Do not expose the API port on the host unless you intend to; nginx talks to **`api:4000`** on the internal network.

## Docker Compose (development with hot reload)

From repo root:

```bash
docker compose up --build
```

- **`web`:** Vite dev server; host **`8081` → `8080`**. **`API_URL=http://api:4000`** for the Vite proxy.
- **`api`:** **`npm run dev`** after `migrate deploy`.

After changing **backend or frontend** `package.json`, the start script runs **`npm install`**; you can also rebuild images.

**Tunnel use case:** Point the tunnel at **`server:8081` only**. Do not tunnel port 4000 unless you intentionally want the API public.

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
