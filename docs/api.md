# HTTP API

Base path: `/api`. JSON bodies and responses unless noted.

## Errors

- `400` — validation error; body `{ "error": string }` or `{ "errors": Record<string, string[]> }`
- `404` — resource not found
- `409` — conflict (e.g. duplicate recurring payment for same month)

## App settings

- `GET /api/app-settings` → `{ id, currencyCode }`
- `PATCH /api/app-settings` body `{ currencyCode: string }` → updated row

## Categories

- `GET /api/categories` → array of `{ id, name, color, sortOrder, createdAt, budget: { monthlyAmount } | null }`
- `POST /api/categories` body `{ name, color?, sortOrder? }` → category (budget null until set)
- `PATCH /api/categories/:id` body partial `{ name?, color?, sortOrder? }`
- `DELETE /api/categories/:id` — fails if referenced (409/400) or cascade per implementation (plan: prevent delete if expenses exist)

## Category budget

- `PUT /api/categories/:id/budget` body `{ monthlyAmount: number }` — upsert budget for category

## Expenses

- `GET /api/expenses?month=YYYY-MM` — expenses in that month, ordered by `date` desc, then `createdAt` desc. Each item includes `category: { id, name }`.
- `GET /api/expenses/:id` — single expense with category
- `POST /api/expenses` body:
  - `categoryId`, `amount`, `date` (ISO date string `YYYY-MM-DD`), `note?`
  - `recurringExpenseId?` — if set, `date` must fall in one month; **at most one** expense per `(recurringExpenseId, calendar month)`; `categoryId` should match template’s category (server may enforce)
- `PATCH /api/expenses/:id` body partial `{ categoryId?, amount?, date?, note? }` — if changing `recurringExpenseId` month conflict, reject 409
- `DELETE /api/expenses/:id`

## Recurring expense templates

- `GET /api/recurring-expenses` — all templates with `category`
- `POST /api/recurring-expenses` body `{ name, categoryId, defaultAmount?, sortOrder? }`
- `PATCH /api/recurring-expenses/:id` partial
- `DELETE /api/recurring-expenses/:id`

### Status for dashboard

- `GET /api/recurring-expenses/status?month=YYYY-MM` → array of `{ id, name, categoryId, defaultAmount, sortOrder, completed: boolean }`

## Wishlist

- `GET /api/wishlist` — items with `category`
- `POST /api/wishlist` body `{ name, categoryId, amount, note? }`
- `PATCH /api/wishlist/:id` partial `{ name?, categoryId?, amount?, note? }`
- `DELETE /api/wishlist/:id`
- `POST /api/wishlist/:id/purchase` body `{ amount: number, date?: string (YYYY-MM-DD), note?: string }` — creates expense (defaults: today, note from item if not provided), deletes wishlist item → `{ expense }`

## Dashboard aggregate

- `GET /api/dashboard?month=YYYY-MM` →

```json
{
  "month": "YYYY-MM",
  "currencyCode": "THB",
  "categories": [
    {
      "categoryId": "",
      "name": "",
      "color": null,
      "budget": 0,
      "actual": 0,
      "variancePercent": null
    }
  ],
  "dailySpend": [{ "date": "YYYY-MM-DD", "total": 0 }],
  "totals": { "budget": 0, "actual": 0 }
}
```

- `variancePercent`: `null` if budget is 0; else `((actual - budget) / budget) * 100`.

## Month validation

Query/body months and dates: `month` must match `^\d{4}-\d{2}$`; expense `date` is `YYYY-MM-DD`.
