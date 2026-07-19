package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/prgilangdwi/gajianaman/internal/model"
)

const systemPrompt = `You are a personal finance categorization assistant for Indonesian users.

Given a transaction note (in Indonesian or English), classify it into one of these categories (use the CODE in your response):

EXPENSE categories:
- FOOD_AND_DINING      → makan, minum, warung, resto, cafe, bakso, nasi, kopi, jajan, beli makan
- GROCERIES            → supermarket, indomaret, alfamart, belanja, sayur, bahan masak, sembako
- TRANSPORT            → grab, gojek, bensin, parkir, tol, ojek, busway, kereta, taksi, bbm
- SHOPPING             → baju, sepatu, shopee, tokopedia, mall, belanja online, elektronik
- HEALTH               → apotek, dokter, obat, klinik, rumah sakit, vitamin, bpjs
- ENTERTAINMENT        → bioskop, netflix, spotify, game, konser, youtube premium, disney
- BILLS_AND_UTILITIES  → listrik, air, internet, pulsa, pln, telkom, wifi, indihome
- EDUCATION            → kursus, buku, seminar, pelatihan, sekolah, les, udemy
- PERSONAL_CARE        → salon, potong rambut, skincare, makeup, gym, perawatan
- DINING_OUT           → restoran, makan di luar, delivery, gofood, grabfood, shopeefood

INCOME categories:
- SALARY               → gaji, salary, thr
- FREELANCE            → freelance, project, fee, honor
- INVESTMENT_RETURN    → dividen, return, bunga, profit
- OTHER_INCOME         → transfer masuk, cashback, refund

SAVING categories:
- SAVINGS              → nabung, saving, deposit, tabungan
- INVESTMENT           → investasi, reksa dana, saham, crypto, emas

Rules:
- Return ONLY valid JSON. No text outside JSON.
- Always pick the best matching category even if uncertain.
- Use context of Indonesian daily life.
- Return the UPPERCASE category CODE (not the display name).

Return this exact format:
{
  "category_code": "FOOD_AND_DINING",
  "subcategory": "Street Food / Snacks",
  "type": "expense",
  "confidence": 0.85,
  "reason": "Kata 'jajan di warung' menunjukkan pembelian makanan di warung kecil."
}`

type CategorizationResult struct {
	CategoryCode string  `json:"category_code"`
	Subcategory  string  `json:"subcategory"`
	Type         string  `json:"type"`
	Confidence   float64 `json:"confidence"`
	Reason       string  `json:"reason"`
}

type Categorizer struct {
	apiKey string
	client *http.Client
}

func NewCategorizer(apiKey string) *Categorizer {
	return &Categorizer{
		apiKey: apiKey,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

type anthropicRequest struct {
	Model     string              `json:"model"`
	MaxTokens int                 `json:"max_tokens"`
	System    string              `json:"system"`
	Messages  []anthropicMessage  `json:"messages"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (c *Categorizer) Categorize(ctx context.Context, note string) (*CategorizationResult, error) {
	reqBody := anthropicRequest{
		Model:     "claude-3-5-haiku-latest",
		MaxTokens: 256,
		System:    systemPrompt,
		Messages: []anthropicMessage{
			{Role: "user", Content: "Transaction note: " + note},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return defaultResult(), nil
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(jsonBody))
	if err != nil {
		return defaultResult(), nil
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := c.client.Do(req)
	if err != nil {
		return defaultResult(), nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return defaultResult(), nil
	}

	var apiResp anthropicResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return defaultResult(), nil
	}

	if apiResp.Error != nil {
		return defaultResult(), fmt.Errorf("API error: %s", apiResp.Error.Message)
	}

	if len(apiResp.Content) == 0 {
		return defaultResult(), nil
	}

	raw := ""
	for _, block := range apiResp.Content {
		if block.Type == "text" {
			raw = block.Text
			break
		}
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
	// Normalize to uppercase
	result.CategoryCode = strings.ToUpper(result.CategoryCode)
	if result.Type == "" {
		result.Type = "expense"
	}
	if result.Confidence == 0 {
		result.Confidence = 0.5
	}

	return &result, nil
}

func defaultResult() *CategorizationResult {
	return &CategorizationResult{
		CategoryCode: "OTHER",
		Subcategory:  "Uncategorized",
		Type:         "expense",
		Confidence:   0.3,
		Reason:       "Tidak dapat mengklasifikasikan otomatis.",
	}
}

// GetTransactionType converts string type to model.TransactionType
func GetTransactionType(typeStr string) model.TransactionType {
	switch strings.ToLower(typeStr) {
	case "income":
		return model.TypeIncome
	case "transfer":
		return model.TypeTransfer
	default:
		return model.TypeExpense
	}
}

// ConfidenceLevel converts numeric confidence to string label
func ConfidenceLevel(conf float64) string {
	if conf >= 0.8 {
		return "high"
	}
	if conf >= 0.5 {
		return "medium"
	}
	return "low"
}
