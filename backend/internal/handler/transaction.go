package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/service"
	"github.com/prgilangdwi/gajianaman/pkg/generator"
)

type TransactionHandler struct {
	txSvc *service.TransactionService
}

func NewTransactionHandler(txSvc *service.TransactionService) *TransactionHandler {
	return &TransactionHandler{txSvc: txSvc}
}

type CreateTransactionRequest struct {
	AccountID  string  `json:"account_id"`
	CategoryID string  `json:"category_id"`
	Amount     float64 `json:"amount"`
	Type       int     `json:"type"`
	Note       string  `json:"note"`
	Date       string  `json:"date"`
}

type TransactionResponse struct {
	ID           string  `json:"id"`
	AccountID    string  `json:"account_id"`
	CategoryID   string  `json:"category_id"`
	CategoryName string  `json:"category_name,omitempty"`
	Amount       float64 `json:"amount"`
	Type         int     `json:"type"`
	TypeName     string  `json:"type_name"`
	Note         string  `json:"note"`
	Date         string  `json:"date"`
	Source       string  `json:"source"`
	CreatedAt    string  `json:"created_at"`
}

func txToResponse(tx *model.Transaction, categoryName string) TransactionResponse {
	typeName := "Expense"
	if tx.Type == model.TypeIncome {
		typeName = "Income"
	}

	source := "web"
	switch tx.Source {
	case model.SourceTelegram:
		source = "telegram"
	case model.SourceImport:
		source = "import"
	}

	note := ""
	if tx.Note.Valid {
		note = tx.Note.String
	}

	return TransactionResponse{
		ID:           tx.ID.String(),
		AccountID:    tx.AccountID.String(),
		CategoryID:   tx.CategoryID.String(),
		CategoryName: categoryName,
		Amount:       tx.Amount,
		Type:         int(tx.Type),
		TypeName:     typeName,
		Note:         note,
		Date:         tx.Date.Format("2006-01-02"),
		Source:       source,
		CreatedAt:    tx.CreatedAt.Format(time.RFC3339),
	}
}

// swagger:route POST /api/transactions transactions createTransaction
//
// Create a new transaction.
//
// Creates a new transaction for the authenticated user.
// The account balance will be updated automatically based on transaction type.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  201: transactionResponse
//	  400: errorResponse
//	  401: errorResponse
//	  500: errorResponse
func (h *TransactionHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	var req CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", ErrInvalidBody)
		return
	}

	if req.AccountID == "" {
		RespondError(w, http.StatusBadRequest, "Account ID is required", ErrMissingField)
		return
	}
	if req.CategoryID == "" {
		RespondError(w, http.StatusBadRequest, "Category ID is required", ErrMissingField)
		return
	}
	if req.Amount <= 0 {
		RespondError(w, http.StatusBadRequest, "Amount must be positive", ErrInvalidAmount)
		return
	}

	accountID, err := generator.ParseUUID(req.AccountID)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid account ID", ErrInvalidAccountID)
		return
	}

	categoryID, err := generator.ParseUUID(req.CategoryID)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid category ID", ErrInvalidCategory)
		return
	}

	txDate := time.Now()
	if req.Date != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			RespondError(w, http.StatusBadRequest, "Invalid date format, use YYYY-MM-DD", ErrInvalidDate)
			return
		}
		txDate = parsed
	}

	tx, err := h.txSvc.Create(r.Context(), service.CreateTransactionParams{
		UserID:     user.ID,
		AccountID:  accountID,
		CategoryID: categoryID,
		Amount:     req.Amount,
		Type:       model.TransactionType(req.Type),
		Note:       req.Note,
		Date:       txDate,
		Source:     GetSourceFromContext(r.Context()),
	})

	if err == service.ErrInvalidAccount {
		RespondError(w, http.StatusBadRequest, "Invalid account", ErrInvalidAccount)
		return
	}
	if err == service.ErrInvalidCategory {
		RespondError(w, http.StatusBadRequest, "Invalid category", ErrInvalidCategory)
		return
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondSuccess(w, http.StatusCreated, "Transaction created successfully", txToResponse(tx, ""))
}

// swagger:route GET /api/transactions transactions listTransactions
//
// List transactions.
//
// Returns transactions for the authenticated user, filtered by month and year.
// Defaults to the current month if not specified.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: transactionListResponse
//	  401: errorResponse
//	  500: errorResponse
func (h *TransactionHandler) List(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	limit := 50
	page := 1
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if p := r.URL.Query().Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	month := int(time.Now().Month())
	year := time.Now().Year()

	if m := r.URL.Query().Get("month"); m != "" {
		if parsed, err := strconv.Atoi(m); err == nil && parsed >= 1 && parsed <= 12 {
			month = parsed
		}
	}
	if y := r.URL.Query().Get("year"); y != "" {
		if parsed, err := strconv.Atoi(y); err == nil && parsed >= 2000 {
			year = parsed
		}
	}

	result, err := h.txSvc.ListByMonthPaginated(r.Context(), user.ID, month, year, page, limit)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	resp := make([]TransactionResponse, len(result.Items))
	for i, tx := range result.Items {
		resp[i] = txToResponse(&tx.Transaction, tx.CategoryName)
	}

	RespondList(w, "Transactions retrieved successfully", resp, page, limit, result.Total)
}

// swagger:route GET /api/transactions/{id} transactions getTransaction
//
// Get transaction by ID.
//
// Returns details of a specific transaction belonging to the authenticated user.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: transactionResponse
//	  400: errorResponse
//	  401: errorResponse
//	  404: errorResponse
//	  500: errorResponse
func (h *TransactionHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := generator.ParseUUID(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid transaction ID", ErrInvalidTxID)
		return
	}

	tx, err := h.txSvc.GetByID(r.Context(), id)
	if err == service.ErrTransactionNotFound {
		RespondError(w, http.StatusNotFound, "Transaction not found", ErrTxNotFound)
		return
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	if tx.UserID != user.ID {
		RespondError(w, http.StatusNotFound, "Transaction not found", ErrTxNotFound)
		return
	}

	RespondSuccess(w, http.StatusOK, "Transaction retrieved successfully", txToResponse(tx, ""))
}

type UpdateTransactionRequest struct {
	AccountID  *string  `json:"account_id,omitempty"`
	CategoryID *string  `json:"category_id,omitempty"`
	Amount     *float64 `json:"amount,omitempty"`
	Type       *int     `json:"type,omitempty"`
	Note       *string  `json:"note,omitempty"`
	Date       *string  `json:"date,omitempty"`
}

// swagger:route PATCH /api/transactions/{id} transactions updateTransaction
//
// Update a transaction.
//
// Updates the specified transaction. Only provided fields will be updated.
// If the account or amount changes, account balances will be adjusted accordingly.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: transactionResponse
//	  400: errorResponse
//	  401: errorResponse
//	  404: errorResponse
//	  500: errorResponse
func (h *TransactionHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := generator.ParseUUID(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid transaction ID", ErrInvalidTxID)
		return
	}

	var req UpdateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", ErrInvalidBody)
		return
	}

	params := service.UpdateTransactionParams{}

	if req.AccountID != nil {
		accID, err := generator.ParseUUID(*req.AccountID)
		if err != nil {
			RespondError(w, http.StatusBadRequest, "Invalid account ID", ErrInvalidAccountID)
			return
		}
		params.AccountID = &accID
	}

	if req.CategoryID != nil {
		catID, err := generator.ParseUUID(*req.CategoryID)
		if err != nil {
			RespondError(w, http.StatusBadRequest, "Invalid category ID", ErrInvalidCategory)
			return
		}
		params.CategoryID = &catID
	}

	params.Amount = req.Amount
	params.Note = req.Note

	if req.Type != nil {
		t := model.TransactionType(*req.Type)
		params.Type = &t
	}

	if req.Date != nil {
		parsed, err := time.Parse("2006-01-02", *req.Date)
		if err != nil {
			RespondError(w, http.StatusBadRequest, "Invalid date format, use YYYY-MM-DD", ErrInvalidDate)
			return
		}
		params.Date = &parsed
	}

	tx, err := h.txSvc.Update(r.Context(), id, user.ID, params)
	if err == service.ErrTransactionNotFound {
		RespondError(w, http.StatusNotFound, "Transaction not found", ErrTxNotFound)
		return
	}
	if err == service.ErrInvalidAccount {
		RespondError(w, http.StatusBadRequest, "Invalid account", ErrInvalidAccount)
		return
	}
	if err == service.ErrInvalidCategory {
		RespondError(w, http.StatusBadRequest, "Invalid category", ErrInvalidCategory)
		return
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondSuccess(w, http.StatusOK, "Transaction updated successfully", txToResponse(tx, ""))
}

// swagger:route DELETE /api/transactions/{id} transactions deleteTransaction
//
// Delete a transaction.
//
// Soft-deletes the specified transaction and reverses the balance change on the associated account.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  204: noContentResponse
//	  400: errorResponse
//	  401: errorResponse
//	  404: errorResponse
//	  500: errorResponse
func (h *TransactionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := generator.ParseUUID(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid transaction ID", ErrInvalidTxID)
		return
	}

	err = h.txSvc.Delete(r.Context(), id, user.ID)
	if err == service.ErrTransactionNotFound {
		RespondError(w, http.StatusNotFound, "Transaction not found", ErrTxNotFound)
		return
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondNoContent(w)
}

// swagger:route GET /api/transactions/summary transactions transactionSummary
//
// Get monthly spending summary.
//
// Returns spending breakdown by category for the specified month.
// Defaults to the current month if not specified.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: categorySummaryResponse
//	  401: errorResponse
//	  500: errorResponse
func (h *TransactionHandler) Summary(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	month := int(time.Now().Month())
	year := time.Now().Year()

	if m := r.URL.Query().Get("month"); m != "" {
		if parsed, err := strconv.Atoi(m); err == nil && parsed >= 1 && parsed <= 12 {
			month = parsed
		}
	}
	if y := r.URL.Query().Get("year"); y != "" {
		if parsed, err := strconv.Atoi(y); err == nil && parsed >= 2000 {
			year = parsed
		}
	}

	summary, err := h.txSvc.GetMonthlySummary(r.Context(), user.ID, month, year)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondSuccess(w, http.StatusOK, "Summary retrieved successfully", summary)
}
