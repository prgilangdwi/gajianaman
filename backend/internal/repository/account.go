package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
)

type AccountRepository struct {
	db *sqlx.DB
}

func NewAccountRepository(db *sqlx.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Account, error) {
	var acc model.Account
	err := r.db.GetContext(ctx, &acc,
		`SELECT id, user_id, name, type, balance, is_default, created_at, updated_at, deleted_at
		 FROM accounts WHERE id = $1 AND deleted_at IS NULL`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *AccountRepository) GetDefault(ctx context.Context, userID uuid.UUID) (*model.Account, error) {
	var acc model.Account
	err := r.db.GetContext(ctx, &acc,
		`SELECT id, user_id, name, type, balance, is_default, created_at, updated_at, deleted_at
		 FROM accounts WHERE user_id = $1 AND is_default = true AND deleted_at IS NULL
		 LIMIT 1`, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *AccountRepository) GetByName(ctx context.Context, userID uuid.UUID, name string) (*model.Account, error) {
	var acc model.Account
	err := r.db.GetContext(ctx, &acc,
		`SELECT id, user_id, name, type, balance, is_default, created_at, updated_at, deleted_at
		 FROM accounts WHERE user_id = $1 AND LOWER(name) LIKE LOWER($2) AND deleted_at IS NULL
		 LIMIT 1`, userID, "%"+name+"%")
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *AccountRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Account, error) {
	var accs []model.Account
	err := r.db.SelectContext(ctx, &accs,
		`SELECT id, user_id, name, type, balance, is_default, created_at, updated_at, deleted_at
		 FROM accounts WHERE user_id = $1 AND deleted_at IS NULL
		 ORDER BY is_default DESC, name`, userID)
	return accs, err
}

func (r *AccountRepository) Create(ctx context.Context, acc *model.Account) error {
	if acc.ID == uuid.Nil {
		acc.ID = uuid.New()
	}
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO accounts (id, user_id, name, type, balance, is_default)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		acc.ID, acc.UserID, acc.Name, acc.Type, acc.Balance, acc.IsDefault)
	return err
}

func (r *AccountRepository) EnsureDefault(ctx context.Context, userID uuid.UUID) (*model.Account, error) {
	acc, err := r.GetDefault(ctx, userID)
	if err != nil {
		return nil, err
	}
	if acc != nil {
		return acc, nil
	}

	// Create default cash account
	acc = &model.Account{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      "Cash",
		Type:      model.AccountCash,
		Balance:   0,
		IsDefault: true,
	}
	if err := r.Create(ctx, acc); err != nil {
		return nil, err
	}
	return acc, nil
}

func (r *AccountRepository) UpdateBalance(ctx context.Context, id uuid.UUID, delta float64) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE accounts SET balance = balance + $2 WHERE id = $1`, id, delta)
	return err
}
