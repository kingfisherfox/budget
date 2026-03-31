# Data entities

Single-tenant app: no user table. All data is global; the API is trusted-network only unless auth is added later.

## AppSettings

Singleton row (`id = 1`).

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Fixed `1` |
| currencyCode | String | ISO 4217 code; default **THB** |

## Category

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Display name |
| color | String? | Optional hex for UI |
| sortOrder | Int | Display order (lower first) |
| createdAt | DateTime | UTC |

## CategoryBudget

One monthly budget cap per category (same amount every month). Actual spend for a calendar month is the sum of `Expense.amount` for that category with `date` in that month.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| categoryId | String | Unique FK → Category |
| monthlyAmount | Decimal | Budget per month (same currency as app) |

## Expense

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| categoryId | String | FK → Category |
| amount | Decimal | Positive spend |
| date | Date | Calendar date only (no time); drives month grouping |
| note | String? | Optional |
| recurringExpenseId | String? | If set, this expense is the logged payment for that recurring template in `date`’s month |
| createdAt | DateTime | UTC |

**Recurring completion:** For month `YYYY-MM`, recurring template `R` is completed if any expense exists with `recurringExpenseId = R.id` and `date` in that month.

## RecurringExpense

Template for a bill; does not store per-month state.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Label for dashboard button |
| categoryId | String | FK → Category |
| defaultAmount | Decimal? | Suggested amount when logging |
| sortOrder | Int | Button order |
| createdAt | DateTime | UTC |

## WishlistItem

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Item label |
| categoryId | String | FK → Category |
| amount | Decimal | Planned amount |
| note | String? | Optional |
| createdAt | DateTime | UTC |

Purchase flow: create an `Expense` with optional amount/date/note override, then **delete** the wishlist row.
