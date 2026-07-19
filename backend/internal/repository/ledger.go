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

type LedgerRepository struct {
	db *sqlx.DB
}

func NewLedgerRepository(db *sqlx.DB) *LedgerRepository {
	return &LedgerRepository{db: db}
}

type LedgerPaginatedResult struct {
	Items []model.LedgerEntry
	Total int
}

func (r *LedgerRepository) Create(ctx context.Context, entry *model.LedgerEntry) error {
	if entry.ID == uuid.Nil {
		entry.ID = generator.NewUUID()
	}

	var txID sql.NullString
	if entry.TransactionID.Valid {
		txID = sql.NullString{String: entry.TransactionID.UUID.String(), Valid: true}
	}

	// Normalize amounts for storage
	normalizedAmount := utils.Normalize(entry.Amount)
	normalizedStarting := utils.Normalize(entry.StartingBalance)
	normalizedEnding := utils.Normalize(entry.EndingBalance)

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO ledger_entries (id, account_id, transaction_id, type, amount, starting_balance, ending_balance)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		entry.ID.String(), entry.AccountID.String(), txID, entry.Type, normalizedAmount, normalizedStarting, normalizedEnding)
	return err
}

func (r *LedgerRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.LedgerEntry, error) {
	var entry model.LedgerEntry
	err := r.db.GetContext(ctx, &entry,
		`SELECT id, account_id, transaction_id, type, amount, starting_balance, ending_balance, created_at
		 FROM ledger_entries WHERE id = $1`, id.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	r.denormalize(&entry)
	return &entry, nil
}

func (r *LedgerRepository) GetByIDForUser(ctx context.Context, id, userID uuid.UUID) (*model.LedgerEntry, error) {
	var entry model.LedgerEntry
	err := r.db.GetContext(ctx, &entry,
		`SELECT l.id, l.account_id, l.transaction_id, l.type, l.amount, l.starting_balance, l.ending_balance, l.created_at
		 FROM ledger_entries l
		 JOIN accounts a ON l.account_id = a.id
		 WHERE l.id = $1 AND a.user_id = $2 AND a.deleted_at IS NULL`, id.String(), userID.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	r.denormalize(&entry)
	return &entry, nil
}

func (r *LedgerRepository) GetByTransaction(ctx context.Context, txID uuid.UUID) (*model.LedgerEntry, error) {
	var entry model.LedgerEntry
	err := r.db.GetContext(ctx, &entry,
		`SELECT id, account_id, transaction_id, type, amount, starting_balance, ending_balance, created_at
		 FROM ledger_entries WHERE transaction_id = $1`, txID.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	r.denormalize(&entry)
	return &entry, nil
}

func (r *LedgerRepository) ListByAccount(ctx context.Context, accountID uuid.UUID, page, limit int) (*LedgerPaginatedResult, error) {
	offset := (page - 1) * limit

	var total int
	err := r.db.GetContext(ctx, &total,
		`SELECT COUNT(*) FROM ledger_entries WHERE account_id = $1`, accountID.String())
	if err != nil {
		return nil, err
	}

	var entries []model.LedgerEntry
	err = r.db.SelectContext(ctx, &entries,
		`SELECT id, account_id, transaction_id, type, amount, starting_balance, ending_balance, created_at
		 FROM ledger_entries WHERE account_id = $1
		 ORDER BY created_at DESC, id DESC
		 LIMIT $2 OFFSET $3`, accountID.String(), limit, offset)
	if err != nil {
		return nil, err
	}

	for i := range entries {
		r.denormalize(&entries[i])
	}

	return &LedgerPaginatedResult{Items: entries, Total: total}, nil
}

func (r *LedgerRepository) GetLatestByAccount(ctx context.Context, accountID uuid.UUID) (*model.LedgerEntry, error) {
	var entry model.LedgerEntry
	err := r.db.GetContext(ctx, &entry,
		`SELECT id, account_id, transaction_id, type, amount, starting_balance, ending_balance, created_at
		 FROM ledger_entries WHERE account_id = $1
		 ORDER BY created_at DESC, id DESC LIMIT 1`, accountID.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	r.denormalize(&entry)
	return &entry, nil
}

func (r *LedgerRepository) denormalize(entry *model.LedgerEntry) {
	entry.Amount = utils.Denormalize(int64(entry.Amount))
	entry.StartingBalance = utils.Denormalize(int64(entry.StartingBalance))
	entry.EndingBalance = utils.Denormalize(int64(entry.EndingBalance))
}

type ListLedgerFilter struct {
	UserID    uuid.UUID
	AccountID *uuid.UUID
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	Limit     int
}

func (r *LedgerRepository) ListFiltered(ctx context.Context, f ListLedgerFilter) (*LedgerPaginatedResult, error) {
	offset := (f.Page - 1) * f.Limit

	var accountIDStr sql.NullString
	if f.AccountID != nil {
		accountIDStr = sql.NullString{String: f.AccountID.String(), Valid: true}
	}

	var startDate, endDate sql.NullTime
	if f.StartDate != nil {
		startDate = sql.NullTime{Time: *f.StartDate, Valid: true}
	}
	if f.EndDate != nil {
		endDate = sql.NullTime{Time: *f.EndDate, Valid: true}
	}

	var total int
	err := r.db.GetContext(ctx, &total,
		`SELECT COUNT(*)
		 FROM ledger_entries l
		 JOIN accounts a ON l.account_id = a.id
		 WHERE a.user_id = $1 AND a.deleted_at IS NULL
		   AND ($2::uuid IS NULL OR l.account_id = $2)
		   AND ($3::timestamptz IS NULL OR l.created_at >= $3)
		   AND ($4::timestamptz IS NULL OR l.created_at <= $4)`,
		f.UserID.String(), accountIDStr, startDate, endDate)
	if err != nil {
		return nil, err
	}

	var entries []model.LedgerEntry
	err = r.db.SelectContext(ctx, &entries,
		`SELECT l.id, l.account_id, l.transaction_id, l.type, l.amount, l.starting_balance, l.ending_balance, l.created_at
		 FROM ledger_entries l
		 JOIN accounts a ON l.account_id = a.id
		 WHERE a.user_id = $1 AND a.deleted_at IS NULL
		   AND ($2::uuid IS NULL OR l.account_id = $2)
		   AND ($3::timestamptz IS NULL OR l.created_at >= $3)
		   AND ($4::timestamptz IS NULL OR l.created_at <= $4)
		 ORDER BY l.created_at DESC, l.id DESC
		 LIMIT $5 OFFSET $6`,
		f.UserID.String(), accountIDStr, startDate, endDate, f.Limit, offset)
	if err != nil {
		return nil, err
	}

	for i := range entries {
		r.denormalize(&entries[i])
	}

	return &LedgerPaginatedResult{Items: entries, Total: total}, nil
}
