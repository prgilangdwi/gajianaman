package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/service"
	"github.com/prgilangdwi/gajianaman/pkg/generator"
)

type LedgerHandler struct {
	ledgerSvc *service.LedgerService
}

func NewLedgerHandler(ledgerSvc *service.LedgerService) *LedgerHandler {
	return &LedgerHandler{ledgerSvc: ledgerSvc}
}

type LedgerEntryResponse struct {
	ID              string  `json:"id"`
	AccountID       string  `json:"account_id"`
	TransactionID   *string `json:"transaction_id,omitempty"`
	Type            string  `json:"type"`
	Amount          float64 `json:"amount"`
	StartingBalance float64 `json:"starting_balance"`
	EndingBalance   float64 `json:"ending_balance"`
	CreatedAt       string  `json:"created_at"`
}

func ledgerToResponse(entry *model.LedgerEntry) LedgerEntryResponse {
	resp := LedgerEntryResponse{
		ID:              entry.ID.String(),
		AccountID:       entry.AccountID.String(),
		Type:            string(entry.Type),
		Amount:          entry.Amount,
		StartingBalance: entry.StartingBalance,
		EndingBalance:   entry.EndingBalance,
		CreatedAt:       entry.CreatedAt.Format(time.RFC3339),
	}
	if entry.TransactionID.Valid {
		txID := entry.TransactionID.UUID.String()
		resp.TransactionID = &txID
	}
	return resp
}

func parseDateInTimezone(dateStr, timezone string, isEndOfDay bool) (*time.Time, error) {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}

	t, err := time.ParseInLocation("2006-01-02", dateStr, loc)
	if err != nil {
		return nil, err
	}

	if isEndOfDay {
		t = t.Add(24*time.Hour - time.Second)
	}

	utc := t.UTC()
	return &utc, nil
}

// swagger:route GET /api/ledger ledger listLedger
//
// List ledger entries.
//
// Returns paginated ledger entries for the authenticated user.
// Supports filtering by account_id and date range.
// Dates are in user's timezone (YYYY-MM-DD format).
//
//	Security:
//	  Bearer: []
//
//	Parameters:
//	  + name: account_id
//	    in: query
//	    type: string
//	    description: Filter by account ID (optional)
//	  + name: start_date
//	    in: query
//	    type: string
//	    format: date
//	    description: Filter from date (YYYY-MM-DD, user timezone)
//	  + name: end_date
//	    in: query
//	    type: string
//	    format: date
//	    description: Filter until date (YYYY-MM-DD, user timezone)
//	  + name: page
//	    in: query
//	    type: integer
//	    default: 1
//	  + name: limit
//	    in: query
//	    type: integer
//	    default: 50
//
//	Responses:
//	  200: ledgerListResponse
//	  400: errorResponse
//	  401: errorResponse
func (h *LedgerHandler) List(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	// Parse pagination
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

	// Parse account_id filter
	params := service.ListLedgerParams{
		UserID: user.ID,
		Page:   page,
		Limit:  limit,
	}

	if accountIDStr := r.URL.Query().Get("account_id"); accountIDStr != "" {
		accountID, err := generator.ParseUUID(accountIDStr)
		if err != nil {
			RespondError(w, http.StatusBadRequest, "Invalid account ID", ErrInvalidAccountID)
			return
		}
		params.AccountID = &accountID
	}

	// Parse date filters (default to Asia/Jakarta)
	timezone := "Asia/Jakarta"

	if startDateStr := r.URL.Query().Get("start_date"); startDateStr != "" {
		startDate, err := parseDateInTimezone(startDateStr, timezone, false)
		if err != nil {
			RespondError(w, http.StatusBadRequest, "Invalid start_date format, use YYYY-MM-DD", ErrInvalidDateFormat)
			return
		}
		params.StartDate = startDate
	}

	if endDateStr := r.URL.Query().Get("end_date"); endDateStr != "" {
		endDate, err := parseDateInTimezone(endDateStr, timezone, true)
		if err != nil {
			RespondError(w, http.StatusBadRequest, "Invalid end_date format, use YYYY-MM-DD", ErrInvalidDateFormat)
			return
		}
		params.EndDate = endDate
	}

	result, err := h.ledgerSvc.List(r.Context(), params)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Failed to retrieve ledger entries", ErrInternalServer)
		return
	}

	resp := make([]LedgerEntryResponse, len(result.Items))
	for i, entry := range result.Items {
		resp[i] = ledgerToResponse(&entry)
	}

	RespondList(w, "Ledger entries retrieved successfully", resp, page, limit, result.Total)
}

// swagger:route GET /api/ledger/{id} ledger getLedgerEntry
//
// Get a single ledger entry.
//
// Returns details of a specific ledger entry.
//
//	Security:
//	  Bearer: []
//
//	Parameters:
//	  + name: id
//	    in: path
//	    required: true
//	    type: string
//
//	Responses:
//	  200: ledgerEntryResponse
//	  400: errorResponse
//	  401: errorResponse
//	  404: errorResponse
func (h *LedgerHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := generator.ParseUUID(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid ledger ID", ErrInvalidLedgerID)
		return
	}

	entry, err := h.ledgerSvc.GetByID(r.Context(), id, user.ID)
	if err != nil {
		if err == service.ErrLedgerNotFound {
			RespondError(w, http.StatusNotFound, "Ledger entry not found", ErrLedgerNotFound)
			return
		}
		RespondError(w, http.StatusInternalServerError, "Failed to retrieve ledger entry", ErrInternalServer)
		return
	}

	RespondSuccess(w, http.StatusOK, "Ledger entry retrieved successfully", ledgerToResponse(entry))
}
