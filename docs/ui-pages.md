# UI routes and API usage

## Branding and installable web app

- **Product name:** Budget — lightweight spend tracker (ease of use).
- **Static assets:** `frontend/public/img/icon.png` — favicon and `apple-touch-icon`. **PWA manifest** uses `icon-192.png` and `icon-512.png` (exact pixel sizes); regenerate with `scripts/generate-pwa-icons.sh` after changing `icon.png`. Mismatched manifest `sizes` vs real image dimensions break Chromium installability (`beforeinstallprompt` may never fire).
- **Metadata:** `frontend/index.html` sets title, description, theme color, and Apple / mobile web-app meta tags for “Add to Home Screen”.
- **Manifest:** `frontend/public/manifest.webmanifest` — stable `id`, `standalone` display, `start_url` `/`, icons as above.
- **Minimal service worker:** `frontend/public/sw.js` — `install`/`activate` + `fetch` that always uses the network (**no caching**). Registered from `main.tsx` via `registerServiceWorker()` in `frontend/src/lib/pwa.ts` (early `DOMContentLoaded` registration, `updateViaCache: "none"`). **Secure context required:** `https://`, `http://localhost`, or `http://127.0.0.1`. Plain `http://` on a LAN IP often cannot register a service worker, so install prompts will not appear.
- **Offline UX:** `AppLayout` listens for `online`/`offline` and shows a non-blocking banner (`isOffline()` in `pwa.ts`) explaining that a connection is required; API data is not available offline.
- **PWA install UX:** `PwaInstallBanner` — Chromium: listens for `beforeinstallprompt` and shows **Install**; if that event does not fire (~4.5s), shows menu-based instructions. **Firefox** does not support `beforeinstallprompt`; banner explains **menu → Install**. iOS Safari: “Add to Home Screen” tip. All hidden in standalone / installed mode; `appinstalled` clears the deferred prompt state.

Shared **month** state (URL query `?month=YYYY-MM` or React context synced with URL) for Dashboard and Expenses. The header shows a label like **March - 2026** via `formatMonthDisplay()` in `frontend/src/lib/month.ts` (full month name, ` - `, year, UTC).

| Route | Page | API calls |
|-------|------|-----------|
| `/` | Dashboard | `GET /api/dashboard?month`, `GET /api/recurring-expenses/status?month`, `GET /api/expenses?month`, `GET /api/categories`, `POST /api/expenses` (quick-add + recurring log), `GET /api/app-settings` (currency display) |
| `/expenses` | Expenses | `GET /api/expenses?month`, `PATCH/DELETE /api/expenses/:id`, month selector |
| `/wishlist` | Wishlist | `GET /api/wishlist`, `POST /api/wishlist`, `PATCH/DELETE /api/wishlist/:id`, `POST /api/wishlist/:id/purchase`, `GET /api/categories`, `GET /api/app-settings` |
| `/settings` | Settings | `GET/PATCH /api/app-settings`, `POST /api/auth/change-password`, `GET/POST/PATCH/DELETE /api/categories`, `PUT /api/categories/:id/budget`, `GET/POST/PATCH/DELETE /api/recurring-expenses` |
| `/account` | Login / signup only (no nav link) | `GET /api/auth/me` on app load; `POST /api/auth/login`, `signup`. Logged-in visits redirect to `/`. Log out lives under **Settings → Account**. |

**Settings composition:** `frontend/src/pages/SettingsPage.tsx` loads data and handlers; **Account** (username, change password, log out) in `frontend/src/settings/SettingsAccountSection.tsx`; **Categories** in `frontend/src/settings/SettingsCategoriesSection.tsx`; **Recurring** in `frontend/src/settings/SettingsRecurringSection.tsx`. Currency options come from `frontend/src/settings/currencies.ts`.

**Auth:** `frontend/src/context/AuthContext.tsx` loads `/api/auth/me` on startup. `RequireAuth` wraps the main shell (`AppShell` = `CurrencyProvider` + `MonthProvider` + `AppLayout`). Unauthenticated users are redirected to `/account`.

**Bottom navigation:** Four tabs — Home, Expenses, Wishlist, Settings (no separate Account tab; account actions are under **Settings**).

## Responsive notes (Expenses list)

- Rows use `flex-nowrap` with **truncated** expense name and category pill; amount and actions stay on one line per band (compact padding on small screens).
- Notes truncate to one line when present.

## Responsive notes (Settings categories)

- Each category is a **single horizontal row**: fixed-width truncated name, flexible budget input, compact Save / Del actions (no wrapping).

## Dashboard UX

- Recurring buttons: show only **incomplete** for selected month by default; toggle **Show hidden** reveals completed for review.
- Quick-add: pick category (button), amount, optional note; date defaults to today.
