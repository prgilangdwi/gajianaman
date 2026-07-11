package handler

// Error codes for API responses
const (
	ErrUnauthorized     = "UNAUTHORIZED"
	ErrInvalidRequest   = "INVALID_REQUEST"
	ErrInvalidBody      = "INVALID_REQUEST_BODY"
	ErrInvalidAccountID = "INVALID_ACCOUNT_ID"
	ErrAccountNotFound  = "ACCOUNT_NOT_FOUND"
	ErrCannotDeleteLast = "CANNOT_DELETE_LAST_ACCOUNT"
	ErrInvalidTxID      = "INVALID_TRANSACTION_ID"
	ErrTxNotFound       = "TRANSACTION_NOT_FOUND"
	ErrInvalidAccount   = "INVALID_ACCOUNT"
	ErrInvalidCategory  = "INVALID_CATEGORY"
	ErrInvalidDate      = "INVALID_DATE_FORMAT"
	ErrInternalServer   = "INTERNAL_SERVER_ERROR"
	ErrMissingField     = "MISSING_REQUIRED_FIELD"
	ErrInvalidAmount    = "INVALID_AMOUNT"
)
