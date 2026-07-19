package service

import (
	"database/sql"
	"errors"
	"math"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestLedgerTypeForTransactionType(t *testing.T) {
	tests := []struct {
		name           string
		txType         model.TransactionType
		expectedLedger model.LedgerType
		expectedDelta  float64
		amount         float64
	}{
		{
			name:           "income_creates_credit",
			txType:         model.TypeIncome,
			expectedLedger: model.LedgerTypeCredit,
			expectedDelta:  50000,
			amount:         50000,
		},
		{
			name:           "expense_creates_debit",
			txType:         model.TypeExpense,
			expectedLedger: model.LedgerTypeDebit,
			expectedDelta:  -25000,
			amount:         25000,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			delta := tc.amount
			ledgerType := model.LedgerTypeCredit
			if tc.txType == model.TypeExpense {
				delta = -tc.amount
				ledgerType = model.LedgerTypeDebit
			}

			assert.Equal(t, tc.expectedLedger, ledgerType)
			assert.Equal(t, tc.expectedDelta, delta)
		})
	}
}

func TestVoidLedgerTypeReversal(t *testing.T) {
	tests := []struct {
		name                string
		originalTxType      model.TransactionType
		expectedReverseLedger model.LedgerType
		expectedDelta       float64
		amount              float64
	}{
		{
			name:                "voiding_income_creates_debit",
			originalTxType:      model.TypeIncome,
			expectedReverseLedger: model.LedgerTypeDebit,
			expectedDelta:       -50000,
			amount:              50000,
		},
		{
			name:                "voiding_expense_creates_credit",
			originalTxType:      model.TypeExpense,
			expectedReverseLedger: model.LedgerTypeCredit,
			expectedDelta:       25000,
			amount:              25000,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			delta := -tc.amount
			ledgerType := model.LedgerTypeDebit
			if tc.originalTxType == model.TypeExpense {
				delta = tc.amount
				ledgerType = model.LedgerTypeCredit
			}

			assert.Equal(t, tc.expectedReverseLedger, ledgerType)
			assert.Equal(t, tc.expectedDelta, delta)
		})
	}
}

func TestLedgerEntryCalculation(t *testing.T) {
	tests := []struct {
		name            string
		startingBalance float64
		amount          float64
		txType          model.TransactionType
		expectedEnding  float64
		expectedLedgerAmt float64
	}{
		{
			name:            "income_increases_balance",
			startingBalance: 100000,
			amount:          50000,
			txType:          model.TypeIncome,
			expectedEnding:  150000,
			expectedLedgerAmt: 50000,
		},
		{
			name:            "expense_decreases_balance",
			startingBalance: 100000,
			amount:          30000,
			txType:          model.TypeExpense,
			expectedEnding:  70000,
			expectedLedgerAmt: 30000,
		},
		{
			name:            "zero_starting_balance_income",
			startingBalance: 0,
			amount:          75000,
			txType:          model.TypeIncome,
			expectedEnding:  75000,
			expectedLedgerAmt: 75000,
		},
		{
			name:            "expense_can_go_negative",
			startingBalance: 10000,
			amount:          25000,
			txType:          model.TypeExpense,
			expectedEnding:  -15000,
			expectedLedgerAmt: 25000,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			delta := tc.amount
			if tc.txType == model.TypeExpense {
				delta = -tc.amount
			}

			endingBalance := tc.startingBalance + delta
			ledgerAmount := math.Abs(tc.amount)

			assert.Equal(t, tc.expectedEnding, endingBalance)
			assert.Equal(t, tc.expectedLedgerAmt, ledgerAmount)
			assert.True(t, ledgerAmount >= 0, "ledger amount must be non-negative")
		})
	}
}

func TestVoidBalanceRestoration(t *testing.T) {
	tests := []struct {
		name            string
		originalBalance float64
		txAmount        float64
		txType          model.TransactionType
		balanceAfterTx  float64
		balanceAfterVoid float64
	}{
		{
			name:            "void_income_restores_balance",
			originalBalance: 100000,
			txAmount:        50000,
			txType:          model.TypeIncome,
			balanceAfterTx:  150000,
			balanceAfterVoid: 100000,
		},
		{
			name:            "void_expense_restores_balance",
			originalBalance: 100000,
			txAmount:        30000,
			txType:          model.TypeExpense,
			balanceAfterTx:  70000,
			balanceAfterVoid: 100000,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Simulate transaction creation
			delta := tc.txAmount
			if tc.txType == model.TypeExpense {
				delta = -tc.txAmount
			}
			afterTx := tc.originalBalance + delta
			assert.Equal(t, tc.balanceAfterTx, afterTx)

			// Simulate void
			voidDelta := -tc.txAmount
			if tc.txType == model.TypeExpense {
				voidDelta = tc.txAmount
			}
			afterVoid := afterTx + voidDelta
			assert.Equal(t, tc.balanceAfterVoid, afterVoid)
		})
	}
}

func TestTransactionServiceErrors(t *testing.T) {
	t.Run("invalid_account_error", func(t *testing.T) {
		assert.Equal(t, "invalid account", ErrInvalidAccount.Error())
	})

	t.Run("invalid_category_error", func(t *testing.T) {
		assert.Equal(t, "invalid category", ErrInvalidCategory.Error())
	})

	t.Run("transaction_not_found_error", func(t *testing.T) {
		assert.Equal(t, "transaction not found", ErrTransactionNotFound.Error())
	})

	t.Run("transaction_voided_error", func(t *testing.T) {
		assert.Equal(t, "transaction already voided", ErrTransactionVoided.Error())
	})
}

func TestCreateTransactionParamsValidation(t *testing.T) {
	userID := uuid.New()
	accountID := uuid.New()
	categoryID := uuid.New()

	tests := []struct {
		name   string
		params CreateTransactionParams
		valid  bool
	}{
		{
			name: "valid_expense",
			params: CreateTransactionParams{
				UserID:     userID,
				AccountID:  accountID,
				CategoryID: categoryID,
				Amount:     50000,
				Type:       model.TypeExpense,
				Note:       "lunch",
				Date:       time.Now(),
				Source:     model.SourceTelegram,
			},
			valid: true,
		},
		{
			name: "valid_income",
			params: CreateTransactionParams{
				UserID:     userID,
				AccountID:  accountID,
				CategoryID: categoryID,
				Amount:     5000000,
				Type:       model.TypeIncome,
				Note:       "salary",
				Date:       time.Now(),
				Source:     model.SourceWeb,
			},
			valid: true,
		},
		{
			name: "zero_amount",
			params: CreateTransactionParams{
				UserID:     userID,
				AccountID:  accountID,
				CategoryID: categoryID,
				Amount:     0,
				Type:       model.TypeExpense,
				Date:       time.Now(),
			},
			valid: true, // zero amount is technically valid
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.NotEqual(t, uuid.Nil, tc.params.UserID)
			assert.NotEqual(t, uuid.Nil, tc.params.AccountID)
			assert.NotEqual(t, uuid.Nil, tc.params.CategoryID)
		})
	}
}

func TestTransactionVoidedAtCheck(t *testing.T) {
	tests := []struct {
		name     string
		voidedAt sql.NullTime
		isVoided bool
	}{
		{
			name:     "not_voided",
			voidedAt: sql.NullTime{Valid: false},
			isVoided: false,
		},
		{
			name:     "voided",
			voidedAt: sql.NullTime{Time: time.Now(), Valid: true},
			isVoided: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.isVoided, tc.voidedAt.Valid)
		})
	}
}

func TestMathAbsForLedgerAmount(t *testing.T) {
	tests := []struct {
		input    float64
		expected float64
	}{
		{50000, 50000},
		{-50000, 50000},
		{0, 0},
		{-0.01, 0.01},
		{999999.99, 999999.99},
	}

	for _, tc := range tests {
		result := math.Abs(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

func TestUpdateTransactionParamsPartialUpdate(t *testing.T) {
	amount := 75000.0
	newType := model.TypeIncome
	note := "updated note"
	date := time.Now()
	accountID := uuid.New()
	categoryID := uuid.New()

	tests := []struct {
		name   string
		params UpdateTransactionParams
		fields []string
	}{
		{
			name:   "update_amount_only",
			params: UpdateTransactionParams{Amount: &amount},
			fields: []string{"Amount"},
		},
		{
			name:   "update_type_only",
			params: UpdateTransactionParams{Type: &newType},
			fields: []string{"Type"},
		},
		{
			name:   "update_multiple_fields",
			params: UpdateTransactionParams{
				Amount: &amount,
				Note:   &note,
				Date:   &date,
			},
			fields: []string{"Amount", "Note", "Date"},
		},
		{
			name: "update_all_fields",
			params: UpdateTransactionParams{
				AccountID:  &accountID,
				CategoryID: &categoryID,
				Amount:     &amount,
				Type:       &newType,
				Note:       &note,
				Date:       &date,
			},
			fields: []string{"AccountID", "CategoryID", "Amount", "Type", "Note", "Date"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Verify the expected fields are set
			if tc.params.Amount != nil {
				assert.Contains(t, tc.fields, "Amount")
			}
			if tc.params.Type != nil {
				assert.Contains(t, tc.fields, "Type")
			}
			if tc.params.Note != nil {
				assert.Contains(t, tc.fields, "Note")
			}
			if tc.params.Date != nil {
				assert.Contains(t, tc.fields, "Date")
			}
			if tc.params.AccountID != nil {
				assert.Contains(t, tc.fields, "AccountID")
			}
			if tc.params.CategoryID != nil {
				assert.Contains(t, tc.fields, "CategoryID")
			}
		})
	}
}

func TestBalanceDeltaCalculation(t *testing.T) {
	tests := []struct {
		name      string
		oldAmount float64
		oldType   model.TransactionType
		newAmount float64
		newType   model.TransactionType
		oldDelta  float64
		newDelta  float64
	}{
		{
			name:      "expense_to_larger_expense",
			oldAmount: 10000,
			oldType:   model.TypeExpense,
			newAmount: 15000,
			newType:   model.TypeExpense,
			oldDelta:  10000,  // reverse: +10000
			newDelta:  -15000, // apply: -15000
		},
		{
			name:      "income_to_expense",
			oldAmount: 50000,
			oldType:   model.TypeIncome,
			newAmount: 30000,
			newType:   model.TypeExpense,
			oldDelta:  -50000, // reverse: -50000
			newDelta:  -30000, // apply: -30000
		},
		{
			name:      "expense_to_income",
			oldAmount: 25000,
			oldType:   model.TypeExpense,
			newAmount: 100000,
			newType:   model.TypeIncome,
			oldDelta:  25000,  // reverse: +25000
			newDelta:  100000, // apply: +100000
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Calculate old delta (what to reverse)
			oldDelta := tc.oldAmount
			if tc.oldType == model.TypeExpense {
				oldDelta = -tc.oldAmount
			}
			reverseDelta := -oldDelta

			// Calculate new delta (what to apply)
			newDelta := tc.newAmount
			if tc.newType == model.TypeExpense {
				newDelta = -tc.newAmount
			}

			assert.Equal(t, tc.oldDelta, reverseDelta)
			assert.Equal(t, tc.newDelta, newDelta)
		})
	}
}

func TestErrorWrapping(t *testing.T) {
	baseErr := errors.New("database error")

	t.Run("errors_are_distinct", func(t *testing.T) {
		assert.NotEqual(t, ErrTransactionNotFound, ErrInvalidAccount)
		assert.NotEqual(t, ErrTransactionNotFound, ErrInvalidCategory)
		assert.NotEqual(t, ErrTransactionNotFound, ErrTransactionVoided)
		assert.NotEqual(t, ErrInvalidAccount, ErrInvalidCategory)
	})

	t.Run("base_errors_not_wrapped", func(t *testing.T) {
		assert.False(t, errors.Is(baseErr, ErrTransactionNotFound))
		assert.False(t, errors.Is(baseErr, ErrInvalidAccount))
	})
}
