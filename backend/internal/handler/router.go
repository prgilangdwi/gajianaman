package handler

import (
	"net/http"
)

type Router struct {
	mux             *http.ServeMux
	authMiddleware  *AuthMiddleware
	accountHandler  *AccountHandler
	txHandler       *TransactionHandler
	categoryHandler *CategoryHandler
	ledgerHandler   *LedgerHandler
	corsOrigins     []string
}

func NewRouter(
	authMiddleware *AuthMiddleware,
	accountHandler *AccountHandler,
	txHandler *TransactionHandler,
	categoryHandler *CategoryHandler,
	ledgerHandler *LedgerHandler,
	corsOrigins []string,
) *Router {
	return &Router{
		mux:             http.NewServeMux(),
		authMiddleware:  authMiddleware,
		accountHandler:  accountHandler,
		txHandler:       txHandler,
		categoryHandler: categoryHandler,
		ledgerHandler:   ledgerHandler,
		corsOrigins:     corsOrigins,
	}
}

func (r *Router) Setup() http.Handler {
	r.mux.HandleFunc("GET /health", func(w http.ResponseWriter, req *http.Request) {
		RespondSuccess(w, http.StatusOK, "OK", map[string]string{"status": "ok"})
	})

	r.mux.HandleFunc("POST /api/accounts", r.auth(r.accountHandler.Create))
	r.mux.HandleFunc("GET /api/accounts", r.auth(r.accountHandler.List))
	r.mux.HandleFunc("GET /api/accounts/check", r.auth(r.accountHandler.HasAccounts))
	r.mux.HandleFunc("GET /api/accounts/{id}", r.auth(r.accountHandler.Get))
	r.mux.HandleFunc("PATCH /api/accounts/{id}", r.auth(r.accountHandler.Update))
	r.mux.HandleFunc("DELETE /api/accounts/{id}", r.auth(r.accountHandler.Delete))

	r.mux.HandleFunc("POST /api/transactions", r.auth(r.txHandler.Create))
	r.mux.HandleFunc("GET /api/transactions", r.auth(r.txHandler.List))
	r.mux.HandleFunc("GET /api/transactions/summary", r.auth(r.txHandler.Summary))
	r.mux.HandleFunc("GET /api/transactions/{id}", r.auth(r.txHandler.Get))
	r.mux.HandleFunc("PATCH /api/transactions/{id}", r.auth(r.txHandler.Update))
	r.mux.HandleFunc("DELETE /api/transactions/{id}", r.auth(r.txHandler.Delete))

	r.mux.HandleFunc("GET /api/categories", r.auth(r.categoryHandler.List))

	r.mux.HandleFunc("GET /api/ledger", r.auth(r.ledgerHandler.List))
	r.mux.HandleFunc("GET /api/ledger/{id}", r.auth(r.ledgerHandler.Get))

	return CORSMiddleware(r.corsOrigins)(r.mux)
}

func (r *Router) auth(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		r.authMiddleware.Authenticate(http.HandlerFunc(handler)).ServeHTTP(w, req)
	}
}
