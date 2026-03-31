# UI routes and API usage

## Branding and installable web app

- **Product name:** Budget — lightweight spend tracker (ease of use).
- **Static assets:** `frontend/public/img/icon.png` — favicon, `apple-touch-icon`, and PWA manifest icons. Replace this file with the final app icon (512×512 PNG recommended).
- **Metadata:** `frontend/index.html` sets title, description, theme color, and Apple / mobile web-app meta tags for “Add to Home Screen”.
- **Manifest:** `frontend/public/manifest.webmanifest` — `standalone` display, `start_url` `/`, references `/img/icon.png`.
- **Minimal service worker:** `frontend/public/sw.js` — `install`/`activate` + `fetch` that always uses the network (**no caching**). Registered from `main.tsx` via `registerServiceWorker()` in `frontend/src/lib/pwa.ts` so install prompts work on Chromium without offline precaching.
- **Offline UX:** `AppLayout` listens for `online`/`offline` and shows a non-blocking banner (`isOffline()` in `pwa.ts`) explaining that a connection is required; API data is not available offline.
- **PWA install UX:** `PwaInstallBanner` listens for `beforeinstallprompt` (Chromium) and shows an iOS “Add to Home Screen” tip in Safari; both are hidden when `display-mode: standalone` or iOS `navigator.standalone` is true.

Shared **month** state (URL query `?month=YYYY-MM` or React context synced with URL) for Dashboard and Expenses. The header shows a label like **March - 2026** via `formatMonthDisplay()` in `frontend/src/lib/month.ts` (full month name, ` - `, year, UTC).

| Route | Page | API calls |
|-------|------|-----------|
| `/` | Dashboard | `GET /api/dashboard?month`, `GET /api/recurring-expenses/status?month`, `GET /api/expenses?month`, `GET /api/categories`, `POST /api/expenses` (quick-add + recurring log), `GET /api/app-settings` (currency display) |
| `/expenses` | Expenses | `GET /api/expenses?month`, `PATCH/DELETE /api/expenses/:id`, month selector |
| `/wishlist` | Wishlist | `GET /api/wishlist`, `POST /api/wishlist`, `PATCH/DELETE /api/wishlist/:id`, `POST /api/wishlist/:id/purchase`, `GET /api/categories`, `GET /api/app-settings` |
| `/settings` | Settings | `GET/PATCH /api/app-settings`, `GET/POST/PATCH/DELETE /api/categories`, `PUT /api/categories/:id/budget`, `GET/POST/PATCH/DELETE /api/recurring-expenses` |

## Responsive notes (Expenses list)

- Below `md`: show category, amount, date only.
- `md` and up: also show note column.

## Dashboard UX

- Recurring buttons: show only **incomplete** for selected month by default; toggle **Show hidden** reveals completed for review.
- Quick-add: pick category (button), amount, optional note; date defaults to today.
