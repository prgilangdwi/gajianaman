package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/prgilangdwi/gajianaman/internal/bot"
	"github.com/prgilangdwi/gajianaman/internal/config"
	"github.com/prgilangdwi/gajianaman/internal/db"
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
	if cfg.Bot.Token == "" {
		log.Fatal("bot.token is required")
	}

	database, err := db.New(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer database.Close()

	categorizer := service.NewCategorizerFromConfig(cfg)

	telegramBot, err := bot.New(cfg.Bot.Token, database.DB, categorizer)
	if err != nil {
		log.Fatalf("failed to create bot: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Shutting down...")
		cancel()
	}()

	log.Println("🤖 Gajian Aman Bot is running...")
	if err := telegramBot.Start(ctx); err != nil {
		log.Fatalf("bot error: %v", err)
	}
}
