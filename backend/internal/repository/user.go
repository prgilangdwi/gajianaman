package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByTelegramID(ctx context.Context, telegramID string) (*model.User, error) {
	var user model.User
	err := r.db.GetContext(ctx, &user,
		`SELECT id, telegram_id, email, name, currency, created_at, updated_at, deleted_at
		 FROM users WHERE telegram_id = $1 AND deleted_at IS NULL`, telegramID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var user model.User
	err := r.db.GetContext(ctx, &user,
		`SELECT id, telegram_id, email, name, currency, created_at, updated_at, deleted_at
		 FROM users WHERE id = $1 AND deleted_at IS NULL`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, telegramID, name string) (*model.User, error) {
	id := uuid.New()
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO users (id, telegram_id, name, currency)
		 VALUES ($1, $2, $3, 'IDR')
		 ON CONFLICT (telegram_id) DO UPDATE SET name = EXCLUDED.name`,
		id, telegramID, name)
	if err != nil {
		return nil, err
	}
	return r.GetByTelegramID(ctx, telegramID)
}

func (r *UserRepository) EnsureUser(ctx context.Context, telegramID, name string) (*model.User, error) {
	user, err := r.GetByTelegramID(ctx, telegramID)
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}
	return r.Create(ctx, telegramID, name)
}
