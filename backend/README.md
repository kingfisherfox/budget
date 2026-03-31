# Budget — API

Express 4 + TypeScript + Prisma + PostgreSQL. Entry: `src/index.ts`, app factory `src/app.ts`.

## Commands

```bash
npm install
npx prisma generate
npx prisma migrate dev    # or migrate deploy in CI/prod
npm run dev               # tsx watch src/index.ts
npm run build && npm start # compile to dist/, run node dist/index.js
```

## Environment

- **`DATABASE_URL`** — required (PostgreSQL connection string).
- **`BUDGET_ADMIN_USERNAME`** / **`BUDGET_ADMIN_PASSWORD`** — required; **no signup** — `src/lib/envUser.ts` syncs one user before the server listens. Invalid/missing values **exit the process**. See repo root **`.env.example`**. `dotenv` loads **`backend/.env`** when you run from this directory.

**Auth overview:** **[`../README.md`](../README.md)** (Authentication section) and **[`../docs/deployment.md`](../docs/deployment.md)**.

## Documentation

Schema and REST contract: **[`../docs/entities.md`](../docs/entities.md)**, **[`../docs/api.md`](../docs/api.md)**. Deployment and Docker: **[`../docs/deployment.md`](../docs/deployment.md)**.
