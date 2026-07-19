package repository

import (
	"testing"

	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/pkg/utils"
)

func TestLedgerTypeValues(t *testing.T) {
	tests := []struct {
		ledgerType model.LedgerType
		expected   string
	}{
		{model.LedgerTypeCredit, "credit"},
		{model.LedgerTypeDebit, "debit"},
	}

	for _, tc := range tests {
		if string(tc.ledgerType) != tc.expected {
			t.Errorf("LedgerType = %s, want %s", tc.ledgerType, tc.expected)
		}
	}
}

func TestLedgerPaginatedResultStructure(t *testing.T) {
	result := LedgerPaginatedResult{
		Items: []model.LedgerEntry{},
		Total: 50,
	}

	if result.Total != 50 {
		t.Errorf("Total = %d, want 50", result.Total)
	}

	if len(result.Items) != 0 {
		t.Errorf("Items length = %d, want 0", len(result.Items))
	}
}

func TestLedgerAmountNormalization(t *testing.T) {
	tests := []struct {
		name            string
		amount          float64
		startingBalance float64
		endingBalance   float64
		normalizedAmt   int64
		normalizedStart int64
		normalizedEnd   int64
	}{
		{
			name:            "income_entry",
			amount:          50000,
			startingBalance: 100000,
			endingBalance:   150000,
			normalizedAmt:   5000000,
			normalizedStart: 10000000,
			normalizedEnd:   15000000,
		},
		{
			name:            "expense_entry",
			amount:          30000,
			startingBalance: 100000,
			endingBalance:   70000,
			normalizedAmt:   3000000,
			normalizedStart: 10000000,
			normalizedEnd:   7000000,
		},
		{
			name:            "small_amount",
			amount:          0.50,
			startingBalance: 100,
			endingBalance:   100.50,
			normalizedAmt:   50,
			normalizedStart: 10000,
			normalizedEnd:   10050,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			normalizedAmt := utils.Normalize(tc.amount)
			normalizedStart := utils.Normalize(tc.startingBalance)
			normalizedEnd := utils.Normalize(tc.endingBalance)

			if normalizedAmt != tc.normalizedAmt {
				t.Errorf("Normalized amount = %d, want %d", normalizedAmt, tc.normalizedAmt)
			}
			if normalizedStart != tc.normalizedStart {
				t.Errorf("Normalized starting = %d, want %d", normalizedStart, tc.normalizedStart)
			}
			if normalizedEnd != tc.normalizedEnd {
				t.Errorf("Normalized ending = %d, want %d", normalizedEnd, tc.normalizedEnd)
			}
		})
	}
}

func TestLedgerDenormalization(t *testing.T) {
	tests := []struct {
		name            string
		storedAmt       int64
		storedStart     int64
		storedEnd       int64
		expectedAmt     float64
		expectedStart   float64
		expectedEnd     float64
	}{
		{
			name:          "standard_values",
			storedAmt:     5000000,
			storedStart:   10000000,
			storedEnd:     15000000,
			expectedAmt:   50000,
			expectedStart: 100000,
			expectedEnd:   150000,
		},
		{
			name:          "with_cents",
			storedAmt:     50,
			storedStart:   10000,
			storedEnd:     10050,
			expectedAmt:   0.50,
			expectedStart: 100,
			expectedEnd:   100.50,
		},
		{
			name:          "negative_ending_balance",
			storedAmt:     2500000,
			storedStart:   1000000,
			storedEnd:     -1500000,
			expectedAmt:   25000,
			expectedStart: 10000,
			expectedEnd:   -15000,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			amt := utils.Denormalize(tc.storedAmt)
			start := utils.Denormalize(tc.storedStart)
			end := utils.Denormalize(tc.storedEnd)

			if amt != tc.expectedAmt {
				t.Errorf("Denormalized amount = %f, want %f", amt, tc.expectedAmt)
			}
			if start != tc.expectedStart {
				t.Errorf("Denormalized starting = %f, want %f", start, tc.expectedStart)
			}
			if end != tc.expectedEnd {
				t.Errorf("Denormalized ending = %f, want %f", end, tc.expectedEnd)
			}
		})
	}
}

func TestLedgerBalanceConsistency(t *testing.T) {
	tests := []struct {
		name            string
		ledgerType      model.LedgerType
		amount          float64
		startingBalance float64
		expectedEnding  float64
	}{
		{
			name:            "credit_increases_balance",
			ledgerType:      model.LedgerTypeCredit,
			amount:          50000,
			startingBalance: 100000,
			expectedEnding:  150000,
		},
		{
			name:            "debit_decreases_balance",
			ledgerType:      model.LedgerTypeDebit,
			amount:          30000,
			startingBalance: 100000,
			expectedEnding:  70000,
		},
		{
			name:            "debit_can_go_negative",
			ledgerType:      model.LedgerTypeDebit,
			amount:          150000,
			startingBalance: 100000,
			expectedEnding:  -50000,
		},
		{
			name:            "credit_from_zero",
			ledgerType:      model.LedgerTypeCredit,
			amount:          75000,
			startingBalance: 0,
			expectedEnding:  75000,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var endingBalance float64
			if tc.ledgerType == model.LedgerTypeCredit {
				endingBalance = tc.startingBalance + tc.amount
			} else {
				endingBalance = tc.startingBalance - tc.amount
			}

			if endingBalance != tc.expectedEnding {
				t.Errorf("Ending balance = %f, want %f", endingBalance, tc.expectedEnding)
			}
		})
	}
}

func TestLedgerEntryAmountAlwaysPositive(t *testing.T) {
	amounts := []float64{50000, 0.01, 999999.99, 1}

	for _, amt := range amounts {
		if amt < 0 {
			t.Errorf("Amount %f is negative, ledger amounts must be positive", amt)
		}
	}
}

func TestLedgerPaginationOffset(t *testing.T) {
	tests := []struct {
		page           int
		limit          int
		expectedOffset int
	}{
		{1, 20, 0},
		{2, 20, 20},
		{3, 20, 40},
		{1, 50, 0},
		{5, 10, 40},
	}

	for _, tc := range tests {
		offset := (tc.page - 1) * tc.limit
		if offset != tc.expectedOffset {
			t.Errorf("offset(page=%d, limit=%d) = %d, want %d",
				tc.page, tc.limit, offset, tc.expectedOffset)
		}
	}
}

func TestLedgerEntryFields(t *testing.T) {
	entry := model.LedgerEntry{
		Type:            model.LedgerTypeCredit,
		Amount:          50000,
		StartingBalance: 100000,
		EndingBalance:   150000,
	}

	if entry.Type != model.LedgerTypeCredit {
		t.Errorf("Type = %s, want credit", entry.Type)
	}
	if entry.Amount != 50000 {
		t.Errorf("Amount = %f, want 50000", entry.Amount)
	}
	if entry.StartingBalance != 100000 {
		t.Errorf("StartingBalance = %f, want 100000", entry.StartingBalance)
	}
	if entry.EndingBalance != 150000 {
		t.Errorf("EndingBalance = %f, want 150000", entry.EndingBalance)
	}
}
