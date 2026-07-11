package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/pkg/generator"
	"github.com/prgilangdwi/gajianaman/pkg/utils"
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
	id := generator.NewUUID()
	var aiConf sql.NullFloat64
	if p.AIConfidence != nil {
		aiConf = sql.NullFloat64{Float64: *p.AIConfidence, Valid: true}
	}

	// Convert GoalID to sql.NullString for proper NULL handling
	var goalID sql.NullString
	if p.GoalID.Valid {
		goalID = sql.NullString{String: p.GoalID.UUID.String(), Valid: true}
	}

	// Normalize amount for storage (multiply by 100)
	normalizedAmount := utils.Normalize(p.Amount)

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO transactions (id, user_id, account_id, category_id, goal_id, amount, type, note, date, source, ai_confidence)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		id.String(), p.UserID.String(), p.AccountID.String(), p.CategoryID.String(), goalID, normalizedAmount, p.Type, p.Note, p.Date, p.Source, aiConf)
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *TransactionRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error) {
	var tx model.Transaction
	err := r.db.GetContext(ctx, &tx,
		`SELECT id, user_id, account_id, category_id, goal_id, amount, type, note, date, source, ai_confidence, created_at, updated_at, deleted_at
		 FROM transactions WHERE id = $1 AND deleted_at IS NULL`, id.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	// Denormalize amount (divide by 100)
	tx.Amount = utils.Denormalize(int64(tx.Amount))
	return &tx, nil
}

func (r *TransactionRepository) GetLast(ctx context.Context, userID uuid.UUID) (*model.Transaction, error) {
	var tx model.Transaction
	err := r.db.GetContext(ctx, &tx,
		`SELECT id, user_id, account_id, category_id, goal_id, amount, type, note, date, source, ai_confidence, created_at, updated_at, deleted_at
		 FROM transactions WHERE user_id = $1 AND deleted_at IS NULL
		 ORDER BY created_at DESC LIMIT 1`, userID.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	// Denormalize amount
	tx.Amount = utils.Denormalize(int64(tx.Amount))
	return &tx, nil
}

func (r *TransactionRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE transactions SET deleted_at = NOW() WHERE id = $1 AND user_id = $2`, id.String(), userID.String())
	return err
}

func (r *TransactionRepository) UpdateCategory(ctx context.Context, id uuid.UUID, categoryID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE transactions SET category_id = $2 WHERE id = $1`, id.String(), categoryID.String())
	return err
}

func (r *TransactionRepository) Update(ctx context.Context, tx *model.Transaction) error {
	normalizedAmount := utils.Normalize(tx.Amount)
	_, err := r.db.ExecContext(ctx,
		`UPDATE transactions
		 SET account_id = $2, category_id = $3, amount = $4, type = $5, note = $6, date = $7, updated_at = NOW()
		 WHERE id = $1 AND deleted_at IS NULL`,
		tx.ID.String(), tx.AccountID.String(), tx.CategoryID.String(), normalizedAmount, tx.Type, tx.Note, tx.Date)
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
		 WHERE user_id = $1 AND date = CURRENT_DATE AND deleted_at IS NULL`, userID.String())
	if err != nil {
		return nil, err
	}
	// Denormalize amounts
	stats.Expense = utils.Denormalize(int64(stats.Expense))
	stats.Income = utils.Denormalize(int64(stats.Income))
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
		 ORDER BY total DESC`, userID.String(), month, year)
	// Denormalize amounts
	for i := range rows {
		rows[i].Total = utils.Denormalize(int64(rows[i].Total))
	}
	return rows, err
}

func (r *TransactionRepository) GetMonthlyIncome(ctx context.Context, userID uuid.UUID, month, year int) (float64, error) {
	var total float64
	err := r.db.GetContext(ctx, &total,
		`SELECT COALESCE(SUM(amount), 0)
		 FROM transactions
		 WHERE user_id = $1 AND type = 1 AND deleted_at IS NULL
		   AND EXTRACT(MONTH FROM date) = $2
		   AND EXTRACT(YEAR FROM date) = $3`, userID.String(), month, year)
	// Denormalize amount
	return utils.Denormalize(int64(total)), err
}

func (r *TransactionRepository) GetDailySummary(ctx context.Context, userID uuid.UUID, date time.Time) ([]CategorySummary, error) {
	var rows []CategorySummary
	err := r.db.SelectContext(ctx, &rows,
		`SELECT c.name as category, SUM(t.amount) as total, COUNT(*) as count
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.type = 0 AND t.deleted_at IS NULL AND t.date = $2
		 GROUP BY c.name
		 ORDER BY total DESC`, userID.String(), date)
	// Denormalize amounts
	for i := range rows {
		rows[i].Total = utils.Denormalize(int64(rows[i].Total))
	}
	return rows, err
}

func (r *TransactionRepository) GetDailyIncome(ctx context.Context, userID uuid.UUID, date time.Time) (float64, error) {
	var total float64
	err := r.db.GetContext(ctx, &total,
		`SELECT COALESCE(SUM(amount), 0)
		 FROM transactions
		 WHERE user_id = $1 AND type = 1 AND deleted_at IS NULL AND date = $2`, userID.String(), date)
	// Denormalize amount
	return utils.Denormalize(int64(total)), err
}

type TransactionWithCategory struct {
	model.Transaction
	CategoryName string `db:"category_name"`
}

type PaginatedResult struct {
	Items []TransactionWithCategory
	Total int
}

func (r *TransactionRepository) ListByMonthPaginated(ctx context.Context, userID uuid.UUID, month, year, page, limit int) (*PaginatedResult, error) {
	offset := (page - 1) * limit

	// Get total count
	var total int
	err := r.db.GetContext(ctx, &total,
		`SELECT COUNT(*)
		 FROM transactions t
		 WHERE t.user_id = $1 AND t.deleted_at IS NULL
		   AND EXTRACT(MONTH FROM t.date) = $2
		   AND EXTRACT(YEAR FROM t.date) = $3`, userID.String(), month, year)
	if err != nil {
		return nil, err
	}

	// Get paginated items
	var rows []TransactionWithCategory
	err = r.db.SelectContext(ctx, &rows,
		`SELECT t.id, t.user_id, t.account_id, t.category_id, t.goal_id, t.amount, t.type, t.note, t.date, t.source, t.ai_confidence, t.created_at, t.updated_at, t.deleted_at, c.name as category_name
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.deleted_at IS NULL
		   AND EXTRACT(MONTH FROM t.date) = $2
		   AND EXTRACT(YEAR FROM t.date) = $3
		 ORDER BY t.date DESC, t.id DESC
		 LIMIT $4 OFFSET $5`, userID.String(), month, year, limit, offset)
	if err != nil {
		return nil, err
	}

	// Denormalize amounts
	for i := range rows {
		rows[i].Amount = utils.Denormalize(int64(rows[i].Amount))
	}

	return &PaginatedResult{Items: rows, Total: total}, nil
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
		 LIMIT $4`, userID.String(), month, year, limit)
	// Denormalize amounts
	for i := range rows {
		rows[i].Amount = utils.Denormalize(int64(rows[i].Amount))
	}
	return rows, err
}

func (r *TransactionRepository) ListByDate(ctx context.Context, userID uuid.UUID, date time.Time) ([]TransactionWithCategory, error) {
	var rows []TransactionWithCategory
	err := r.db.SelectContext(ctx, &rows,
		`SELECT t.id, t.user_id, t.account_id, t.category_id, t.goal_id, t.amount, t.type, t.note, t.date, t.source, t.ai_confidence, t.created_at, t.updated_at, t.deleted_at, c.name as category_name
		 FROM transactions t
		 JOIN categories c ON t.category_id = c.id
		 WHERE t.user_id = $1 AND t.date = $2 AND t.deleted_at IS NULL
		 ORDER BY t.id DESC`, userID.String(), date)
	// Denormalize amounts
	for i := range rows {
		rows[i].Amount = utils.Denormalize(int64(rows[i].Amount))
	}
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
		 LIMIT $2`, userID.String(), limit)
	// Denormalize amounts
	for i := range rows {
		rows[i].Amount = utils.Denormalize(int64(rows[i].Amount))
	}
	return rows, err
}

func (r *TransactionRepository) GetHourlyCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT COUNT(*)
		 FROM transactions
		 WHERE user_id = $1 AND deleted_at IS NULL
		   AND created_at >= NOW() - INTERVAL '1 hour'`, userID.String())
	return count, err
}
