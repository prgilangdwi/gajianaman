package main

import (
	"context"
	"flag"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/prgilangdwi/gajianaman/internal/config"
	"github.com/prgilangdwi/gajianaman/internal/model"
)

type DefaultCategory struct {
	Code string
	Name string
	Icon string
	Type model.TransactionType
}

var defaultCategories = []DefaultCategory{
	// Fixed expense categories (8 categories)
	{"HOUSING", "Housing", "🏠", model.TypeExpense},
	{"BILLS", "Utilities", "📱", model.TypeExpense},
	{"LIFESTYLE", "Lifestyle & Entertainment", "🎮", model.TypeExpense},
	{"TRANSPORTATION", "Transportation", "🚗", model.TypeExpense},
	{"DINING", "Food & Dining", "🍜", model.TypeExpense},
	{"UNEXPECTED_EXPENSE", "Unexpected Expenses", "⚠️", model.TypeExpense},
	{"SAVING", "Savings & Investment", "🏦", model.TypeExpense},
	{"EDUCATION", "Education", "📚", model.TypeExpense},

	// Income categories
	{"SALARY", "Salary", "💼", model.TypeIncome},
	{"FREELANCE", "Freelance", "💻", model.TypeIncome},
	{"INVESTMENT_RETURN", "Investment Return", "📈", model.TypeIncome},
	{"OTHER_INCOME", "Other Income", "💚", model.TypeIncome},

	// Transfer category
	{"TRANSFER", "Transfer", "🔄", model.TypeTransfer},
}

func main() {
	var configPath string
	flag.StringVar(&configPath, "config", "./config.yaml", "path to config file")
	flag.Parse()

	cfg := config.Load(configPath)

	if cfg.Database.Host == "" {
		log.Fatal("database.host is required")
	}

	db, err := sqlx.Connect("postgres", cfg.Database.DSN())
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	fmt.Println("🌱 Seeding default categories...")

	seeded := 0
	skipped := 0

	for _, cat := range defaultCategories {
		var exists bool
		err := db.GetContext(ctx, &exists,
			`SELECT EXISTS(SELECT 1 FROM categories WHERE code = $1 AND user_id IS NULL AND deleted_at IS NULL)`,
			cat.Code)
		if err != nil {
			log.Printf("  ⚠️  Error checking %s: %v", cat.Code, err)
			continue
		}

		if exists {
			fmt.Printf("  ⏭️  %s %s [%s] (already exists)\n", cat.Icon, cat.Name, cat.Code)
			skipped++
			continue
		}

		id := uuid.New()
		_, err = db.ExecContext(ctx,
			`INSERT INTO categories (id, user_id, code, name, icon, type)
			 VALUES ($1, NULL, $2, $3, $4, $5)`,
			id, cat.Code, cat.Name, cat.Icon, cat.Type)
		if err != nil {
			log.Printf("  ❌ Error seeding %s: %v", cat.Code, err)
			continue
		}

		fmt.Printf("  ✅ %s %s [%s]\n", cat.Icon, cat.Name, cat.Code)
		seeded++
	}

	fmt.Println()
	fmt.Printf("✨ Done! Seeded: %d, Skipped: %d\n", seeded, skipped)
}
