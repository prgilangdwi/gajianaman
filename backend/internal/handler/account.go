package handler

import (
	"encoding/json"
	"net/http"

	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/service"
	"github.com/prgilangdwi/gajianaman/pkg/generator"
)

type AccountHandler struct {
	accountSvc *service.AccountService
}

func NewAccountHandler(accountSvc *service.AccountService) *AccountHandler {
	return &AccountHandler{accountSvc: accountSvc}
}

type CreateAccountRequest struct {
	Name      string  `json:"name"`
	Type      int     `json:"type"`
	Balance   float64 `json:"balance"`
	IsDefault bool    `json:"is_default"`
}

type AccountResponse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Type      int     `json:"type"`
	TypeName  string  `json:"type_name"`
	Balance   float64 `json:"balance"`
	IsDefault bool    `json:"is_default"`
}

func accountToResponse(acc *model.Account) AccountResponse {
	typeName := "Cash"
	switch acc.Type {
	case model.AccountBank:
		typeName = "Bank"
	case model.AccountEwallet:
		typeName = "E-Wallet"
	case model.AccountCreditCard:
		typeName = "Credit Card"
	case model.AccountInvestment:
		typeName = "Investment"
	}

	return AccountResponse{
		ID:        acc.ID.String(),
		Name:      acc.Name,
		Type:      int(acc.Type),
		TypeName:  typeName,
		Balance:   acc.Balance,
		IsDefault: acc.IsDefault,
	}
}

// swagger:route POST /api/accounts accounts createAccount
//
// Create a new account.
//
// Creates a new financial account for the authenticated user.
// The first account created will automatically be set as default.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  201: accountResponse
//	  400: errorResponse
//	  401: errorResponse
//	  500: errorResponse
func (h *AccountHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	var req CreateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", ErrInvalidBody)
		return
	}

	if req.Name == "" {
		RespondError(w, http.StatusBadRequest, "Name is required", ErrMissingField)
		return
	}

	acc, err := h.accountSvc.Create(r.Context(), service.CreateAccountParams{
		UserID:    user.ID,
		Name:      req.Name,
		Type:      model.AccountType(req.Type),
		Balance:   req.Balance,
		IsDefault: req.IsDefault,
	})
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondSuccess(w, http.StatusCreated, "Account created successfully", accountToResponse(acc))
}

// swagger:route GET /api/accounts accounts listAccounts
//
// List all accounts.
//
// Returns all accounts belonging to the authenticated user, ordered by default status and name.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: accountListResponse
//	  401: errorResponse
//	  500: errorResponse
func (h *AccountHandler) List(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	accounts, err := h.accountSvc.List(r.Context(), user.ID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	resp := make([]AccountResponse, len(accounts))
	for i, acc := range accounts {
		resp[i] = accountToResponse(&acc)
	}

	RespondSuccess(w, http.StatusOK, "Accounts retrieved successfully", resp)
}

// swagger:route GET /api/accounts/{id} accounts getAccount
//
// Get account by ID.
//
// Returns details of a specific account belonging to the authenticated user.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: accountResponse
//	  400: errorResponse
//	  401: errorResponse
//	  404: errorResponse
//	  500: errorResponse
func (h *AccountHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := generator.ParseUUID(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid account ID", ErrInvalidAccountID)
		return
	}

	acc, err := h.accountSvc.GetByID(r.Context(), id)
	if err == service.ErrAccountNotFound {
		RespondError(w, http.StatusNotFound, "Account not found", ErrAccountNotFound)
		return
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	if acc.UserID != user.ID {
		RespondError(w, http.StatusNotFound, "Account not found", ErrAccountNotFound)
		return
	}

	RespondSuccess(w, http.StatusOK, "Account retrieved successfully", accountToResponse(acc))
}

type UpdateAccountRequest struct {
	Name      *string `json:"name,omitempty"`
	Type      *int    `json:"type,omitempty"`
	IsDefault *bool   `json:"is_default,omitempty"`
}

// swagger:route PATCH /api/accounts/{id} accounts updateAccount
//
// Update an account.
//
// Updates the specified account. Only provided fields will be updated.
// Setting is_default to true will clear the default flag from other accounts.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: accountResponse
//	  400: errorResponse
//	  401: errorResponse
//	  404: errorResponse
//	  500: errorResponse
func (h *AccountHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := generator.ParseUUID(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid account ID", ErrInvalidAccountID)
		return
	}

	var req UpdateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid request body", ErrInvalidBody)
		return
	}

	params := service.UpdateAccountParams{
		Name:      req.Name,
		IsDefault: req.IsDefault,
	}
	if req.Type != nil {
		t := model.AccountType(*req.Type)
		params.Type = &t
	}

	acc, err := h.accountSvc.Update(r.Context(), id, user.ID, params)
	if err == service.ErrAccountNotFound {
		RespondError(w, http.StatusNotFound, "Account not found", ErrAccountNotFound)
		return
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondSuccess(w, http.StatusOK, "Account updated successfully", accountToResponse(acc))
}

// swagger:route DELETE /api/accounts/{id} accounts deleteAccount
//
// Delete an account.
//
// Soft-deletes the specified account. Cannot delete the last remaining account.
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
func (h *AccountHandler) Delete(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	idStr := r.PathValue("id")
	id, err := generator.ParseUUID(idStr)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Invalid account ID", ErrInvalidAccountID)
		return
	}

	err = h.accountSvc.Delete(r.Context(), id, user.ID)
	if err == service.ErrAccountNotFound {
		RespondError(w, http.StatusNotFound, "Account not found", ErrAccountNotFound)
		return
	}
	if err == service.ErrCannotDeleteLast {
		RespondError(w, http.StatusBadRequest, "Cannot delete last account", ErrCannotDeleteLast)
		return
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondNoContent(w)
}

// swagger:route GET /api/accounts/check accounts hasAccounts
//
// Check if user has accounts.
//
// Returns whether the authenticated user has at least one account.
// Used for onboarding flow to redirect users without accounts.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: hasAccountsResponse
//	  401: errorResponse
//	  500: errorResponse
func (h *AccountHandler) HasAccounts(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	has, err := h.accountSvc.HasAccounts(r.Context(), user.ID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	RespondSuccess(w, http.StatusOK, "Check completed", map[string]bool{"has_accounts": has})
}
