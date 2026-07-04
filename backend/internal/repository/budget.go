package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
)

type BudgetRepository struct {
	db *sqlx.DB
}

func NewBudgetRepository(db *sqlx.DB) *BudgetRepository {
	return &BudgetRepository{db: db}
}

func (r *BudgetRepository) Upsert(ctx context.Context, userID, categoryID uuid.UUID, amount float64, month, year int16) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO budgets (id, user_id, category_id, amount, month, year)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (user_id, category_id, month, year)
		 DO UPDATE SET amount = EXCLUDED.amount`,
		uuid.New(), userID, categoryID, amount, month, year)
	return err
}

type BudgetAlert struct {
	Budget float64 `db:"budget"`
	Actual float64 `db:"actual"`
}

func (r *BudgetRepository) CheckAlert(ctx context.Context, userID, categoryID uuid.UUID, month, year int) (*BudgetAlert, error) {
	var alert BudgetAlert
	err := r.db.GetContext(ctx, &alert,
		`SELECT b.amount as budget, COALESCE(SUM(t.amount), 0) as actual
		 FROM budgets b
		 LEFT JOIN transactions t
			ON t.user_id = b.user_id
			AND t.category_id = b.category_id
			AND t.type = 0
			AND t.deleted_at IS NULL
			AND EXTRACT(MONTH FROM t.date) = b.month
			AND EXTRACT(YEAR FROM t.date) = b.year
		 WHERE b.user_id = $1 AND b.category_id = $2
		   AND b.month = $3 AND b.year = $4 AND b.deleted_at IS NULL
		 GROUP BY b.amount`, userID, categoryID, month, year)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &alert, nil
}

type BudgetVsActual struct {
	CategoryName string  `db:"category_name"`
	Budget       float64 `db:"budget"`
	Actual       float64 `db:"actual"`
}

func (r *BudgetRepository) GetBudgetVsActual(ctx context.Context, userID uuid.UUID, month, year int) ([]BudgetVsActual, error) {
	var rows []BudgetVsActual
	err := r.db.SelectContext(ctx, &rows,
		`SELECT c.name as category_name, b.amount as budget, COALESCE(SUM(t.amount), 0) as actual
		 FROM budgets b
		 JOIN categories c ON b.category_id = c.id
		 LEFT JOIN transactions t
			ON t.user_id = b.user_id
			AND t.category_id = b.category_id
			AND t.type = 0
			AND t.deleted_at IS NULL
			AND EXTRACT(MONTH FROM t.date) = b.month
			AND EXTRACT(YEAR FROM t.date) = b.year
		 WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3 AND b.deleted_at IS NULL
		 GROUP BY c.name, b.amount`, userID, month, year)
	return rows, err
}

func (r *BudgetRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Budget, error) {
	var b model.Budget
	err := r.db.GetContext(ctx, &b,
		`SELECT id, user_id, category_id, amount, month, year, created_at, updated_at, deleted_at
		 FROM budgets WHERE id = $1 AND deleted_at IS NULL`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}
