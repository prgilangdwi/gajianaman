.PHONY: build build-bot build-api build-migrate build-seed run run-api migrate seed clean dev dev-api dev-migrate dev-seed deps test lint swagger swagger-ui help

# Git info
COMMIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build flags
LDFLAGS := -ldflags "-X main.Version=$(COMMIT_HASH) -X main.BuildTime=$(BUILD_TIME)"

# Output directory and binaries
BUILD_DIR := build
BOT := $(BUILD_DIR)/bot
API := $(BUILD_DIR)/api
MIGRATE := $(BUILD_DIR)/migrate
SEED := $(BUILD_DIR)/seed

# Config file (override with: make dev-api CONFIG=./other.yaml)
CONFIG ?= ./config.yaml

# Capture arguments after target
ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
$(eval $(ARGS):;@:)

# Default target
all: build

# Build all binaries
build: build-bot build-api build-migrate build-seed

build-bot:
	@mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(BOT) ./cmd/bot

build-api:
	@mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(API) ./cmd/api

build-migrate:
	@mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(MIGRATE) ./cmd/migrate

build-seed:
	@mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(SEED) ./cmd/seed

# Run commands (use existing binary)
run:
	$(BOT) --config=$(CONFIG) $(ARGS)

run-api:
	$(API) --config=$(CONFIG) $(ARGS)

migrate:
	$(MIGRATE) $(ARGS)

seed:
	$(SEED) $(ARGS)

# Development - run with go run (no build needed)
dev:
	go run ./cmd/bot --config=$(CONFIG) $(ARGS)

dev-api:
	go run ./cmd/api --config=$(CONFIG) $(ARGS)

dev-migrate:
	go run ./cmd/migrate $(ARGS)

dev-seed:
	go run ./cmd/seed $(ARGS)

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)

# Install dependencies
deps:
	go mod download
	go mod tidy

# Run tests
test:
	go test -v ./...

# Run linter
lint:
	golangci-lint run ./...

# Generate OpenAPI spec (requires go-swagger: go install github.com/go-swagger/go-swagger/cmd/swagger@latest)
swagger:
	$(shell go env GOPATH)/bin/swagger generate spec -o ./swagger.json --scan-models
	@echo "Generated swagger.json"

# Serve Swagger UI at http://localhost:8081/docs
swagger-ui:
	@echo "Swagger UI available at http://localhost:8081/docs"
	$(shell go env GOPATH)/bin/swagger serve --no-open --port=8081 ./swagger.json

help:
	@echo "Usage: make <target> [args...]"
	@echo ""
	@echo "Build:"
	@echo "  build           - Build all binaries to $(BUILD_DIR)/"
	@echo "  build-bot       - Build bot binary"
	@echo "  build-api       - Build API server binary"
	@echo "  build-migrate   - Build migrate binary"
	@echo "  build-seed      - Build seed binary"
	@echo ""
	@echo "Run (requires build first):"
	@echo "  run             - Run bot"
	@echo "  run-api         - Run API server"
	@echo "  migrate <cmd>   - Run migrate (e.g., make migrate up)"
	@echo "  seed            - Run database seeder"
	@echo ""
	@echo "Dev (no build needed):"
	@echo "  dev             - Run bot with go run"
	@echo "  dev-api         - Run API server with go run"
	@echo "  dev-migrate     - Run migrate (e.g., make dev-migrate up)"
	@echo "  dev-seed        - Run seed with go run"
	@echo ""
	@echo "Other:"
	@echo "  clean           - Remove build artifacts"
	@echo "  deps            - Download and tidy dependencies"
	@echo "  test            - Run tests"
	@echo "  lint            - Run linter"
	@echo "  swagger         - Generate OpenAPI spec (swagger.json)"
	@echo "  swagger-ui      - Open Swagger UI in browser"
	@echo ""
	@echo "Examples:"
	@echo "  make dev-api"
	@echo "  make dev-api CONFIG=./custom.yaml"
	@echo "  make run-api CONFIG=./prod.yaml"
	@echo "  make dev-migrate up"
	@echo "  make migrate down -steps=2"
