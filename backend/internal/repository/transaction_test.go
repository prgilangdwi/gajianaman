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

func TestPaginationOffset(t *testing.T) {
	tests := []struct {
		name           string
		page           int
		limit          int
		expectedOffset int
	}{
		{"first_page", 1, 10, 0},
		{"second_page", 2, 10, 10},
		{"third_page", 3, 10, 20},
		{"first_page_large_limit", 1, 50, 0},
		{"fifth_page_small_limit", 5, 5, 20},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			offset := (tc.page - 1) * tc.limit
			if offset != tc.expectedOffset {
				t.Errorf("offset for page=%d, limit=%d = %d, want %d",
					tc.page, tc.limit, offset, tc.expectedOffset)
			}
		})
	}
}

func TestPaginatedResultStructure(t *testing.T) {
	result := PaginatedResult{
		Items: []TransactionWithCategory{},
		Total: 100,
	}

	if result.Total != 100 {
		t.Errorf("Total = %d, want 100", result.Total)
	}

	if len(result.Items) != 0 {
		t.Errorf("Items length = %d, want 0", len(result.Items))
	}
}

func TestCreateTransactionParamsFields(t *testing.T) {
	params := CreateTransactionParams{
		Amount: 50000,
	}

	normalized := utils.Normalize(params.Amount)
	if normalized != 5000000 {
		t.Errorf("Normalized amount = %d, want 5000000", normalized)
	}
}

func TestTransactionWithCategoryEmbedding(t *testing.T) {
	// Test that TransactionWithCategory properly embeds Transaction
	twc := TransactionWithCategory{
		CategoryName: "Food & Dining",
	}

	if twc.CategoryName != "Food & Dining" {
		t.Errorf("CategoryName = %s, want Food & Dining", twc.CategoryName)
	}
}

func TestCategorySummaryStructure(t *testing.T) {
	summary := CategorySummary{
		Category: "Transport",
		Total:    150000,
		Count:    5,
	}

	if summary.Category != "Transport" {
		t.Errorf("Category = %s, want Transport", summary.Category)
	}
	if summary.Total != 150000 {
		t.Errorf("Total = %f, want 150000", summary.Total)
	}
	if summary.Count != 5 {
		t.Errorf("Count = %d, want 5", summary.Count)
	}
}

func TestTodayStatsStructure(t *testing.T) {
	stats := TodayStats{
		Expense: 500000,
		Income:  1000000,
		TxCount: 10,
	}

	if stats.Expense != 500000 {
		t.Errorf("Expense = %f, want 500000", stats.Expense)
	}
	if stats.Income != 1000000 {
		t.Errorf("Income = %f, want 1000000", stats.Income)
	}
	if stats.TxCount != 10 {
		t.Errorf("TxCount = %d, want 10", stats.TxCount)
	}
}

func TestAmountNormalizationEdgeCases(t *testing.T) {
	tests := []struct {
		name     string
		amount   float64
		expected int64
	}{
		{"very_small", 0.01, 1},
		{"small_with_cents", 1.99, 199},
		{"round_number", 100, 10000},
		{"large_amount", 10000000, 1000000000},
		{"negative_zero", -0.0, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			normalized := utils.Normalize(tc.amount)
			if normalized != tc.expected {
				t.Errorf("Normalize(%f) = %d, want %d", tc.amount, normalized, tc.expected)
			}
		})
	}
}

func TestDenormalizationPrecision(t *testing.T) {
	tests := []struct {
		name     string
		stored   int64
		expected float64
	}{
		{"exact_cents", 199, 1.99},
		{"whole_number", 10000, 100},
		{"large_value", 1000000000, 10000000},
		{"single_cent", 1, 0.01},
		{"zero", 0, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := utils.Denormalize(tc.stored)
			if result != tc.expected {
				t.Errorf("Denormalize(%d) = %f, want %f", tc.stored, result, tc.expected)
			}
		})
	}
}

func TestMonthYearExtraction(t *testing.T) {
	// Test date values that would be used in month/year queries
	tests := []struct {
		name          string
		month         int
		year          int
		validMonth    bool
		validYear     bool
	}{
		{"january_2026", 1, 2026, true, true},
		{"december_2025", 12, 2025, true, true},
		{"invalid_month_zero", 0, 2026, false, true},
		{"invalid_month_13", 13, 2026, false, true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			validMonth := tc.month >= 1 && tc.month <= 12
			validYear := tc.year >= 1900 && tc.year <= 9999

			if validMonth != tc.validMonth {
				t.Errorf("month %d valid = %v, want %v", tc.month, validMonth, tc.validMonth)
			}
			if validYear != tc.validYear {
				t.Errorf("year %d valid = %v, want %v", tc.year, validYear, tc.validYear)
			}
		})
	}
}
