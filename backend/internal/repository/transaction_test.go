package repository

import (
	"testing"

	"github.com/prgilangdwi/gajianaman/pkg/utils"
)

func TestTransactionAmountNormalization(t *testing.T) {
	tests := []struct {
		name           string
		userAmount     float64
		storedAmount   int64
		displayAmount  float64
	}{
		{"small_amount", 5000, 500000, 5000},
		{"medium_amount", 150000, 15000000, 150000},
		{"large_amount", 5000000, 500000000, 5000000},
		{"with_cents", 12345.67, 1234567, 12345.67},
		{"zero", 0, 0, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Test normalization (what goes into DB)
			normalized := utils.Normalize(tc.userAmount)
			if normalized != tc.storedAmount {
				t.Errorf("Normalize(%v) = %v, want %v", tc.userAmount, normalized, tc.storedAmount)
			}

			// Test denormalization (what comes out of DB)
			denormalized := utils.Denormalize(tc.storedAmount)
			if denormalized != tc.displayAmount {
				t.Errorf("Denormalize(%v) = %v, want %v", tc.storedAmount, denormalized, tc.displayAmount)
			}

			// Test roundtrip
			if denormalized != tc.userAmount {
				t.Errorf("Roundtrip failed: %v -> %v -> %v", tc.userAmount, normalized, denormalized)
			}
		})
	}
}

func TestTransactionSumDenormalization(t *testing.T) {
	// Simulate DB SUM of multiple normalized amounts
	amounts := []float64{5000, 15000, 25000}
	var normalizedSum int64

	for _, amt := range amounts {
		normalizedSum += utils.Normalize(amt)
	}

	// This is what the DB would return after SUM
	expectedStoredSum := int64(4500000) // (5000 + 15000 + 25000) * 100

	if normalizedSum != expectedStoredSum {
		t.Errorf("Normalized sum = %v, want %v", normalizedSum, expectedStoredSum)
	}

	// Denormalize the sum for display
	displaySum := utils.Denormalize(normalizedSum)
	expectedDisplaySum := 45000.0

	if displaySum != expectedDisplaySum {
		t.Errorf("Denormalized sum = %v, want %v", displaySum, expectedDisplaySum)
	}
}

func TestCategorySummaryDenormalization(t *testing.T) {
	// Simulate what happens with CategorySummary results
	type mockCategorySummary struct {
		Category string
		Total    float64
		Count    int
	}

	// Simulated DB result (normalized amounts)
	dbResults := []mockCategorySummary{
		{"Food", 15000000, 5},    // 150000 * 100
		{"Transport", 5000000, 3}, // 50000 * 100
	}

	// Denormalize like the repository does
	for i := range dbResults {
		dbResults[i].Total = utils.Denormalize(int64(dbResults[i].Total))
	}

	// Verify
	if dbResults[0].Total != 150000 {
		t.Errorf("Food total = %v, want 150000", dbResults[0].Total)
	}
	if dbResults[1].Total != 50000 {
		t.Errorf("Transport total = %v, want 50000", dbResults[1].Total)
	}
}

func TestTodayStatsDenormalization(t *testing.T) {
	// Simulate TodayStats from DB
	stats := TodayStats{
		Expense: 50000000, // Normalized: 500000 * 100
		Income:  100000000, // Normalized: 1000000 * 100
		TxCount: 5,
	}

	// Denormalize like the repository does
	stats.Expense = utils.Denormalize(int64(stats.Expense))
	stats.Income = utils.Denormalize(int64(stats.Income))

	if stats.Expense != 500000 {
		t.Errorf("Expense = %v, want 500000", stats.Expense)
	}
	if stats.Income != 1000000 {
		t.Errorf("Income = %v, want 1000000", stats.Income)
	}
}

func TestCreateTransactionParams(t *testing.T) {
	// Test that CreateTransactionParams amount gets normalized correctly
	userInputAmount := 75000.0
	expectedStoredAmount := int64(7500000)

	normalized := utils.Normalize(userInputAmount)
	if normalized != expectedStoredAmount {
		t.Errorf("Normalized amount = %v, want %v", normalized, expectedStoredAmount)
	}
}

func TestTransactionWithCategoryDenormalization(t *testing.T) {
	// Simulate multiple transactions from ListByMonth
	type mockTx struct {
		Amount       float64
		CategoryName string
	}

	// DB returns normalized amounts
	txs := []mockTx{
		{Amount: 2500000, CategoryName: "Food"},     // 25000 * 100
		{Amount: 15000000, CategoryName: "Shopping"}, // 150000 * 100
		{Amount: 500000, CategoryName: "Transport"},  // 5000 * 100
	}

	// Denormalize all
	for i := range txs {
		txs[i].Amount = utils.Denormalize(int64(txs[i].Amount))
	}

	expected := []float64{25000, 150000, 5000}
	for i, tx := range txs {
		if tx.Amount != expected[i] {
			t.Errorf("tx[%d].Amount = %v, want %v", i, tx.Amount, expected[i])
		}
	}
}

func BenchmarkNormalize(b *testing.B) {
	for i := 0; i < b.N; i++ {
		utils.Normalize(5000000.50)
	}
}

func BenchmarkDenormalize(b *testing.B) {
	for i := 0; i < b.N; i++ {
		utils.Denormalize(500000050)
	}
}
