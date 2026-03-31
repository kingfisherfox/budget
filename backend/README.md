# Budget — API

Express 4 + TypeScript + Prisma + PostgreSQL. Entry: `src/index.ts`, app factory `src/app.ts`.

## Commands

```bash
npm install
npx prisma generate
npx prisma migrate dev    # or migrate deploy in CI/prod
npm run dev               # tsx watch src/index.ts
npm run build && npm start # compile to dist/, run node dist/index.js
npm test                  # Vitest; see repo ../tests/ and ../docs/deployment.md
```

## Environment

- **`DATABASE_URL`** — required (PostgreSQL connection string).

## Documentation

Schema and REST contract: **[`../docs/entities.md`](../docs/entities.md)**, **[`../docs/api.md`](../docs/api.md)**. Deployment and Docker: **[`../docs/deployment.md`](../docs/deployment.md)**.
