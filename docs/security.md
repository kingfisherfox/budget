# Security notes

## Axios supply chain (March 2026)

Malicious npm releases **axios@1.14.1** and **axios@0.30.4** were published; installs could run hostile **postinstall** behavior. Treat any machine that installed those versions as potentially compromised: rotate credentials (npm tokens, cloud keys, SSH), scan the system, and follow current vendor guidance.

### This repository

- **Budget does not list `axios` as a dependency.** The SPA uses the browser **`fetch` API** (`frontend/src/api/client.ts`). Backend HTTP is Express; tests use **supertest**.
- **`backend/package.json`** and **`frontend/package.json`** include an **`overrides`** entry pinning **`axios` to `1.14.0`** so a future transitive dependency cannot resolve the known-bad versions without an explicit lockfile review.

### If you add `axios` later

- Stay on a **known-good** release (e.g. **1.14.0** on the 1.x line, or **0.30.3** on the 0.x line) until upstream publishes a verified fix beyond the compromised builds.
- Run **`npm ls axios`** in **`backend/`** and **`frontend/`** after **`npm install`** and confirm the tree does not show **1.14.1** or **0.30.4**.
