package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/sst/opencode-sdk-go"
)

// OpenCodeCategorizer uses the OpenCode SDK for AI categorization
type OpenCodeCategorizer struct {
	client    *opencode.Client
	sessionID string
	mu        sync.Mutex
}

func NewOpenCodeCategorizer() *OpenCodeCategorizer {
	client := opencode.NewClient()
	return &OpenCodeCategorizer{
		client: client,
	}
}

func (c *OpenCodeCategorizer) getOrCreateSession(ctx context.Context) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.sessionID != "" {
		return c.sessionID, nil
	}

	session, err := c.client.Session.New(ctx, opencode.SessionNewParams{
		Title: opencode.F("gajianaman-categorizer"),
	})
	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}

	c.sessionID = session.ID
	return c.sessionID, nil
}

func (c *OpenCodeCategorizer) Categorize(ctx context.Context, note string) (*CategorizationResult, error) {
	sessionID, err := c.getOrCreateSession(ctx)
	if err != nil {
		return defaultResult(), nil
	}

	prompt := fmt.Sprintf(`%s

Transaction note: %s

Return ONLY the JSON response, no other text.`, systemPrompt, note)

	resp, err := c.client.Session.Prompt(ctx, sessionID, opencode.SessionPromptParams{
		Parts: opencode.F([]opencode.SessionPromptParamsPartUnion{
			opencode.TextPartInputParam{
				Text: opencode.F(prompt),
				Type: opencode.F(opencode.TextPartInputTypeText),
			},
		}),
	})
	if err != nil {
		return defaultResult(), nil
	}

	// Extract text from response parts
	var raw string
	for _, part := range resp.Parts {
		if part.Type == opencode.PartTypeText && part.Text != "" {
			raw = part.Text
			break
		}
	}

	if raw == "" {
		return defaultResult(), nil
	}

	// Strip markdown fences if present
	raw = strings.TrimSpace(raw)
	if strings.Contains(raw, "```") {
		parts := strings.Split(raw, "```")
		for _, part := range parts {
			part = strings.TrimSpace(part)
			if strings.HasPrefix(part, "json") {
				part = strings.TrimPrefix(part, "json")
				part = strings.TrimSpace(part)
			}
			if strings.HasPrefix(part, "{") {
				raw = part
				break
			}
		}
	}

	var result CategorizationResult
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return defaultResult(), nil
	}

	// Validate and normalize
	if result.CategoryCode == "" {
		result.CategoryCode = "OTHER"
	}
	result.CategoryCode = strings.ToUpper(result.CategoryCode)
	if result.Type == "" {
		result.Type = "expense"
	}
	if result.Confidence == 0 {
		result.Confidence = 0.5
	}

	return &result, nil
}

// Close cleans up the session
func (c *OpenCodeCategorizer) Close(ctx context.Context) {
	if c.sessionID != "" {
		c.client.Session.Delete(ctx, c.sessionID, opencode.SessionDeleteParams{})
	}
}
