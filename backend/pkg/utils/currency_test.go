package utils

import (
	"testing"
)

func TestNormalize(t *testing.T) {
	tests := []struct {
		name   string
		input  float64
		expect int64
	}{
		{"zero", 0, 0},
		{"small", 100, 10000},
		{"thousand", 1000, 100000},
		{"million", 1000000, 100000000},
		{"with_cents", 1234.56, 123456},
		{"large", 5000000, 500000000},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := Normalize(tc.input)
			if got != tc.expect {
				t.Errorf("Normalize(%v) = %v, want %v", tc.input, got, tc.expect)
			}
		})
	}
}

func TestDenormalize(t *testing.T) {
	tests := []struct {
		name   string
		input  int64
		expect float64
	}{
		{"zero", 0, 0},
		{"small", 10000, 100},
		{"thousand", 100000, 1000},
		{"million", 100000000, 1000000},
		{"with_cents", 123456, 1234.56},
		{"large", 500000000, 5000000},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := Denormalize(tc.input)
			if got != tc.expect {
				t.Errorf("Denormalize(%v) = %v, want %v", tc.input, got, tc.expect)
			}
		})
	}
}

func TestNormalizeDenormalizeRoundtrip(t *testing.T) {
	tests := []float64{0, 100, 1000, 5000, 12345.67, 1000000, 5000000}

	for _, original := range tests {
		normalized := Normalize(original)
		denormalized := Denormalize(normalized)
		if denormalized != original {
			t.Errorf("Roundtrip failed: %v -> %v -> %v", original, normalized, denormalized)
		}
	}
}

func TestFormatIDR(t *testing.T) {
	tests := []struct {
		name   string
		input  float64
		expect string
	}{
		{"zero", 0, "Rp 0,00"},
		{"small", 100, "Rp 100,00"},
		{"thousand", 1000, "Rp 1.000,00"},
		{"ten_thousand", 15000, "Rp 15.000,00"},
		{"hundred_thousand", 500000, "Rp 500.000,00"},
		{"million", 1000000, "Rp 1.000.000,00"},
		{"five_million", 5000000, "Rp 5.000.000,00"},
		{"with_cents", 1234.56, "Rp 1.234,56"},
		{"negative", -5000, "-Rp 5.000,00"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := FormatIDR(tc.input)
			if got != tc.expect {
				t.Errorf("FormatIDR(%v) = %q, want %q", tc.input, got, tc.expect)
			}
		})
	}
}

func TestFormatIDRCompact(t *testing.T) {
	tests := []struct {
		name   string
		input  float64
		expect string
	}{
		{"zero", 0, "Rp 0"},
		{"small", 100, "Rp 100"},
		{"thousand", 1000, "Rp 1.000"},
		{"ten_thousand", 15000, "Rp 15.000"},
		{"million", 1000000, "Rp 1.000.000"},
		{"five_million", 5000000, "Rp 5.000.000"},
		{"with_cents", 1234.56, "Rp 1.234,56"},
		{"no_cents", 1234.00, "Rp 1.234"},
		{"negative", -5000, "-Rp 5.000"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := FormatIDRCompact(tc.input)
			if got != tc.expect {
				t.Errorf("FormatIDRCompact(%v) = %q, want %q", tc.input, got, tc.expect)
			}
		})
	}
}

func TestParseAmount(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		expect    float64
		expectOK  bool
	}{
		// Valid inputs
		{"plain_number", "5000", 5000, true},
		{"with_dots_thousand_sep", "5.000", 5000, true},
		{"with_commas_thousand_sep", "5,000", 5000, true},
		{"indonesian_format", "1.500.000", 1500000, true},
		{"indonesian_with_decimal", "1.500.000,50", 1500000.50, true},
		{"us_format", "1,500,000", 1500000, true},
		{"us_with_decimal", "1,500,000.50", 1500000.50, true},
		{"with_rp_prefix", "Rp 5000", 5000, true},
		{"with_rp_prefix_no_space", "Rp5000", 5000, true},
		{"large_number", "10000000", 10000000, true},

		// Invalid inputs
		{"empty", "", 0, false},
		{"negative", "-5000", 0, false},
		{"letters", "abc", 0, false},
		{"mixed", "5000abc", 0, false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := ParseAmount(tc.input)
			if ok != tc.expectOK {
				t.Errorf("ParseAmount(%q) ok = %v, want %v", tc.input, ok, tc.expectOK)
			}
			if ok && got != tc.expect {
				t.Errorf("ParseAmount(%q) = %v, want %v", tc.input, got, tc.expect)
			}
		})
	}
}

func TestParseAndNormalize(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expect   int64
		expectOK bool
	}{
		{"plain", "5000", 500000, true},
		{"indonesian", "1.500.000", 150000000, true},
		{"with_decimal", "1234,56", 123456, true},
		{"invalid", "abc", 0, false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := ParseAndNormalize(tc.input)
			if ok != tc.expectOK {
				t.Errorf("ParseAndNormalize(%q) ok = %v, want %v", tc.input, ok, tc.expectOK)
			}
			if ok && got != tc.expect {
				t.Errorf("ParseAndNormalize(%q) = %v, want %v", tc.input, got, tc.expect)
			}
		})
	}
}

func TestFormatStoredAmount(t *testing.T) {
	tests := []struct {
		name   string
		input  int64
		expect string
	}{
		{"zero", 0, "Rp 0"},
		{"small", 10000, "Rp 100"},
		{"thousand", 100000, "Rp 1.000"},
		{"million", 100000000, "Rp 1.000.000"},
		{"five_million", 500000000, "Rp 5.000.000"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := FormatStoredAmount(tc.input)
			if got != tc.expect {
				t.Errorf("FormatStoredAmount(%v) = %q, want %q", tc.input, got, tc.expect)
			}
		})
	}
}

func TestIsIndonesianFormat(t *testing.T) {
	tests := []struct {
		input  string
		expect bool
	}{
		{"1.500.000", true},
		{"1.500.000,50", true},
		{"1,500,000", false},
		{"1,500,000.50", false},
		{"5000", false},
		{"5.00", false},
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			got := isIndonesianFormat(tc.input)
			if got != tc.expect {
				t.Errorf("isIndonesianFormat(%q) = %v, want %v", tc.input, got, tc.expect)
			}
		})
	}
}
