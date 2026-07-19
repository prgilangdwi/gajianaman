package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/prgilangdwi/gajianaman/internal/config"
)

func main() {
	var (
		configPath string
		steps      int
	)

	flag.StringVar(&configPath, "config", "./config.yaml", "path to config file")
	flag.IntVar(&steps, "steps", 1, "number of migrations to run (for up/down)")
	flag.Parse()

	cfg := config.Load(configPath)

	if cfg.Database.Host == "" {
		log.Fatal("database.host is required")
	}

	args := flag.Args()
	if len(args) < 1 {
		printUsage()
		os.Exit(1)
	}
	cmd := args[0]

	dsn := cfg.Database.DSN()
	migrationsPath := "file://internal/db/migrations"

	m, err := migrate.New(migrationsPath, dsn)
	if err != nil {
		log.Fatalf("failed to create migrator: %v", err)
	}
	defer m.Close()

	switch cmd {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("up failed: %v", err)
		}
		fmt.Println("migrations applied")

	case "down":
		if err := m.Steps(-steps); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("down failed: %v", err)
		}
		fmt.Printf("rolled back %d migration(s)\n", steps)

	case "drop":
		if err := m.Drop(); err != nil {
			log.Fatalf("drop failed: %v", err)
		}
		fmt.Println("database dropped")

	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("version failed: %v", err)
		}
		fmt.Printf("version: %d, dirty: %v\n", version, dirty)

	case "force":
		if len(args) < 2 {
			log.Fatal("force requires a version number")
		}
		var v int
		fmt.Sscanf(args[1], "%d", &v)
		if err := m.Force(v); err != nil {
			log.Fatalf("force failed: %v", err)
		}
		fmt.Printf("forced to version %d\n", v)

	default:
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`Usage: migrate [flags] <command>

Commands:
  up              Apply all pending migrations
  down            Rollback last migration (use -steps=N for more)
  drop            Drop all tables
  version         Show current migration version
  force <ver>     Force set version (use to fix dirty state)

Flags:
  --config <path>  Path to config file (default: ./config.yaml)
  -steps=N        Number of migrations for down (default: 1)`)
}
