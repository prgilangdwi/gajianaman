package parser

import (
	"regexp"
	"strconv"
	"strings"

	"github.com/prgilangdwi/gajianaman/pkg/utils"
)

var amountRe = regexp.MustCompile(`(?i)\b(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|mio)?\b`)
var amountReV2 = regexp.MustCompile(`\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b`)

// ParseAmount parses Indonesian amount strings like 15000, 15k, 15rb, 15ribu, 1.5jt, 2juta, 10mio
// DEPRECATED: Use ParseAmountV2 for strict number parsing without shortcuts
func ParseAmount(raw string) (float64, bool) {
	raw = strings.TrimSpace(strings.ToLower(raw))
	raw = strings.ReplaceAll(raw, " ", "")

	// Handle million suffixes
	if strings.HasSuffix(raw, "juta") || strings.HasSuffix(raw, "jt") || strings.HasSuffix(raw, "mio") {
		num := regexp.MustCompile(`(juta|jt|mio)$`).ReplaceAllString(raw, "")
		num = strings.ReplaceAll(num, ",", ".")
		f, err := strconv.ParseFloat(num, 64)
		if err != nil {
			return 0, false
		}
		return f * 1_000_000, true
	}

	// Handle thousand suffixes
	if strings.HasSuffix(raw, "ribu") || strings.HasSuffix(raw, "rb") || strings.HasSuffix(raw, "k") {
		num := regexp.MustCompile(`(ribu|rb|k)$`).ReplaceAllString(raw, "")
		num = strings.ReplaceAll(num, ",", ".")
		f, err := strconv.ParseFloat(num, 64)
		if err != nil {
			return 0, false
		}
		return f * 1_000, true
	}

	// Plain number
	raw = strings.ReplaceAll(raw, ",", "")
	raw = strings.ReplaceAll(raw, ".", "")
	f, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return 0, false
	}
	return f, true
}

// ParseAmountV2 parses amount strings strictly - no shortcuts.
// Supports: 15000, 15.000, 15,000, 1.500.000,50
// Does NOT support shortcuts like k, rb, jt - use raw numbers.
func ParseAmountV2(raw string) (float64, bool) {
	return utils.ParseAmount(raw)
}

// ExtractAmount finds the first amount in a text string (with shortcuts)
// DEPRECATED: Use ExtractAmountV2 for strict number parsing
func ExtractAmount(text string) (float64, bool) {
	match := amountRe.FindStringSubmatch(text)
	if match == nil {
		return 0, false
	}

	numStr := strings.ReplaceAll(match[1], ",", "")
	numStr = strings.ReplaceAll(numStr, ".", "")
	num, err := strconv.ParseFloat(numStr, 64)
	if err != nil {
		return 0, false
	}

	suffix := strings.ToLower(match[2])
	switch suffix {
	case "k", "rb", "ribu":
		num *= 1_000
	case "jt", "juta", "mio":
		num *= 1_000_000
	}

	if num < 100 {
		return 0, false
	}

	return num, true
}

// ExtractAmountV2 finds the first amount in a text string (strict, no shortcuts)
func ExtractAmountV2(text string) (float64, bool) {
	match := amountReV2.FindString(text)
	if match == "" {
		return 0, false
	}

	amount, ok := utils.ParseAmount(match)
	if !ok || amount < 100 {
		return 0, false
	}

	return amount, true
}

// RemoveAmount removes amount patterns from text
func RemoveAmount(text string) string {
	return strings.TrimSpace(amountRe.ReplaceAllString(text, ""))
}

// RemoveAmountV2 removes strict amount patterns from text
func RemoveAmountV2(text string) string {
	return strings.TrimSpace(amountReV2.ReplaceAllString(text, ""))
}
