package model

// AccountType represents wallet/account types
type AccountType uint8

const (
	AccountCash AccountType = iota
	AccountBank
	AccountEwallet
	AccountCreditCard
	AccountInvestment
)

func (a AccountType) String() string {
	switch a {
	case AccountCash:
		return "cash"
	case AccountBank:
		return "bank"
	case AccountEwallet:
		return "ewallet"
	case AccountCreditCard:
		return "credit_card"
	case AccountInvestment:
		return "investment"
	}
	return "unknown"
}

// TransactionType represents transaction direction
type TransactionType uint8

const (
	TypeExpense TransactionType = iota
	TypeIncome
	TypeTransfer
)

func (t TransactionType) String() string {
	switch t {
	case TypeExpense:
		return "expense"
	case TypeIncome:
		return "income"
	case TypeTransfer:
		return "transfer"
	}
	return "unknown"
}

// TxSource represents where transaction originated
type TxSource uint8

const (
	SourceTelegram TxSource = iota
	SourceWeb
	SourceImport
)

func (s TxSource) String() string {
	switch s {
	case SourceTelegram:
		return "telegram"
	case SourceWeb:
		return "web"
	case SourceImport:
		return "import"
	}
	return "unknown"
}

// Frequency represents recurring transaction frequency
type Frequency uint8

const (
	FreqDaily Frequency = iota
	FreqWeekly
	FreqMonthly
	FreqYearly
)

func (f Frequency) String() string {
	switch f {
	case FreqDaily:
		return "daily"
	case FreqWeekly:
		return "weekly"
	case FreqMonthly:
		return "monthly"
	case FreqYearly:
		return "yearly"
	}
	return "unknown"
}

// AIConfidenceLevel maps numeric confidence to label
func AIConfidenceLevel(confidence float64) string {
	switch {
	case confidence >= 0.8:
		return "high"
	case confidence >= 0.5:
		return "medium"
	default:
		return "low"
	}
}
