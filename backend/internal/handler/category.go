package handler

import (
	"net/http"
	"strconv"

	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/service"
)

type CategoryHandler struct {
	categorySvc *service.CategoryService
}

func NewCategoryHandler(categorySvc *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categorySvc: categorySvc}
}

type CategoryResponse struct {
	ID   string `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
	Icon string `json:"icon"`
	Type int    `json:"type"`
}

func categoryToResponse(cat *model.Category) CategoryResponse {
	return CategoryResponse{
		ID:   cat.ID.String(),
		Code: cat.Code,
		Name: cat.Name,
		Icon: cat.Icon,
		Type: int(cat.Type),
	}
}

// swagger:route GET /api/categories categories listCategories
//
// List categories.
//
// Returns all categories available to the authenticated user (global + user-specific).
// Optionally filter by transaction type.
//
//	Security:
//	  Bearer: []
//
//	Responses:
//	  200: categoryListResponse
//	  401: errorResponse
//	  500: errorResponse
func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromContext(r.Context())
	if user == nil {
		RespondError(w, http.StatusUnauthorized, "Unauthorized", ErrUnauthorized)
		return
	}

	var txType *model.TransactionType
	if t := r.URL.Query().Get("type"); t != "" {
		if parsed, err := strconv.Atoi(t); err == nil && parsed >= 0 && parsed <= 2 {
			tt := model.TransactionType(parsed)
			txType = &tt
		}
	}

	categories, err := h.categorySvc.ListForUser(r.Context(), user.ID, txType)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error(), ErrInternalServer)
		return
	}

	resp := make([]CategoryResponse, len(categories))
	for i, cat := range categories {
		resp[i] = categoryToResponse(&cat)
	}

	RespondSuccess(w, http.StatusOK, "Categories retrieved successfully", resp)
}
