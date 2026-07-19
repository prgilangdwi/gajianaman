# Gajian Aman — Go Backend

Go rewrite of the Gajian Aman Telegram bot.

## Quick Start

```bash
# 1. Copy and edit config
cp config.yaml.example config.yaml
# Edit config.yaml with your actual values

# 2. Build
make build

# 3. Run migrations
make migrate up

# 4. Seed default categories
make seed

# 5. Run bot
make run
```

## Core Packages

### Logger (`pkg/logger`)

Structured logging using Uber's Zap logger.

```go
import "github.com/prgilangdwi/gajianaman/pkg/logger"

// Package-level functions
logger.Info(ctx, "user logged in", "user_id", userID)
logger.Warn(ctx, "rate limit approaching", "user_id", userID, "count", 95)
logger.Error(ctx, "failed to save", "err", err, "user_id", userID)

// Instance with pre-set fields
log := logger.Default().With("service", "bot")
log.Info(ctx, "starting up")
```

### Currency Utils (`pkg/utils`)

Currency normalization, formatting, and parsing for Indonesian Rupiah.

**Normalization** — Amounts are stored as integers (×100) to avoid floating-point issues:
```go
import "github.com/prgilangdwi/gajianaman/pkg/utils"

// Store to DB: multiply by 100
stored := utils.Normalize(5000.00)  // 500000

// Read from DB: divide by 100
display := utils.Denormalize(500000)  // 5000.00
```

**Formatting** — Proper Indonesian Rupiah format:
```go
utils.FormatIDR(5000000)        // "Rp 5.000.000,00"
utils.FormatIDRCompact(5000000) // "Rp 5.000.000"
utils.FormatStoredAmount(500000000) // "Rp 5.000.000" (denormalize + format)
```

**Parsing** — Parse user input (strict, no shortcuts):
```go
amount, ok := utils.ParseAmount("5.000.000")    // 5000000, true
amount, ok := utils.ParseAmount("Rp 1.500,50") // 1500.50, true
stored, ok := utils.ParseAndNormalize("5000")  // 500000, true
```

### Amount Parser (`internal/parser`)

Two versions available:

| Function | Description |
|----------|-------------|
| `ParseAmount` | Legacy — supports shortcuts (5jt, 500k, 15rb) |
| `ParseAmountV2` | Strict — raw numbers only (5.000.000) |

### Currency Formatter (`internal/service`)

Two versions available:

| Function | Output |
|----------|--------|
| `FormatCurrency` | Legacy — "Rp 5jt", "Rp 500k" |
| `FormatCurrencyV2` | Proper — "Rp 5.000.000" |

## Configuration

Config is loaded from `config.yaml` in the current directory. Copy `config.yaml.example` to get started.

```yaml
database:
  host: db.xxxx.supabase.co    # Your database host
  port: 5432
  name: postgres
  user: postgres
  password: your-password       # Replace with actual password

bot:
  token: "123:ABC..."           # Get from @BotFather on Telegram

categorizer:
  provider: anthropic           # "anthropic" or "opencode"
  anthropic_key: sk-ant-...     # Your Anthropic API key
  opencode_url: http://localhost:8080  # Only if using opencode
```

### Environment Overrides

Environment variables override config.yaml values:

| Env Var | Config Key |
|---------|------------|
| `ENV` | Set to `production` for SSL database connections |
| `DB_HOST` | `database.host` |
| `DB_PORT` | `database.port` |
| `DB_NAME` | `database.name` |
| `DB_USER` | `database.user` |
| `DB_PASSWORD` | `database.password` |
| `BOT_TOKEN` | `bot.token` |
| `CATEGORIZER_PROVIDER` | `categorizer.provider` |
| `ANTHROPIC_API_KEY` | `categorizer.anthropic_key` |
| `OPENCODE_BASE_URL` | `categorizer.opencode_url` |

## Makefile Commands

```bash
# Build
make build           # Build all binaries to build/
make build-bot       # Build only bot
make build-migrate   # Build only migrate
make build-seed      # Build only seed

# Run (requires build first)
make run             # Run bot
make migrate up      # Apply migrations
make migrate down    # Rollback last migration
make migrate version # Show current version
make seed            # Seed default categories

# Dev (no build needed, uses go run)
make dev             # Run bot
make dev-migrate up  # Run migrations
make dev-seed        # Run seed

# Other
make clean           # Remove build/
make deps            # go mod tidy
make test            # Run tests
make lint            # Run linter
```

## Testing

```bash
# Run all tests
go test ./...

# Run specific package tests
go test ./pkg/utils/... -v          # Currency utils
go test ./internal/repository/... -v # Repository tests

# Run with coverage
go test ./... -cover

# Run benchmarks
go test ./pkg/utils/... -bench=.
```

### Test Coverage

| Package | Coverage |
|---------|----------|
| `pkg/utils` | Currency normalization, formatting, parsing |
| `internal/repository` | Amount normalization in DB operations |

### Passing Flags

Use `--` to pass flags to the binary:

```bash
make dev-migrate -- up -c ./other-config.yaml
make migrate -- down -steps=3
```

## Project Structure

```
backend/
├── cmd/
│   ├── bot/main.go           # Telegram bot entrypoint
│   ├── migrate/main.go       # Migration CLI
│   └── seed/main.go          # Database seeder
├── internal/
│   ├── bot/                  # Bot handlers and logic
│   │   ├── bot.go            # Main bot struct, lifecycle
│   │   ├── commands.go       # /add, /income, /budget, etc.
│   │   ├── callbacks.go      # Inline keyboard handlers
│   │   ├── messages.go       # Natural language parsing
│   │   ├── photos.go         # Receipt image handling
│   │   └── keyboards.go      # Keyboard builders
│   ├── config/config.go      # Viper config loader
│   ├── db/
│   │   ├── db.go             # Database connection (sqlx)
│   │   └── migrations/       # SQL migration files
│   ├── model/                # DB model structs
│   ├── parser/               # Amount & text parsing
│   │   ├── amount.go         # ParseAmount, ParseAmountV2
│   │   └── natural.go        # Natural language transaction parsing
│   ├── repository/           # Database queries (with normalize/denormalize)
│   │   ├── transaction.go    # Transaction CRUD
│   │   ├── account.go        # Account/wallet CRUD
│   │   ├── budget.go         # Budget CRUD
│   │   ├── goal.go           # Savings goal CRUD
│   │   ├── category.go       # Category lookups
│   │   └── user.go           # User CRUD
│   └── service/              # Business logic
│       ├── categorizer.go    # AI categorization (Claude)
│       ├── formatter.go      # Message formatting
│       └── ...
├── pkg/
│   ├── logger/               # Structured logging (Zap)
│   │   └── logger.go
│   └── utils/                # Shared utilities
│       ├── currency.go       # Normalize, Denormalize, FormatIDR
│       └── currency_test.go
├── build/                    # Compiled binaries (gitignored)
├── config.yaml               # Your config (gitignored)
├── config.yaml.example       # Config template
└── Makefile
```

## Migrations

```bash
# Apply all pending
make migrate up

# Rollback last
make migrate down

# Rollback N migrations
make migrate -- down -steps=3

# Show current version
make migrate version

# Force set version (fix dirty state)
make migrate -- force 1

# Drop all tables (dangerous!)
make migrate -- drop
```

### Creating New Migrations

Add files in `internal/db/migrations/`:

```
000002_add_something.up.sql
000002_add_something.down.sql
```

### Data Migration: Amount Normalization

If you have existing data, run this migration to normalize amounts (×100):

```sql
-- Normalize existing amounts (run once!)
UPDATE transactions SET amount = amount * 100 WHERE amount < 1000000000;
UPDATE budgets SET amount = amount * 100 WHERE amount < 1000000000;
UPDATE goals SET target_amount = target_amount * 100 WHERE target_amount < 1000000000;
UPDATE accounts SET balance = balance * 100 WHERE balance < 1000000000 AND balance > -1000000000;
```

The WHERE clause prevents double-normalization if run multiple times.

## Stack

| Concern | Library |
|---------|---------|
| Config | `spf13/viper` |
| Database | PostgreSQL |
| DB Driver | `lib/pq` + `jmoiron/sqlx` |
| Migrations | `golang-migrate/migrate` |
| Telegram | `go-telegram-bot-api` |
| UUID | `google/uuid` (v7) |
| Logging | `uber-go/zap` |
| AI | Anthropic Claude API |

## Architecture Notes

### Currency Storage

All monetary amounts are stored as **integers** (normalized ×100) to avoid floating-point precision issues:

| User Input | Stored Value | Display |
|------------|--------------|---------|
| 5000 | 500000 | Rp 5.000 |
| 1.500.000 | 150000000 | Rp 1.500.000 |
| 12345.67 | 1234567 | Rp 12.345,67 |

The repository layer handles normalization on INSERT and denormalization on SELECT automatically.

### Logging

All handlers use structured logging with context:

```go
logger.Error(ctx, "failed to create transaction", 
    "err", err, 
    "user_id", user.ID, 
    "amount", amount)
```

Output (dev):
```
ERROR   failed to create transaction   {"err": "...", "user_id": "abc-123", "amount": 50000}
```
