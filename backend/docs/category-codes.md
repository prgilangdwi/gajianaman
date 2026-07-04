# Category Code System

## Overview

Categories now use a `code` field for database queries instead of the display `name`. This provides cleaner queries, avoids special character issues, and ensures consistent lookups.

## Code Format

- **Uppercase with underscores**: `FOOD_AND_DINING`, `BILLS_AND_UTILITIES`
- **No special characters**: Ampersands (`&`) become `AND`, spaces become `_`
- **Conversion function**: `NameToCode("Food & Dining")` → `"FOOD_AND_DINING"`

## Default Categories

### Expense
| Code | Display Name |
|------|--------------|
| `FOOD_AND_DINING` | Food & Dining |
| `GROCERIES` | Groceries |
| `TRANSPORT` | Transport |
| `SHOPPING` | Shopping |
| `HEALTH` | Health |
| `ENTERTAINMENT` | Entertainment |
| `BILLS_AND_UTILITIES` | Bills & Utilities |
| `EDUCATION` | Education |
| `PERSONAL_CARE` | Personal Care |
| `DINING_OUT` | Dining Out |
| `SAVINGS` | Savings |
| `INVESTMENT` | Investment |
| `OTHER` | Other |

### Income
| Code | Display Name |
|------|--------------|
| `SALARY` | Salary |
| `FREELANCE` | Freelance |
| `INVESTMENT_RETURN` | Investment Return |
| `OTHER_INCOME` | Other Income |

### Transfer
| Code | Display Name |
|------|--------------|
| `TRANSFER` | Transfer |

## Database Schema

```sql
ALTER TABLE categories ADD COLUMN code TEXT NOT NULL;

-- Unique index for global categories
CREATE UNIQUE INDEX idx_categories_code_global
    ON categories(code)
    WHERE user_id IS NULL AND deleted_at IS NULL;

-- Index for user-specific categories
CREATE INDEX idx_categories_code_user
    ON categories(user_id, code)
    WHERE user_id IS NOT NULL AND deleted_at IS NULL;
```

## Migration

Run the migration to add the `code` column:

```bash
# Apply migration
psql $DATABASE_URL -f migrations_v2/000002_add_category_code.up.sql

# Seed default categories (if needed)
cd backend && go run cmd/seed/main.go
```

## Repository Usage

```go
// Query by code (preferred)
cat, err := categoryRepo.GetByCode(ctx, userID, "FOOD_AND_DINING", model.TypeExpense)

// Query by name (backward compatible - converts to code internally)
cat, err := categoryRepo.GetByName(ctx, userID, "Food & Dining", model.TypeExpense)

// Get fallback "Other" category
other, err := categoryRepo.GetOtherCategory(ctx, model.TypeExpense)
```

## AI Categorizer

The AI categorizer now returns `category_code` instead of `category`:

```go
type CategorizationResult struct {
    CategoryCode string  `json:"category_code"`  // e.g., "FOOD_AND_DINING"
    Subcategory  string  `json:"subcategory"`
    Type         string  `json:"type"`
    Confidence   float64 `json:"confidence"`
    Reason       string  `json:"reason"`
}
```

## Display Names

Use `CodeToDisplayName()` to convert codes back to human-readable names:

```go
import "github.com/prgilangdwi/gajianaman/internal/service"

displayName := service.CodeToDisplayName("FOOD_AND_DINING")
// Returns: "Food & Dining"
```

## Files Changed

| File | Changes |
|------|---------|
| `internal/model/models.go` | Added `Code` field to Category struct |
| `internal/repository/category.go` | Added `GetByCode`, `NameToCode`, `CodeToName` |
| `internal/service/categorizer.go` | Returns `category_code` from AI |
| `internal/service/formatter.go` | Added `CodeToDisplayName()` helper |
| `internal/bot/*.go` | Updated to use category codes |
| `cmd/seed/main.go` | Seeds categories with codes |
