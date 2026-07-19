package parser

import (
	"regexp"
	"strings"
)

// TransactionType represents detected transaction type
type TransactionType string

const (
	TxExpense  TransactionType = "expense"
	TxIncome   TransactionType = "income"
	TxTransfer TransactionType = "transfer"
)

var walletKeywords = []string{
	"gopay", "ovo", "dana", "shopeepay", "linkaja",
	"bca", "bni", "mandiri", "bri", "cimb",
	"cash", "tunai", "ewallet", "bank", "tabungan", "rekening",
}

// DetectTransactionType analyzes text to determine if it's expense, income, or transfer
func DetectTransactionType(text string) TransactionType {
	lower := strings.ToLower(text)

	// Transfer keywords
	transferWords := []string{"transfer", "pindah", "kirim"}
	for _, w := range transferWords {
		if strings.Contains(lower, w) {
			if strings.Contains(lower, "dari") && (strings.Contains(lower, "ke") || strings.Contains(lower, "masuk")) {
				return TxTransfer
			}
		}
	}

	// Income keywords
	incomeWords := []string{"masuk", "dapat", "terima", "gaji", "income", "pemasukan", "uang masuk", "dapat transfer"}
	for _, w := range incomeWords {
		if strings.Contains(lower, w) {
			return TxIncome
		}
	}

	return TxExpense
}

// ExtractWallets extracts source and destination wallet from text
func ExtractWallets(text string) (source, dest string) {
	lower := strings.ToLower(text)
	var found []string

	for _, w := range walletKeywords {
		if strings.Contains(lower, w) {
			found = append(found, w)
		}
	}

	if len(found) >= 2 {
		// Check for "dari" to determine order
		dariIdx := strings.Index(lower, "dari")
		if dariIdx >= 0 {
			for _, w := range found {
				wIdx := strings.Index(lower, w)
				if wIdx < dariIdx {
					source = w
				} else if wIdx > dariIdx {
					dest = w
				}
			}
			return source, dest
		}
		return found[0], found[1]
	}
	if len(found) == 1 {
		return found[0], ""
	}
	return "", ""
}

// CleanNote removes amount and wallet references from text
func CleanNote(text string) string {
	note := RemoveAmount(text)

	// Remove wallet keywords
	for _, w := range walletKeywords {
		re := regexp.MustCompile(`(?i)\b` + w + `\b`)
		note = re.ReplaceAllString(note, "")
	}

	// Remove prepositions at start
	note = regexp.MustCompile(`(?i)^(dari|ke|pakai|dengan|via|lewat)\s+`).ReplaceAllString(note, "")

	// Collapse whitespace
	note = regexp.MustCompile(`\s+`).ReplaceAllString(note, " ")
	note = strings.TrimSpace(note)

	if note == "" {
		return "Transaksi"
	}
	return note
}

// ParseNaturalTransaction parses a plain message as a transaction
// Returns (amount, note, txType, sourceWallet, destWallet, ok)
func ParseNaturalTransaction(text string) (float64, string, TransactionType, string, string, bool) {
	if strings.HasPrefix(text, "/") || len(text) < 4 {
		return 0, "", "", "", "", false
	}

	amount, ok := ExtractAmount(text)
	if !ok {
		return 0, "", "", "", "", false
	}

	txType := DetectTransactionType(text)
	source, dest := ExtractWallets(text)
	note := CleanNote(text)

	return amount, note, txType, source, dest, true
}

// IsMultiTransaction detects if text contains multiple transactions
func IsMultiTransaction(text string) bool {
	if strings.HasPrefix(text, "/") {
		return false
	}

	// Count amount patterns
	matches := amountRe.FindAllString(text, -1)
	if len(matches) >= 2 {
		return true
	}

	// Check for comma or newline separators with amounts
	if strings.Contains(text, ",") || strings.Contains(text, "\n") {
		var sep string
		if strings.Contains(text, "\n") {
			sep = "\n"
		} else {
			sep = ","
		}
		parts := strings.Split(text, sep)
		countWithAmount := 0
		for _, part := range parts {
			if _, ok := ExtractAmount(part); ok {
				countWithAmount++
			}
		}
		if countWithAmount >= 2 {
			return true
		}
	}

	return false
}
