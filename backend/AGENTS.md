# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (no build needed)
make dev                          # Run Telegram bot
make dev-api                      # Run REST API server (port 8080)
make dev-api CONFIG=./prod.yaml   # Run with custom config
make dev-migrate up               # Apply database migrations
make dev-seed                     # Seed default categories

# Build & Run
make build            # Build all binaries to build/
make run              # Run bot (requires build)
make run-api          # Run API server (requires build)

# Testing
go test ./...                        # All tests
go test ./pkg/utils/... -v           # Specific package
go test ./internal/repository/... -v # Repository tests

# OpenAPI
make swagger          # Generate swagger.json from go-swagger comments
make swagger-ui       # Serve Swagger UI at http://localhost:8081/docs
```

## Architecture

Two services share the same database and service layer:

1. **Telegram Bot** (`cmd/bot/`) — Handles `/add`, `/income`, `/budget` commands via `internal/bot/`
2. **REST API** (`cmd/api/`) — HTTP endpoints for web frontend via `internal/handler/`

### Data Flow

```
Bot/API → Service Layer → Repository → PostgreSQL (Supabase)
              ↓
         AI Categorizer (Claude Haiku)
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `internal/bot/` | Telegram handlers, keyboards, callbacks |
| `internal/handler/` | HTTP handlers with go-swagger annotations |
| `internal/service/` | Business logic (categorization, formatting, accounts, transactions, ledger) |
| `internal/repository/` | Database queries with amount normalization |
| `internal/model/` | Domain structs and enums |
| `pkg/generator/` | UUID v7 generation |
| `pkg/utils/` | Currency formatting and normalization |

## Conventions

### UUID v7

Always use `generator.NewUUID()` and `generator.ParseUUID()` from `pkg/generator/uuid.go`. Never use `uuid.New()` (v4) — UUID v7 is lexicographically sorted for better database indexing.

### Amount Normalization

All monetary amounts are stored as integers (×100) to avoid floating-point issues:

```go
import "github.com/prgilangdwi/gajianaman/pkg/utils"

// Store to DB
stored := utils.Normalize(5000.00)  // 500000

// Read from DB  
display := utils.Denormalize(500000)  // 5000.00

// Format for display
utils.FormatIDR(5000000)  // "Rp 5.000.000,00"
```

Repository layer handles normalization on INSERT and denormalization on SELECT automatically.

### Ledger (Double-Entry Bookkeeping)

The ledger system tracks all balance changes for accounts using double-entry bookkeeping:

```go
// LedgerEntry tracks a single balance change
type LedgerEntry struct {
    ID              uuid.UUID     // UUID v7
    AccountID       uuid.UUID     // Account affected
    TransactionID   uuid.NullUUID // Optional link to transaction
    Type            LedgerType    // "credit" or "debit"
    Amount          float64       // Change amount
    StartingBalance float64       // Balance before this entry
    EndingBalance   float64       // Balance after this entry
    CreatedAt       time.Time
}
```

**Key concepts:**
- `credit` — Money flowing INTO an account (income, transfer in)
- `debit` — Money flowing OUT of an account (expense, transfer out)
- Each transaction creates corresponding ledger entries
- Account balances are derived from ledger entry chain

**API endpoints:**
```
GET /api/ledger?account_id={uuid}&start_date=2026-01-01&end_date=2026-01-31
```

### Pagination

List endpoints support pagination via query params:

```
GET /api/transactions?page=2&limit=20&month=7&year=2026
```

Repository pattern for paginated queries:
```go
// Returns PaginatedResult with Items and Total count
result, err := repo.ListByMonthPaginated(ctx, userID, month, year, page, limit)
```

### API Response Structure

All API responses use a standardized envelope:

**Success (200, 201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": { ... }
}
```

**List with pagination:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 50, "total": 200 }
}
```

**Error (400, 401, 404, 500):**
```json
{
  "success": false,
  "message": "Invalid account ID",
  "error": "INVALID_ACCOUNT_ID"
}
```

**Response helpers** in `internal/handler/response.go`:
```go
RespondSuccess(w, http.StatusCreated, "Account created", data)
RespondList(w, "Transactions retrieved", data, page, limit, total)
RespondError(w, http.StatusBadRequest, "Invalid ID", ErrInvalidAccountID)
RespondNoContent(w)
```

**Error codes** in `internal/handler/errors.go` — use constants like `ErrUnauthorized`, `ErrAccountNotFound`, etc.

### Client Source Header

The `X-Client-Source` header identifies request origin. Middleware extracts it to context:

```go
// In handler:
source := GetSourceFromContext(r.Context())  // model.SourceWeb, SourceTelegram, SourceImport
```

Valid values: `web` (default), `telegram`, `import`

### OpenAPI / go-swagger

HTTP handlers use go-swagger comment annotations for OpenAPI spec generation:

```go
// swagger:route POST /api/accounts accounts createAccount
//
// Create a new account.
//
// Creates a new financial account for the authenticated user.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  201: accountResponse
//	  400: errorResponse
func (h *AccountHandler) Create(w http.ResponseWriter, r *http.Request) {
```

**Key files:**
- `internal/handler/doc.go` — Package-level swagger meta (title, version, security definitions)
- `internal/handler/types.go` — Request/response DTOs with `swagger:model` and `swagger:response` annotations
- `internal/handler/response.go` — Response envelope types and helpers
- `internal/handler/errors.go` — Error code constants
- `swagger.json` — Generated spec (run `make swagger` to regenerate)

**Commands:**
```bash
make swagger      # Generate swagger.json
make swagger-ui   # Serve Swagger UI at http://localhost:8081/docs
```

### Logging

Use structured logging with context:

```go
import "github.com/prgilangdwi/gajianaman/pkg/logger"

logger.Info(ctx, "user logged in", "user_id", userID)
logger.Error(ctx, "failed to save", "err", err, "user_id", userID)
```

## Configuration

Config loaded from `config.yaml`. Environment variables override config values:

| Env Var | Config Key |
|---------|------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `database.*` |
| `BOT_TOKEN` | `bot.token` |
| `API_PORT` | `api.port` |
| `SUPABASE_JWT_SECRET` | `api.supabase_jwt_secret` |
| `ANTHROPIC_API_KEY` | `categorizer.anthropic_key` |

## Migrations

Migration files in `internal/db/migrations/` with format `NNNNNN_name.up.sql` / `NNNNNN_name.down.sql`.

```bash
make dev-migrate up           # Apply all pending
make dev-migrate down         # Rollback last
make dev-migrate -- down -steps=3  # Rollback N
make dev-migrate version      # Show current version
```
