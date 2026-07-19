package model

import (
	"time"

	"github.com/google/uuid"
)

type LedgerType string

const (
	LedgerTypeCredit LedgerType = "credit"
	LedgerTypeDebit  LedgerType = "debit"
)

type LedgerEntry struct {
	ID              uuid.UUID     `db:"id" json:"id"`
	AccountID       uuid.UUID     `db:"account_id" json:"account_id"`
	TransactionID   uuid.NullUUID `db:"transaction_id" json:"transaction_id"`
	Type            LedgerType    `db:"type" json:"type"`
	Amount          float64       `db:"amount" json:"amount"`
	StartingBalance float64       `db:"starting_balance" json:"starting_balance"`
	EndingBalance   float64       `db:"ending_balance" json:"ending_balance"`
	CreatedAt       time.Time     `db:"created_at" json:"created_at"`
}
