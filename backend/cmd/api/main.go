package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prgilangdwi/gajianaman/internal/config"
	"github.com/prgilangdwi/gajianaman/internal/db"
	"github.com/prgilangdwi/gajianaman/internal/handler"
	"github.com/prgilangdwi/gajianaman/internal/repository"
	"github.com/prgilangdwi/gajianaman/internal/service"
)

func main() {
	var configPath string
	flag.StringVar(&configPath, "config", "./config.yaml", "path to config file")
	flag.Parse()

	cfg := config.Load(configPath)

	if cfg.Database.Host == "" {
		log.Fatal("database.host is required")
	}
	if cfg.API.SupabaseJWTSecret == "" {
		log.Fatal("api.supabase_jwt_secret is required")
	}

	database, err := db.New(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer database.Close()

	userRepo := repository.NewUserRepository(database.DB)
	accountRepo := repository.NewAccountRepository(database.DB)
	txRepo := repository.NewTransactionRepository(database.DB)
	categoryRepo := repository.NewCategoryRepository(database.DB)
	ledgerRepo := repository.NewLedgerRepository(database.DB)

	accountSvc := service.NewAccountService(accountRepo, txRepo, ledgerRepo)
	txSvc := service.NewTransactionService(txRepo, accountRepo, categoryRepo, ledgerRepo)
	categorySvc := service.NewCategoryService(categoryRepo)
	ledgerSvc := service.NewLedgerService(ledgerRepo, accountRepo)

	authMiddleware := handler.NewAuthMiddleware(userRepo, cfg.API.SupabaseJWTSecret)
	accountHandler := handler.NewAccountHandler(accountSvc)
	txHandler := handler.NewTransactionHandler(txSvc)
	categoryHandler := handler.NewCategoryHandler(categorySvc)
	ledgerHandler := handler.NewLedgerHandler(ledgerSvc)

	router := handler.NewRouter(authMiddleware, accountHandler, txHandler, categoryHandler, ledgerHandler, cfg.API.CORSOrigins)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.API.Port),
		Handler:      router.Setup(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 Gajian Aman API is running on port %d", cfg.API.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
