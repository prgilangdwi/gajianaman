package handler

import (
	"encoding/json"
	"net/http"
)

// ApiResponse is the standard API response envelope
// swagger:model
type ApiResponse struct {
	// Whether the request was successful
	// example: true
	Success bool `json:"success"`

	// Human-readable message
	// example: Account created successfully
	Message string `json:"message"`

	// Response data (object or array)
	Data any `json:"data,omitempty"`

	// Pagination info (only for list endpoints)
	Pagination *Pagination `json:"pagination,omitempty"`

	// Error code (only for error responses)
	// example: INVALID_ACCOUNT_ID
	Error string `json:"error,omitempty"`
}

// Pagination contains pagination metadata for list responses
// swagger:model
type Pagination struct {
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

// RespondSuccess sends a success response with data
func RespondSuccess(w http.ResponseWriter, code int, message string, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(ApiResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// RespondList sends a success response with data and pagination
func RespondList(w http.ResponseWriter, message string, data any, page, limit, total int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ApiResponse{
		Success: true,
		Message: message,
		Data:    data,
		Pagination: &Pagination{
			Page:  page,
			Limit: limit,
			Total: total,
		},
	})
}

// RespondError sends an error response
func RespondError(w http.ResponseWriter, code int, message string, errCode string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(ApiResponse{
		Success: false,
		Message: message,
		Error:   errCode,
	})
}

// RespondNoContent sends a 204 No Content response
func RespondNoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}
