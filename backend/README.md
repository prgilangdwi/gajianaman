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
│   ├── config/config.go      # Viper config loader
│   ├── db/
│   │   ├── db.go             # Database connection (sqlx)
│   │   └── migrations/       # SQL migration files
│   ├── model/                # DB model structs
│   ├── repository/           # Database queries
│   └── service/              # Business logic
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

## Stack

| Concern | Library |
|---------|---------|
| Config | `spf13/viper` |
| Database | PostgreSQL |
| DB Driver | `lib/pq` + `jmoiron/sqlx` |
| Migrations | `golang-migrate/migrate` |
| Telegram | `go-telegram-bot-api` |
| UUID | `google/uuid` (v7) |
