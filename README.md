# Budget

**Budget** is a lightweight, mobile-first spend tracker: quick logging, category budgets, recurring and “common” spends, wishlist → expense, and dashboard charts. Stack: **React 19 + Vite + Tailwind** (frontend), **Express + Prisma + PostgreSQL** (backend).

## Features

- **Accounts** — Username / password (bcrypt). Session cookie `budget_session`. Sign up or log in at **`/account`** when the app redirects you; **Settings → Account** has change password and **Log out**.
- **Per-user data** — Categories, expenses, recurring templates, wishlist, and app settings (currency, domain hint) are scoped to the logged-in user.
- **Dashboard** — Month selector, budget vs actual, daily spend chart, category breakdown (Recharts), quick-add and recurring/common buttons.
- **Expenses** — Month-filtered list with edit/delete; compact rows on small screens.
- **Wishlist** — Save items; **Purchase** creates an expense and removes the item.
- **Settings** — Currency, domain name (PWA/tunnel hint), categories + budgets, recurring/common templates, account card (password + logout).
- **PWA** — `manifest.webmanifest`, `icon-192.png` / `icon-512.png`, minimal `sw.js` (network-only fetch). Install banner + browser-specific hints. See [`docs/ui-pages.md`](docs/ui-pages.md).

## Documentation

| Doc | Purpose |
|-----|---------|
| **[docs/README.md](docs/README.md)** | Index of all docs |
| [docs/api.md](docs/api.md) | HTTP API |
| [docs/entities.md](docs/entities.md) | Database models |
| [docs/ui-pages.md](docs/ui-pages.md) | Routes, PWA, UI structure |
| [docs/deployment.md](docs/deployment.md) | Docker, env, migrations, tests, proxies |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (for the recommended dev path), **or** Node 22+, Postgres 16, and npm for local `backend` / `frontend` dev.

## Quick start (Docker Compose)

From the repo root (where `docker-compose.yml` lives):

```bash
docker compose up
```

On first run after **dependency changes**, images may need rebuilding: `docker compose up --build`. Dev containers run **`npm install`** on start so `node_modules` volumes stay aligned with `package.json` (see [docs/deployment.md](docs/deployment.md)).

- **App:** http://localhost:8081 — Vite proxies `/api` to the API inside the compose network.
- **Postgres:** port **5432** published to the host for local Prisma/tests.

Stop: `Ctrl+C` or `docker compose down`.

### After upgrading from pre-auth databases

Migration `20260331124500_add_users_sessions_scoping` creates user **`owner`** / password **`password123`**. Sign in, then **change the password** under Settings → Account. Empty databases can use **Sign up** on `/account` instead. Details: [docs/deployment.md](docs/deployment.md).

## Project layout

```
├── backend/          # Express API, Prisma schema & migrations
├── frontend/         # Vite React app
├── docs/             # API, entities, UI, deployment (source of truth)
├── scripts/          # db-migrate.sh, generate-pwa-icons.sh (+ .gitignore for local junk)
├── tests/            # API integration tests (+ .gitignore for coverage/tmp)
├── docker-compose.yml
└── README.md
```

## Local dev without Docker (summary)

1. Postgres running; `DATABASE_URL` in `backend/.env`.
2. `cd backend && npm install && npx prisma migrate dev && npm run dev`
3. `cd frontend && npm install && npm run dev` — Vite defaults proxy `/api` to `http://localhost:4000`.

## Tests

Wipes data in `beforeEach` — **never** point at production.

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenses" npm test
```

## Git ignore: `scripts/` and `tests/`

Root [`.gitignore`](.gitignore) and per-folder [`scripts/.gitignore`](scripts/.gitignore) / [`tests/.gitignore`](tests/.gitignore) ignore **local outputs and overrides only** (e.g. `*.local.*`, `coverage/`, `tmp/`, logs). **Committed** files such as `scripts/db-migrate.sh`, `scripts/generate-pwa-icons.sh`, and `tests/api.test.ts` remain tracked.

## Production notes

- Serve the **built** frontend (`frontend/dist`) and reverse-proxy **`/api`** to the Node API, forwarding **cookies** for auth.
- Run `npx prisma migrate deploy` before or on API startup.
- Use HTTPS in production; set `NODE_ENV=production` so cookies get the `Secure` flag where appropriate.

---

For deep detail, start at **[docs/README.md](docs/README.md)**.
