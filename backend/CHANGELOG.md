# Changelog

All notable changes to the Gajian Aman backend will be documented in this file.

## Changes

### Date: 2026-07-05

#### Added
- **Structured logging** with Uber Zap (`pkg/logger/logger.go`)
  - Context-aware logging: `logger.Info(ctx, "msg", "key", value)`
  - Integrated into all bot error handlers
- **Currency utilities** (`pkg/utils/currency.go`)
  - `Normalize(amount)` - multiply by 100 for DB storage (5000 → 500000)
  - `Denormalize(amount)` - divide by 100 for display (500000 → 5000)
  - `FormatIDR(amount)` - proper Indonesian format with decimals ("Rp 5.000.000,00")
  - `FormatIDRCompact(amount)` - without decimals ("Rp 5.000.000")
  - `ParseAmount(raw)` - strict number parsing (no jt/rb/k shortcuts)
- **Unit tests** for currency functions (`pkg/utils/currency_test.go`)
- **Unit tests** for transaction repository (`internal/repository/transaction_test.go`)

#### Changed
- **Currency formatting V2** - switched from shorthand (15k, 1.5jt) to proper Indonesian Rupiah format
  - `service.FormatCurrencyV2` now outputs "Rp 5.000.000" instead of "Rp 5jt"
- **Amount parsing V2** - strict parsing without shortcuts
  - `parser.ParseAmountV2` accepts only numeric input (15000, 15.000, 15,000)
  - Old `parser.ParseAmount` kept but deprecated
- **Repository layer** - all amounts normalized/denormalized automatically
  - `transaction.go` - normalize on Create, denormalize on all SELECTs
  - `budget.go` - normalize/denormalize for budget amounts
  - `goal.go` - normalize/denormalize for goal amounts
  - `account.go` - normalize/denormalize for balance

#### Fixed
- **PostgreSQL parameter type error** - `pq: could not determine data type of parameter $2`
  - Converted all `uuid.UUID` to `.String()` in repository queries
  - Required by lib/pq driver with PgBouncer transaction pooling
