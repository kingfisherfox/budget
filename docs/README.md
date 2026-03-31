# Documentation index

Source of truth for behavior beyond inline code. Update these when you change APIs, schema, routes, deployment, or auth.

## Authentication model

The app is **single-tenant per deployment**: one logical user, **no signup**. Credentials come from **`BUDGET_ADMIN_USERNAME`** and **`BUDGET_ADMIN_PASSWORD`** in the environment. The API **syncs** the user row (bcrypt hash) on every startup; invalid or missing env vars cause the process to **exit**. See repo root **[`.env.example`](../.env.example)** and **[`deployment.md`](deployment.md)** (environment + migration notes for legacy `owner` user).

| Document | Contents |
|----------|----------|
| [api.md](api.md) | REST routes, **auth** (`/me`, `login`, `logout`), request/response shapes, errors |
| [entities.md](entities.md) | Prisma models: **User**, **Session**, **AppSettings**, **Category**, **CategoryBudget**, **Expense**, **RecurringExpense**, **RecurringSubcategory**, **WishlistItem** |
| [ui-pages.md](ui-pages.md) | Frontend routes, PWA/install, **dashboard category pie drill-down**, recurring subcategories, Settings composition |
| [deployment.md](deployment.md) | Docker Compose, **env vars**, migrations, reverse proxies, troubleshooting |

**Root [README.md](../README.md)** — authentication overview, features, quick start, project layout, production checklist.

**Package readmes:** [frontend/README.md](../frontend/README.md) (Vite dev/build), [backend/README.md](../backend/README.md) (Prisma, `npm` scripts, env).
