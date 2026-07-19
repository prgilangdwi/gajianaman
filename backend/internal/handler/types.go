package handler

// Account represents a user's financial account
// swagger:model
type AccountDTO struct {
	// The unique identifier of the account
	// example: 550e8400-e29b-41d4-a716-446655440000
	ID string `json:"id"`

	// The display name of the account
	// example: BCA Savings
	// required: true
	Name string `json:"name"`

	// Account type: 0=Cash, 1=Bank, 2=E-Wallet, 3=Credit Card, 4=Investment
	// example: 1
	// required: true
	Type int `json:"type"`

	// Human-readable account type name
	// example: Bank
	TypeName string `json:"type_name"`

	// Current balance in the account (in IDR)
	// example: 1500000
	Balance float64 `json:"balance"`

	// Whether this is the default account for transactions
	// example: true
	IsDefault bool `json:"is_default"`
}

// CreateAccountRequest represents the request body for creating an account
// swagger:model
type CreateAccountDTO struct {
	// The display name of the account
	// example: BCA Savings
	// required: true
	Name string `json:"name"`

	// Account type: 0=Cash, 1=Bank, 2=E-Wallet, 3=Credit Card, 4=Investment
	// example: 1
	// required: true
	Type int `json:"type"`

	// Initial balance in the account (in IDR)
	// example: 1000000
	Balance float64 `json:"balance"`

	// Set as default account
	// example: false
	IsDefault bool `json:"is_default"`
}

// UpdateAccountRequest represents the request body for updating an account
// swagger:model
type UpdateAccountDTO struct {
	// The display name of the account
	// example: BCA Savings Updated
	Name *string `json:"name,omitempty"`

	// Account type: 0=Cash, 1=Bank, 2=E-Wallet, 3=Credit Card, 4=Investment
	// example: 1
	Type *int `json:"type,omitempty"`

	// Set as default account
	// example: true
	IsDefault *bool `json:"is_default,omitempty"`
}

// Transaction represents a financial transaction
// swagger:model
type TransactionDTO struct {
	// The unique identifier of the transaction
	// example: 550e8400-e29b-41d4-a716-446655440001
	ID string `json:"id"`

	// The account ID this transaction belongs to
	// example: 550e8400-e29b-41d4-a716-446655440000
	AccountID string `json:"account_id"`

	// The category ID of this transaction
	// example: 550e8400-e29b-41d4-a716-446655440002
	CategoryID string `json:"category_id"`

	// The category name
	// example: Food & Dining
	CategoryName string `json:"category_name,omitempty"`

	// Transaction amount in IDR
	// example: 50000
	Amount float64 `json:"amount"`

	// Transaction type: 0=Expense, 1=Income
	// example: 0
	Type int `json:"type"`

	// Human-readable transaction type
	// example: Expense
	TypeName string `json:"type_name"`

	// Transaction note/description
	// example: Lunch at warung
	Note string `json:"note"`

	// Transaction date in YYYY-MM-DD format
	// example: 2024-01-15
	Date string `json:"date"`

	// Source of the transaction: telegram, web, import
	// example: web
	Source string `json:"source"`

	// When the transaction was created
	// example: 2024-01-15T12:30:00Z
	CreatedAt string `json:"created_at"`
}

// CreateTransactionRequest represents the request body for creating a transaction
// swagger:model
type CreateTransactionDTO struct {
	// The account ID for this transaction
	// example: 550e8400-e29b-41d4-a716-446655440000
	// required: true
	AccountID string `json:"account_id"`

	// The category ID for this transaction
	// example: 550e8400-e29b-41d4-a716-446655440002
	// required: true
	CategoryID string `json:"category_id"`

	// Transaction amount in IDR (must be positive)
	// example: 50000
	// required: true
	Amount float64 `json:"amount"`

	// Transaction type: 0=Expense, 1=Income
	// example: 0
	// required: true
	Type int `json:"type"`

	// Transaction note/description
	// example: Lunch at warung
	Note string `json:"note"`

	// Transaction date in YYYY-MM-DD format. Defaults to today if not provided.
	// example: 2024-01-15
	Date string `json:"date"`
}

// UpdateTransactionRequest represents the request body for updating a transaction
// swagger:model
type UpdateTransactionDTO struct {
	// The account ID for this transaction
	// example: 550e8400-e29b-41d4-a716-446655440000
	AccountID *string `json:"account_id,omitempty"`

	// The category ID for this transaction
	// example: 550e8400-e29b-41d4-a716-446655440002
	CategoryID *string `json:"category_id,omitempty"`

	// Transaction amount in IDR
	// example: 75000
	Amount *float64 `json:"amount,omitempty"`

	// Transaction type: 0=Expense, 1=Income
	// example: 0
	Type *int `json:"type,omitempty"`

	// Transaction note/description
	// example: Updated note
	Note *string `json:"note,omitempty"`

	// Transaction date in YYYY-MM-DD format
	// example: 2024-01-16
	Date *string `json:"date,omitempty"`
}

// ErrorResponse represents an error response
// swagger:model
type ErrorDTO struct {
	// Error message
	// example: invalid account id
	Error string `json:"error"`
}

// HasAccountsResponse represents the response for checking if user has accounts
// swagger:model
type HasAccountsDTO struct {
	// Whether the user has at least one account
	// example: true
	HasAccounts bool `json:"has_accounts"`
}

// CategorySummary represents spending summary by category
// swagger:model
type CategorySummaryDTO struct {
	// Category name
	// example: Food & Dining
	Category string `json:"category"`

	// Total amount spent in this category
	// example: 500000
	Total float64 `json:"total"`

	// Number of transactions in this category
	// example: 15
	Count int `json:"count"`
}

// swagger:parameters createAccount
type createAccountParams struct {
	// Account creation request
	// in: body
	// required: true
	Body CreateAccountDTO
}

// swagger:parameters updateAccount
type updateAccountParams struct {
	// Account ID
	// in: path
	// required: true
	ID string `json:"id"`

	// Account update request
	// in: body
	// required: true
	Body UpdateAccountDTO
}

// swagger:parameters getAccount deleteAccount
type accountIDParams struct {
	// Account ID
	// in: path
	// required: true
	ID string `json:"id"`
}

// swagger:parameters createTransaction
type createTransactionParams struct {
	// Transaction creation request
	// in: body
	// required: true
	Body CreateTransactionDTO
}

// swagger:parameters listTransactions
type listTransactionsParams struct {
	// Month (1-12)
	// in: query
	Month int `json:"month"`

	// Year (e.g., 2024)
	// in: query
	Year int `json:"year"`

	// Maximum number of results (1-100, default 50)
	// in: query
	Limit int `json:"limit"`
}

// swagger:parameters transactionSummary
type transactionSummaryParams struct {
	// Month (1-12)
	// in: query
	Month int `json:"month"`

	// Year (e.g., 2024)
	// in: query
	Year int `json:"year"`
}

// swagger:parameters updateTransaction
type updateTransactionParams struct {
	// Transaction ID
	// in: path
	// required: true
	ID string `json:"id"`

	// Transaction update request
	// in: body
	// required: true
	Body UpdateTransactionDTO
}

// swagger:parameters getTransaction deleteTransaction
type transactionIDParams struct {
	// Transaction ID
	// in: path
	// required: true
	ID string `json:"id"`
}

// SuccessResponse is the standard success response envelope
// swagger:model
type SuccessResponse struct {
	// Whether the request was successful
	// example: true
	Success bool `json:"success"`

	// Human-readable message
	// example: Account created successfully
	Message string `json:"message"`

	// Response data
	Data any `json:"data"`
}

// ListResponse is the standard list response envelope with pagination
// swagger:model
type ListResponse struct {
	// Whether the request was successful
	// example: true
	Success bool `json:"success"`

	// Human-readable message
	// example: Transactions retrieved successfully
	Message string `json:"message"`

	// Response data array
	Data any `json:"data"`

	// Pagination info
	Pagination *PaginationDTO `json:"pagination"`
}

// PaginationDTO contains pagination metadata
// swagger:model
type PaginationDTO struct {
	// Current page number
	// example: 1
	Page int `json:"page"`

	// Items per page
	// example: 50
	Limit int `json:"limit"`

	// Total number of items
	// example: 200
	Total int `json:"total"`
}

// ErrorResponse is the standard error response envelope
// swagger:model
type ErrorResponse struct {
	// Whether the request was successful
	// example: false
	Success bool `json:"success"`

	// Human-readable error message
	// example: Invalid account ID
	Message string `json:"message"`

	// Error code for client handling
	// example: INVALID_ACCOUNT_ID
	Error string `json:"error"`
}

// swagger:response accountResponse
type accountResponseWrapper struct {
	// in: body
	Body struct {
		Success bool       `json:"success"`
		Message string     `json:"message"`
		Data    AccountDTO `json:"data"`
	}
}

// swagger:response accountListResponse
type accountListResponseWrapper struct {
	// in: body
	Body struct {
		Success bool         `json:"success"`
		Message string       `json:"message"`
		Data    []AccountDTO `json:"data"`
	}
}

// swagger:response hasAccountsResponse
type hasAccountsResponseWrapper struct {
	// in: body
	Body struct {
		Success bool           `json:"success"`
		Message string         `json:"message"`
		Data    HasAccountsDTO `json:"data"`
	}
}

// swagger:response transactionResponse
type transactionResponseWrapper struct {
	// in: body
	Body struct {
		Success bool           `json:"success"`
		Message string         `json:"message"`
		Data    TransactionDTO `json:"data"`
	}
}

// swagger:response transactionListResponse
type transactionListResponseWrapper struct {
	// in: body
	Body struct {
		Success    bool             `json:"success"`
		Message    string           `json:"message"`
		Data       []TransactionDTO `json:"data"`
		Pagination *PaginationDTO   `json:"pagination"`
	}
}

// swagger:response categorySummaryResponse
type categorySummaryResponseWrapper struct {
	// in: body
	Body struct {
		Success bool                 `json:"success"`
		Message string               `json:"message"`
		Data    []CategorySummaryDTO `json:"data"`
	}
}

// swagger:response errorResponse
type errorResponseWrapper struct {
	// in: body
	Body ErrorResponse
}

// swagger:response noContentResponse
type noContentResponseWrapper struct{}

// CategoryDTO represents a transaction category
// swagger:model
type CategoryDTO struct {
	// Category ID
	// example: 550e8400-e29b-41d4-a716-446655440000
	ID string `json:"id"`

	// Category code
	// example: FOOD_AND_DINING
	Code string `json:"code"`

	// Category display name
	// example: Food & Dining
	Name string `json:"name"`

	// Category icon emoji
	// example: 🍔
	Icon string `json:"icon"`

	// Category type: 0=Expense, 1=Income
	// example: 0
	Type int `json:"type"`
}

// swagger:parameters listCategories
type listCategoriesParams struct {
	// Filter by transaction type: 0=Expense, 1=Income
	// in: query
	Type int `json:"type"`
}

// swagger:response categoryListResponse
type categoryListResponseWrapper struct {
	// in: body
	Body struct {
		Success bool          `json:"success"`
		Message string        `json:"message"`
		Data    []CategoryDTO `json:"data"`
	}
}

// LedgerEntryDTO represents a ledger entry in API responses
// swagger:model ledgerEntryData
type LedgerEntryDTO struct {
	// The ledger entry ID
	// example: 01JQWZ3N5KP9XYZ8M2V7B4CDEF
	ID string `json:"id"`
	// The account ID this entry belongs to
	// example: 01JQWZ3N5KP9XYZ8M2V7B4CABC
	AccountID string `json:"account_id"`
	// The transaction ID that created this entry (null for manual adjustments)
	// example: 01JQWZ3N5KP9XYZ8M2V7B4CXYZ
	TransactionID *string `json:"transaction_id,omitempty"`
	// Type of ledger entry: credit or debit
	// example: credit
	Type string `json:"type"`
	// Amount (always positive)
	// example: 50000
	Amount float64 `json:"amount"`
	// Balance before this entry
	// example: 100000
	StartingBalance float64 `json:"starting_balance"`
	// Balance after this entry
	// example: 150000
	EndingBalance float64 `json:"ending_balance"`
	// When the entry was created
	// example: 2026-07-19T10:30:00Z
	CreatedAt string `json:"created_at"`
}

// swagger:parameters listLedger
type listLedgerParams struct {
	// Filter by account ID
	// in: query
	AccountID string `json:"account_id"`
	// Filter from date (YYYY-MM-DD, user timezone)
	// in: query
	StartDate string `json:"start_date"`
	// Filter until date (YYYY-MM-DD, user timezone)
	// in: query
	EndDate string `json:"end_date"`
	// Page number
	// in: query
	// default: 1
	Page int `json:"page"`
	// Items per page (max 100)
	// in: query
	// default: 50
	Limit int `json:"limit"`
}

// swagger:parameters getLedgerEntry
type getLedgerEntryParams struct {
	// Ledger entry ID
	// in: path
	// required: true
	ID string `json:"id"`
}

// swagger:response ledgerEntryResponse
type ledgerEntryResponseWrapper struct {
	// in: body
	Body struct {
		Success bool           `json:"success"`
		Message string         `json:"message"`
		Data    LedgerEntryDTO `json:"data"`
	}
}

// swagger:response ledgerListResponse
type ledgerListResponseWrapper struct {
	// in: body
	Body struct {
		Success    bool             `json:"success"`
		Message    string           `json:"message"`
		Data       []LedgerEntryDTO `json:"data"`
		Pagination PaginationDTO    `json:"pagination"`
	}
}
