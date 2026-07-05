package utils

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// Normalize converts a user-facing amount to storage format (multiply by 100).
// 5000 -> 500000 (stores as cents/smallest unit)
func Normalize(amount float64) int64 {
	return int64(amount * 100)
}

// Denormalize converts a stored amount to user-facing format (divide by 100).
// 500000 -> 5000.00
func Denormalize(amount int64) float64 {
	return float64(amount) / 100
}

// NormalizeFloat converts float to storage int64.
func NormalizeFloat(amount float64) int64 {
	return Normalize(amount)
}

// DenormalizeToFloat converts storage int64 to display float.
func DenormalizeToFloat(amount int64) float64 {
	return Denormalize(amount)
}

// FormatIDR formats an amount as Indonesian Rupiah.
// Input should be denormalized (user-facing) amount.
// 5000000 -> "Rp 5.000.000,00"
func FormatIDR(amount float64) string {
	negative := amount < 0
	if negative {
		amount = -amount
	}

	// Round to 2 decimal places to avoid floating-point precision issues
	rounded := int64(amount*100 + 0.5)
	intPart := rounded / 100
	decPart := rounded % 100

	// Format integer part with thousand separators (.)
	intStr := formatWithThousandSep(intPart)

	// Format decimal part
	decStr := fmt.Sprintf("%02d", decPart)

	result := fmt.Sprintf("Rp %s,%s", intStr, decStr)
	if negative {
		result = "-" + result
	}

	return result
}

// FormatIDRCompact formats amount without decimals if zero.
// 5000000 -> "Rp 5.000.000"
// 5000000.50 -> "Rp 5.000.000,50"
func FormatIDRCompact(amount float64) string {
	negative := amount < 0
	if negative {
		amount = -amount
	}

	// Round to 2 decimal places to avoid floating-point precision issues
	rounded := int64(amount*100 + 0.5)
	intPart := rounded / 100
	decPart := rounded % 100

	intStr := formatWithThousandSep(intPart)

	var result string
	if decPart == 0 {
		result = fmt.Sprintf("Rp %s", intStr)
	} else {
		result = fmt.Sprintf("Rp %s,%02d", intStr, decPart)
	}

	if negative {
		result = "-" + result
	}

	return result
}

func formatWithThousandSep(n int64) string {
	str := strconv.FormatInt(n, 10)
	if len(str) <= 3 {
		return str
	}

	var result strings.Builder
	remainder := len(str) % 3
	if remainder > 0 {
		result.WriteString(str[:remainder])
		if len(str) > remainder {
			result.WriteString(".")
		}
	}

	for i := remainder; i < len(str); i += 3 {
		result.WriteString(str[i : i+3])
		if i+3 < len(str) {
			result.WriteString(".")
		}
	}

	return result.String()
}

// ParseAmount parses Indonesian amount strings.
// Supports: 15000, 15.000, 15,000 (as thousand sep), 15000.50
// Does NOT support: 15k, 15rb, 1.5jt (use raw numbers)
func ParseAmount(raw string) (float64, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0, false
	}

	// Remove currency prefix if present
	raw = strings.TrimPrefix(raw, "Rp")
	raw = strings.TrimPrefix(raw, "rp")
	raw = strings.TrimPrefix(raw, "IDR")
	raw = strings.TrimPrefix(raw, "idr")
	raw = strings.TrimSpace(raw)

	// Check if it uses Indonesian format (. as thousand sep, , as decimal)
	// e.g., "1.500.000,50"
	if isIndonesianFormat(raw) {
		raw = strings.ReplaceAll(raw, ".", "")  // Remove thousand sep
		raw = strings.ReplaceAll(raw, ",", ".") // Convert decimal sep
	} else {
		// Standard format - remove , as thousand sep
		// e.g., "1,500,000.50"
		raw = strings.ReplaceAll(raw, ",", "")
	}

	amount, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return 0, false
	}

	if amount < 0 {
		return 0, false
	}

	return amount, true
}

// isIndonesianFormat checks if string uses Indonesian number format
// (period as thousand separator, comma as decimal separator)
func isIndonesianFormat(s string) bool {
	// If has comma followed by exactly 2 digits at end, it's Indonesian decimal
	matched, _ := regexp.MatchString(`.*,\d{2}$`, s)
	if matched {
		return true
	}

	// If has periods but no comma, and periods are at thousand positions
	if strings.Contains(s, ".") && !strings.Contains(s, ",") {
		// Check if periods are thousand separators (every 3 digits from right)
		parts := strings.Split(s, ".")
		if len(parts) > 1 {
			// All parts except first should be 3 digits
			for i := 1; i < len(parts); i++ {
				if len(parts[i]) != 3 {
					return false
				}
			}
			return true
		}
	}

	return false
}

// FormatStoredAmount formats a normalized (stored) amount for display.
// Denormalizes and formats as IDR.
func FormatStoredAmount(storedAmount int64) string {
	return FormatIDRCompact(Denormalize(storedAmount))
}

// ParseAndNormalize parses user input and returns normalized value for storage.
func ParseAndNormalize(raw string) (int64, bool) {
	amount, ok := ParseAmount(raw)
	if !ok {
		return 0, false
	}
	return Normalize(amount), true
}
