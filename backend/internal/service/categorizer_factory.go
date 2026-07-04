package service

import (
	"context"
	"log"
	"strings"

	"github.com/prgilangdwi/gajianaman/internal/config"
)

// CategorizerProvider specifies which AI provider to use
type CategorizerProvider string

const (
	ProviderAnthropic CategorizerProvider = "anthropic"
	ProviderOpenCode  CategorizerProvider = "opencode"
)

// TransactionCategorizer is the interface for AI categorization
type TransactionCategorizer interface {
	Categorize(ctx context.Context, note string) (*CategorizationResult, error)
}

// CombinedCategorizer tries multiple providers with fallback
type CombinedCategorizer struct {
	primary  TransactionCategorizer
	fallback TransactionCategorizer
}

// NewCategorizerFromConfig creates a categorizer based on config.
//
// Provider notes:
//   - anthropic: Uses Claude API directly (recommended for production)
//   - opencode: Connects to a locally running OpenCode agent (for local dev)
//
// If primary provider fails, falls back to the other if configured.
func NewCategorizerFromConfig(cfg *config.Config) TransactionCategorizer {
	provider := CategorizerProvider(strings.ToLower(cfg.Categorizer.Provider))
	anthropicKey := cfg.Categorizer.AnthropicKey
	opencodeURL := cfg.Categorizer.OpenCodeURL

	var primary, fallback TransactionCategorizer

	switch provider {
	case ProviderOpenCode:
		if opencodeURL == "" {
			log.Println("categorizer.provider=opencode but opencode_url not set")
			if anthropicKey != "" {
				log.Println("Falling back to Anthropic")
				return NewCategorizer(anthropicKey)
			}
			log.Println("WARNING: No categorizer configured, using defaults")
			return &fallbackCategorizer{}
		}
		primary = NewOpenCodeCategorizer()
		if anthropicKey != "" {
			fallback = NewCategorizer(anthropicKey)
			log.Println("Using OpenCode as primary categorizer with Anthropic fallback")
		} else {
			log.Println("Using OpenCode as sole categorizer")
		}

	default:
		if anthropicKey == "" {
			log.Println("WARNING: anthropic_key not set")
			if opencodeURL != "" {
				log.Println("Falling back to OpenCode")
				return NewOpenCodeCategorizer()
			}
			log.Println("WARNING: No categorizer configured, using defaults")
			return &fallbackCategorizer{}
		}
		primary = NewCategorizer(anthropicKey)
		if opencodeURL != "" {
			fallback = NewOpenCodeCategorizer()
			log.Println("Using Anthropic as primary categorizer with OpenCode fallback")
		} else {
			log.Println("Using Anthropic as sole categorizer")
		}
	}

	if fallback == nil {
		return primary
	}

	return &CombinedCategorizer{
		primary:  primary,
		fallback: fallback,
	}
}

func (c *CombinedCategorizer) Categorize(ctx context.Context, note string) (*CategorizationResult, error) {
	result, err := c.primary.Categorize(ctx, note)
	if err == nil && result != nil && result.CategoryCode != "OTHER" {
		return result, nil
	}

	// Try fallback if primary failed or returned low confidence
	if c.fallback != nil {
		fallbackResult, fallbackErr := c.fallback.Categorize(ctx, note)
		if fallbackErr == nil && fallbackResult != nil {
			// Use fallback if it has better confidence or primary failed
			if result == nil || fallbackResult.Confidence > result.Confidence {
				return fallbackResult, nil
			}
		}
	}

	// Return primary result even if it's "Other"
	if result != nil {
		return result, nil
	}

	return defaultResult(), err
}

// fallbackCategorizer returns default results when no provider is configured
type fallbackCategorizer struct{}

func (f *fallbackCategorizer) Categorize(ctx context.Context, note string) (*CategorizationResult, error) {
	return defaultResult(), nil
}
