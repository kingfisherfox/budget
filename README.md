# Budget

A simple mobile-friendly app to log spending, set category budgets, track recurring bills, and use a wishlist. Runs in the browser; you can install it as a PWA.

## Get started

**Requirements:** [Docker](https://docs.docker.com/get-docker/) and Docker Compose.

1. Clone the repo and from the project root run:

```bash
docker compose up --build
```

2. Open **http://localhost:8081/account**.
3. Use **Sign up** to create the first user (username + password, 8+ characters). Then **Sign in** on later visits.

Postgres is exposed on the host at **port 5961** (`localhost:5961` → container `5432`). The API always connects to the database at **`db:5432`** inside Docker — do not change that in `DATABASE_URL` unless you know what you are doing.

If you change dependencies, run `docker compose up --build` once.

To stop: `Ctrl+C` or `docker compose down`.

---

**Security:** This app does not use **axios** (see [`docs/security.md`](docs/security.md)). Dependency trees pin any transitive **axios** to **1.14.0** via **`package.json` `overrides`**.

**More help:** [`docs/deployment.md`](docs/deployment.md) (Docker, database URL, troubleshooting), [`docs/api.md`](docs/api.md), [`docs/README.md`](docs/README.md).
