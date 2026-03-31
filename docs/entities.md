# Data entities

Multi-user: each **User** owns categories, settings, and (via categories) expenses, recurring templates, and wishlist items. Passwords are stored as **bcrypt** hashes only.

## User

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| username | String | Unique, stored lowercase |
| passwordHash | String | bcrypt hash |
| createdAt / updatedAt | DateTime | UTC |

## Session

Opaque **token** in httpOnly cookie (`budget_session`); row tracks expiry (30 days). Used to resolve `userId` on each API request. All sessions for a user are deleted on password change.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | FK → User |
| token | String | Unique random string |
| expiresAt | DateTime | UTC |

## AppSettings

One row per user (`userId` primary key).

| Field | Type | Description |
|-------|------|-------------|
| userId | String | PK, FK → User |
| currencyCode | String | ISO 4217; default **THB** |
| domainName | String | Optional PWA / tunnel hint |

## Category

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | FK → User (scopes all child data) |
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
| name | String | Short label |
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
| isCommon | Boolean | If true, multiple expenses per month allowed |
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
