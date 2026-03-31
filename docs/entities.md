# Data entities

The app uses a **single user** row per deployment; credentials are set via **`BUDGET_ADMIN_USERNAME`** / **`BUDGET_ADMIN_PASSWORD`** in the environment (no public signup). Passwords are stored as **bcrypt** hashes only; the API refreshes the hash from env on startup.

## User

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| username | String | Unique, stored lowercase |
| passwordHash | String | bcrypt hash |
| createdAt / updatedAt | DateTime | UTC |

## Session

Opaque **token** in httpOnly cookie (`budget_session`); row tracks expiry (30 days). Used to resolve `userId` on each API request. Sessions are removed on logout or expiry (or if the user row is deleted).

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
| recurringSubcategoryId | String? | If set, which **RecurringSubcategory** was chosen when logging (optional FK); expense **name** is copied from that subcategory at create time |
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

## RecurringSubcategory

Optional “breakdown” labels under a recurring template (e.g. store names **Villa**, **Tops** under **Shopping**). Managed in Settings with the template; when logging from the dashboard, the user picks one subcategory and the created **Expense.name** is that subcategory’s **name**.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| recurringExpenseId | String | FK → RecurringExpense (cascade delete) |
| name | String | Shown in picker; becomes expense name when selected |
| sortOrder | Int | Display order |
| createdAt | DateTime | UTC |

**Rules:** If a template has **one or more** subcategories, `POST /api/expenses` with `recurringExpenseId` **must** include `recurringSubcategoryId` matching a row for that template. Templates with **no** subcategories keep the previous behavior (`name` from client or template name). Replacing subcategories on `PATCH /api/recurring-expenses/:id` deletes old rows and recreates them; existing expenses keep their stored **name**; `recurringSubcategoryId` on old rows is set null if that subcategory row was removed (DB `ON DELETE SET NULL`).

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
