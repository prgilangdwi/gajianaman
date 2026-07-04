package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
)

type TransactionRepository struct {
	db *sqlx.DB
}

func NewTransactionRepository(db *sqlx.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

type CreateTransactionParams struct {
	UserID       uuid.UUID
	AccountID    uuid.UUID
	CategoryID   uuid.UUID
	GoalID       uuid.NullUUID
	Amount       float64
	Type         model.TransactionType
	Note         string
	Date         time.Time
	Source       model.TxSource
	AIConfidence *float64
}

func (r *TransactionRepository) Create(ctx context.Context, p CreateTransactionParams) (*model.Transaction, error) {
	id := uuid.New()
	var aiConf sql.NullFloat64
	if p.AIConfidence != nil {
		aiConf = sql.NullFloat64{Float64: *p.AIConfidence, Valid: true}
	}

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO transactions (id, user_id, account_id, category_id, goal_id, amount, type, note, date, source, ai_confidence)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		id, p.UserID, p.AccountID, p.CategoryID, p.GoalID, p.Amount, p.Type, p.Note, p.Date, p.Source, aiConf)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *TransactionRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error) {
	var tx model.Transaction
	err := r.db.GetContext(ctx, &tx,
		`SELECT id, user_id, account_id, category_id, goal_id, amount, type, note, date, source, ai_confidence, created_at, updated_at, deleted_at
		 FROM transactions WHERE id = $1 AND deleted_at IS NULL`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *TransactionRepository) GetLast(ctx context.Context, userID uuid.UUID) (*model.Transaction, error) {
	var tx model.Transaction
	err := r.db.GetContext(ctx, &tx,
		`SELECT id, user_id, account_id, category_id, goal_id, amount, type, note, date, source, ai_confidence, created_at, updated_at, deleted_at
		 FROM transactions WHERE user_id = $1 AND deleted_at IS NULL
		 ORDER BY created_at DESC LIMIT 1`, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *TransactionRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE transactions SET deleted_at = NOW() WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

func (r *TransactionRepository) UpdateCategory(ctx context.Context, id uuid.UUID, categoryID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE transactions SET category_id = $2 WHERE id = $1`, id, categoryID)
	return err
}

type TodayStats struct {
	Expense float64 `db:"expense"`
	Income  float64 `db:"income"`
	TxCount int     `db:"tx_count"`
}

func (r *TransactionRepository) GetTodayStats(ctx context.Context, userID uuid.UUID) (*TodayStats, error) {
	var stats TodayStats
	err := r.db.GetContext(ctx, &stats,
		`SELECT
			COALESCE(SUM(CASE WHEN type = 0 THEN amount ELSE 0 END), 0) as expense,
			COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE 0 END), 0) as income,
			COUNT(*) as tx_count
		 FROM transactions
		 WHERE user_id = $1 AND date = CURRENT_DATE AND deleted_at IS NULL`, userID)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

type CategorySummary struct {
	Category string  `db:"category"`
	Total    float64 `db:"total"`
	Count    int     `db:"count"`
}

func (r *TransactionRepository) GetMonthlySummary(ctx context.Context, userID uuid.UUID, month, year int) ([]CategorySummary, error) {
	var rows []CategorySummary
	err := r.db.SelectContext(ctx, &rows,
		`SELECT c.name as category, SUM(t.amount) as total, COUNT(*) as count
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.type = 0 AND t.deleted_at IS NULL
		   AND EXTRACT(MONTH FROM t.date) = $2
		   AND EXTRACT(YEAR FROM t.date) = $3
		 GROUP BY c.name
		 ORDER BY total DESC`, userID, month, year)
	return rows, err
}

func (r *TransactionRepository) GetMonthlyIncome(ctx context.Context, userID uuid.UUID, month, year int) (float64, error) {
	var total float64
	err := r.db.GetContext(ctx, &total,
		`SELECT COALESCE(SUM(amount), 0)
		 FROM transactions
		 WHERE user_id = $1 AND type = 1 AND deleted_at IS NULL
		   AND EXTRACT(MONTH FROM date) = $2
		   AND EXTRACT(YEAR FROM date) = $3`, userID, month, year)
	return total, err
}

func (r *TransactionRepository) GetDailySummary(ctx context.Context, userID uuid.UUID, date time.Time) ([]CategorySummary, error) {
	var rows []CategorySummary
	err := r.db.SelectContext(ctx, &rows,
		`SELECT c.name as category, SUM(t.amount) as total, COUNT(*) as count
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.type = 0 AND t.deleted_at IS NULL AND t.date = $2
		 GROUP BY c.name
		 ORDER BY total DESC`, userID, date)
	return rows, err
}

func (r *TransactionRepository) GetDailyIncome(ctx context.Context, userID uuid.UUID, date time.Time) (float64, error) {
	var total float64
	err := r.db.GetContext(ctx, &total,
		`SELECT COALESCE(SUM(amount), 0)
		 FROM transactions
		 WHERE user_id = $1 AND type = 1 AND deleted_at IS NULL AND date = $2`, userID, date)
	return total, err
}

type TransactionWithCategory struct {
	model.Transaction
	CategoryName string `db:"category_name"`
}

func (r *TransactionRepository) ListByMonth(ctx context.Context, userID uuid.UUID, month, year, limit int) ([]TransactionWithCategory, error) {
	var rows []TransactionWithCategory
	err := r.db.SelectContext(ctx, &rows,
		`SELECT t.id, t.user_id, t.account_id, t.category_id, t.goal_id, t.amount, t.type, t.note, t.date, t.source, t.ai_confidence, t.created_at, t.updated_at, t.deleted_at, c.name as category_name
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.deleted_at IS NULL
		   AND EXTRACT(MONTH FROM t.date) = $2
		   AND EXTRACT(YEAR FROM t.date) = $3
		 ORDER BY t.date DESC, t.id DESC
		 LIMIT $4`, userID, month, year, limit)
	return rows, err
}

func (r *TransactionRepository) ListByDate(ctx context.Context, userID uuid.UUID, date time.Time) ([]TransactionWithCategory, error) {
	var rows []TransactionWithCategory
	err := r.db.SelectContext(ctx, &rows,
		`SELECT t.id, t.user_id, t.account_id, t.category_id, t.goal_id, t.amount, t.type, t.note, t.date, t.source, t.ai_confidence, t.created_at, t.updated_at, t.deleted_at, c.name as category_name
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.date = $2 AND t.deleted_at IS NULL
		 ORDER BY t.id DESC`, userID, date)
	return rows, err
}

func (r *TransactionRepository) ListRecent(ctx context.Context, userID uuid.UUID, limit int) ([]TransactionWithCategory, error) {
	var rows []TransactionWithCategory
	err := r.db.SelectContext(ctx, &rows,
		`SELECT t.id, t.user_id, t.account_id, t.category_id, t.goal_id, t.amount, t.type, t.note, t.date, t.source, t.ai_confidence, t.created_at, t.updated_at, t.deleted_at, c.name as category_name
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.deleted_at IS NULL
		 ORDER BY t.created_at DESC
		 LIMIT $2`, userID, limit)
	return rows, err
}

func (r *TransactionRepository) GetHourlyCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT COUNT(*)
		 FROM transactions
		 WHERE user_id = $1 AND deleted_at IS NULL
		   AND created_at >= NOW() - INTERVAL '1 hour'`, userID)
	return count, err
}
