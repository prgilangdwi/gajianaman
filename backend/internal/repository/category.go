package repository

import (
	"context"
	"database/sql"
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
)

type CategoryRepository struct {
	db *sqlx.DB
}

func NewCategoryRepository(db *sqlx.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

// GetByCode finds a category by code (global or user-specific).
// Prefers user-specific category over global if both exist.
func (r *CategoryRepository) GetByCode(ctx context.Context, userID uuid.UUID, code string, txType model.TransactionType) (*model.Category, error) {
	var cat model.Category
	// First try user-specific
	err := r.db.GetContext(ctx, &cat,
		`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
		 FROM categories
		 WHERE code = $1 AND user_id = $2 AND type = $3 AND deleted_at IS NULL
		 LIMIT 1`, code, userID.String(), txType)
	if err == nil {
		return &cat, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	// Fall back to global category
	err = r.db.GetContext(ctx, &cat,
		`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
		 FROM categories
		 WHERE code = $1 AND user_id IS NULL AND type = $2 AND deleted_at IS NULL
		 LIMIT 1`, code, txType)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

// GetByCodeAnyType finds a category by code regardless of type.
func (r *CategoryRepository) GetByCodeAnyType(ctx context.Context, userID uuid.UUID, code string) (*model.Category, error) {
	var cat model.Category
	// First try user-specific
	err := r.db.GetContext(ctx, &cat,
		`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
		 FROM categories
		 WHERE code = $1 AND user_id = $2 AND deleted_at IS NULL
		 LIMIT 1`, code, userID.String())
	if err == nil {
		return &cat, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	// Fall back to global
	err = r.db.GetContext(ctx, &cat,
		`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
		 FROM categories
		 WHERE code = $1 AND user_id IS NULL AND deleted_at IS NULL
		 LIMIT 1`, code)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

// GetByName finds a category by name (for backwards compatibility).
// Converts name to code and searches.
func (r *CategoryRepository) GetByName(ctx context.Context, userID uuid.UUID, name string, txType model.TransactionType) (*model.Category, error) {
	code := NameToCode(name)
	return r.GetByCode(ctx, userID, code, txType)
}

// GetByNameAnyType finds a category by name regardless of type.
func (r *CategoryRepository) GetByNameAnyType(ctx context.Context, userID uuid.UUID, name string) (*model.Category, error) {
	code := NameToCode(name)
	return r.GetByCodeAnyType(ctx, userID, code)
}

func (r *CategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Category, error) {
	var cat model.Category
	err := r.db.GetContext(ctx, &cat,
		`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
		 FROM categories WHERE id = $1 AND deleted_at IS NULL`, id.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

// ListGlobal returns all global (system) categories
func (r *CategoryRepository) ListGlobal(ctx context.Context) ([]model.Category, error) {
	var cats []model.Category
	err := r.db.SelectContext(ctx, &cats,
		`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
		 FROM categories WHERE user_id IS NULL AND deleted_at IS NULL
		 ORDER BY type, name`)
	return cats, err
}

// ListForUser returns global + user-specific categories
func (r *CategoryRepository) ListForUser(ctx context.Context, userID uuid.UUID, txType *model.TransactionType) ([]model.Category, error) {
	var cats []model.Category
	var err error
	if txType != nil {
		err = r.db.SelectContext(ctx, &cats,
			`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
			 FROM categories
			 WHERE (user_id IS NULL OR user_id = $1) AND type = $2 AND deleted_at IS NULL
			 ORDER BY user_id NULLS FIRST, name`, userID.String(), *txType)
	} else {
		err = r.db.SelectContext(ctx, &cats,
			`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
			 FROM categories
			 WHERE (user_id IS NULL OR user_id = $1) AND deleted_at IS NULL
			 ORDER BY user_id NULLS FIRST, type, name`, userID.String())
	}
	return cats, err
}

func (r *CategoryRepository) Create(ctx context.Context, cat *model.Category) error {
	if cat.ID == uuid.Nil {
		cat.ID = uuid.New()
	}
	if cat.Code == "" {
		cat.Code = NameToCode(cat.Name)
	}
	// Convert NullUUID to sql.NullString for proper NULL handling
	var userID, parentID sql.NullString
	if cat.UserID.Valid {
		userID = sql.NullString{String: cat.UserID.UUID.String(), Valid: true}
	}
	if cat.ParentID.Valid {
		parentID = sql.NullString{String: cat.ParentID.UUID.String(), Valid: true}
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO categories (id, user_id, code, name, icon, type, parent_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		cat.ID.String(), userID, cat.Code, cat.Name, cat.Icon, cat.Type, parentID)
	return err
}

// CreateGlobal creates a global category (user_id = NULL)
func (r *CategoryRepository) CreateGlobal(ctx context.Context, code, name, icon string, txType model.TransactionType) (*model.Category, error) {
	cat := &model.Category{
		ID:   uuid.New(),
		Code: code,
		Name: name,
		Icon: icon,
		Type: txType,
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO categories (id, user_id, code, name, icon, type)
		 VALUES ($1, NULL, $2, $3, $4, $5)
		 ON CONFLICT DO NOTHING`,
		cat.ID.String(), cat.Code, cat.Name, cat.Icon, cat.Type)
	if err != nil {
		return nil, err
	}
	return cat, nil
}

// GetOtherCategory returns the "Other" fallback category
func (r *CategoryRepository) GetOtherCategory(ctx context.Context, txType model.TransactionType) (*model.Category, error) {
	var cat model.Category
	err := r.db.GetContext(ctx, &cat,
		`SELECT id, user_id, code, name, icon, type, parent_id, created_at, updated_at, deleted_at
		 FROM categories
		 WHERE code = 'OTHER' AND user_id IS NULL AND type = $1 AND deleted_at IS NULL
		 LIMIT 1`, txType)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

// NameToCode converts a category name to a code.
// "Food & Dining" -> "FOOD_AND_DINING"
func NameToCode(name string) string {
	// Replace & with AND
	code := strings.ReplaceAll(name, "&", "AND")
	// Remove non-alphanumeric except spaces
	reg := regexp.MustCompile(`[^a-zA-Z0-9 ]`)
	code = reg.ReplaceAllString(code, "")
	// Replace spaces with underscores
	code = strings.ReplaceAll(code, " ", "_")
	// Collapse multiple underscores
	reg = regexp.MustCompile(`_+`)
	code = reg.ReplaceAllString(code, "_")
	// Uppercase
	code = strings.ToUpper(code)
	// Trim underscores
	code = strings.Trim(code, "_")
	return code
}

// CodeToName is a map of codes to display names (for known categories)
var CodeToName = map[string]string{
	"FOOD_AND_DINING":    "Food & Dining",
	"GROCERIES":          "Groceries",
	"TRANSPORT":          "Transport",
	"SHOPPING":           "Shopping",
	"HEALTH":             "Health",
	"ENTERTAINMENT":      "Entertainment",
	"BILLS_AND_UTILITIES": "Bills & Utilities",
	"EDUCATION":          "Education",
	"PERSONAL_CARE":      "Personal Care",
	"DINING_OUT":         "Dining Out",
	"OTHER":              "Other",
	"SALARY":             "Salary",
	"FREELANCE":          "Freelance",
	"INVESTMENT_RETURN":  "Investment Return",
	"OTHER_INCOME":       "Other Income",
	"SAVINGS":            "Savings",
	"INVESTMENT":         "Investment",
	"TRANSFER":           "Transfer",
}
