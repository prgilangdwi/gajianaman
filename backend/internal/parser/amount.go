package parser

import (
	"regexp"
	"strconv"
	"strings"
)

var amountRe = regexp.MustCompile(`(?i)\b(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|mio)?\b`)

// ParseAmount parses Indonesian amount strings like 15000, 15k, 15rb, 15ribu, 1.5jt, 2juta, 10mio
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

// ExtractAmount finds the first amount in a text string
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

// RemoveAmount removes amount patterns from text
func RemoveAmount(text string) string {
	return strings.TrimSpace(amountRe.ReplaceAllString(text, ""))
}
