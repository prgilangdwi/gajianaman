package model

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID         uuid.UUID      `db:"id"`
	TelegramID sql.NullString `db:"telegram_id"`
	Email      sql.NullString `db:"email"`
	Name       sql.NullString `db:"name"`
	Currency   string         `db:"currency"`
	CreatedAt  time.Time      `db:"created_at"`
	UpdatedAt  time.Time      `db:"updated_at"`
	DeletedAt  sql.NullTime   `db:"deleted_at"`
}

type Account struct {
	ID        uuid.UUID    `db:"id"`
	UserID    uuid.UUID    `db:"user_id"`
	Name      string       `db:"name"`
	Type      AccountType  `db:"type"`
	Balance   float64      `db:"balance"`
	IsDefault bool         `db:"is_default"`
	CreatedAt time.Time    `db:"created_at"`
	UpdatedAt time.Time    `db:"updated_at"`
	DeletedAt sql.NullTime `db:"deleted_at"`
}

type Category struct {
	ID        uuid.UUID       `db:"id"`
	UserID    uuid.NullUUID   `db:"user_id"`
	Code      string          `db:"code"`
	Name      string          `db:"name"`
	Icon      string          `db:"icon"`
	Type      TransactionType `db:"type"`
	ParentID  uuid.NullUUID   `db:"parent_id"`
	CreatedAt time.Time       `db:"created_at"`
	UpdatedAt time.Time       `db:"updated_at"`
	DeletedAt sql.NullTime    `db:"deleted_at"`
}

type Transaction struct {
	ID           uuid.UUID       `db:"id"`
	UserID       uuid.UUID       `db:"user_id"`
	AccountID    uuid.UUID       `db:"account_id"`
	CategoryID   uuid.UUID       `db:"category_id"`
	GoalID       uuid.NullUUID   `db:"goal_id"`
	Amount       float64         `db:"amount"`
	Type         TransactionType `db:"type"`
	Note         sql.NullString  `db:"note"`
	Date         time.Time       `db:"date"`
	Source       TxSource        `db:"source"`
	AIConfidence sql.NullFloat64 `db:"ai_confidence"`
	CreatedAt    time.Time       `db:"created_at"`
	UpdatedAt    time.Time       `db:"updated_at"`
	DeletedAt    sql.NullTime    `db:"deleted_at"`
	VoidedAt     sql.NullTime    `db:"voided_at"`
}

type Budget struct {
	ID         uuid.UUID    `db:"id"`
	UserID     uuid.UUID    `db:"user_id"`
	CategoryID uuid.UUID    `db:"category_id"`
	Amount     float64      `db:"amount"`
	Month      int16        `db:"month"`
	Year       int16        `db:"year"`
	CreatedAt  time.Time    `db:"created_at"`
	UpdatedAt  time.Time    `db:"updated_at"`
	DeletedAt  sql.NullTime `db:"deleted_at"`
}

type Goal struct {
	ID           uuid.UUID    `db:"id"`
	UserID       uuid.UUID    `db:"user_id"`
	Name         string       `db:"name"`
	TargetAmount float64      `db:"target_amount"`
	Deadline     sql.NullTime `db:"deadline"`
	CreatedAt    time.Time    `db:"created_at"`
	UpdatedAt    time.Time    `db:"updated_at"`
	DeletedAt    sql.NullTime `db:"deleted_at"`
}

type RecurringTransaction struct {
	ID         uuid.UUID       `db:"id"`
	UserID     uuid.UUID       `db:"user_id"`
	AccountID  uuid.UUID       `db:"account_id"`
	CategoryID uuid.UUID       `db:"category_id"`
	Amount     float64         `db:"amount"`
	Type       TransactionType `db:"type"`
	Note       sql.NullString  `db:"note"`
	Frequency  Frequency       `db:"frequency"`
	NextDue    time.Time       `db:"next_due"`
	StartedAt  time.Time       `db:"started_at"`
	EndedAt    sql.NullTime    `db:"ended_at"`
	CreatedAt  time.Time       `db:"created_at"`
	UpdatedAt  time.Time       `db:"updated_at"`
	DeletedAt  sql.NullTime    `db:"deleted_at"`
}
