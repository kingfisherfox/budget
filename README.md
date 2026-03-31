# Budget

A simple mobile-friendly app to log spending, set category budgets, track recurring bills, and use a wishlist. Runs in the browser; you can install it as a PWA.

## Get started

**Requirements:** [Docker](https://docs.docker.com/get-docker/) and Docker Compose.

1. Copy **[`.env.example`](.env.example)** to **`.env`** in this folder and set a **password** (and username if you like). See `.env.example` for the variable names.
2. Start the stack:

```bash
docker compose up
```

3. Open **http://localhost:8081** in your browser.
4. Sign in at **`/account`** using the **username and password** you put in `.env`.

If you change dependencies, run `docker compose up --build` once.

To stop: `Ctrl+C` or `docker compose down`.

**Developers (hot reload):** `docker compose -f docker-compose.dev.yml up --build` — see [`docs/deployment.md`](docs/deployment.md).

---

**More help:** configuration, production hosting, API details, and database notes are in **[`docs/`](docs/README.md)** (start with [`docs/deployment.md`](docs/deployment.md)).
