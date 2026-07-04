# Gajian Aman — Go Backend

Go rewrite of the Gajian Aman Telegram bot, replacing the Python implementation.

## Stack

| Concern | Library |
|---------|---------|
| Database | PostgreSQL (Supabase) |
| DB Driver | `lib/pq` |
| Query Builder | `jmoiron/sqlx` |
| Migrations | `golang-migrate/migrate` |
| Telegram | `go-telegram-bot-api` (TBD) |
| Scheduler | `robfig/cron` (TBD) |
| UUID | `google/uuid` (v7) |

## Project Structure

```
backend/
├── cmd/
│   ├── bot/main.go           # Telegram bot entrypoint
│   └── migrate/main.go       # Migration CLI
├── internal/
│   ├── config/config.go      # Environment config
│   ├── db/
│   │   ├── db.go             # Database connection (sqlx)
│   │   └── migrations/       # SQL migration files
│   ├── handler/              # Telegram command handlers (TBD)
│   ├── model/
│   │   ├── enums.go          # AccountType, TransactionType, etc.
│   │   ├── models.go         # DB model structs
│   │   └── uuid.go           # UUID v7 generator
│   └── service/              # Business logic (TBD)
└── pkg/
    └── telegram/             # Telegram helpers (TBD)
```

## Database Schema v2

Complete redesign from v1. Key changes:

- **UUID v7 primary keys** — time-ordered, no sequential leaks
- **Accounts table** — track cash, bank, e-wallet, credit card separately
- **Proper foreign keys** — categories referenced by ID, not string
- **Subcategories via self-reference** — `categories.parent_id`
- **Recurring transactions** — bills, subscriptions with frequency
- **Goals linked to transactions** — `transactions.goal_id` for automatic tracking
- **Soft delete** — `deleted_at` on all tables
- **Audit timestamps** — `created_at`, `updated_at` with auto-trigger
- **Enums as integers** — stored as `SMALLINT`, mapped in Go code

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (Telegram ID or email) |
| `accounts` | Wallets — cash, bank, e-wallet, credit card |
| `categories` | Transaction categories (system + user-defined) |
| `transactions` | All income/expense/transfer records |
| `budgets` | Monthly budget per category |
| `goals` | Savings goals with target amount |
| `recurring_transactions` | Scheduled recurring bills |

### Enum Mappings

```go
// AccountType: 0=cash, 1=bank, 2=ewallet, 3=credit_card
// TransactionType: 0=expense, 1=income, 2=transfer
// TxSource: 0=telegram, 1=web, 2=import
// Frequency: 0=daily, 1=weekly, 2=monthly, 3=yearly
```

## Migrations

Using `golang-migrate` with a CLI tool (not auto-run on startup).

### Commands

```bash
cd backend

# Apply all pending migrations
go run ./cmd/migrate up

# Rollback last migration
go run ./cmd/migrate down

# Rollback N migrations
go run ./cmd/migrate down -steps=3

# Show current version
go run ./cmd/migrate version

# Force set version (fix dirty state)
go run ./cmd/migrate force 1

# Drop all tables
go run ./cmd/migrate drop
```

### Creating New Migrations

Add files in `internal/db/migrations/`:

```
000002_add_tags.up.sql
000002_add_tags.down.sql
```

Naming: `{version}_{description}.{up|down}.sql`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BOT_TOKEN` | Yes | Telegram bot token |
| `ANTHROPIC_API_KEY` | No | For AI categorization |

Example `.env`:

```env
DATABASE_URL=postgres://user:pass@host:5432/dbname?sslmode=require
BOT_TOKEN=123456:ABC-xyz
ANTHROPIC_API_KEY=sk-ant-...
```

## Development

```bash
# Install dependencies
go mod tidy

# Run migrations
go run ./cmd/migrate up

# Run bot
go run ./cmd/bot

# Build binaries
go build -o bin/bot ./cmd/bot
go build -o bin/migrate ./cmd/migrate
```

## TODO

- [ ] Telegram bot handlers (`/start`, `/add`, `/income`, etc.)
- [ ] Repository layer for CRUD operations
- [ ] Claude Haiku integration for categorization
- [ ] Image parsing for receipts
- [ ] Scheduler for recurring transactions
- [ ] Weekly report cron job
