package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/repository"
)

// FormatCurrency formats amount as Indonesian Rupiah
func FormatCurrency(amount float64) string {
	if amount >= 1_000_000 {
		return fmt.Sprintf("Rp %.1fjt", amount/1_000_000)
	}
	if amount >= 1_000 {
		return fmt.Sprintf("Rp %.0fk", amount/1_000)
	}
	return fmt.Sprintf("Rp %.0f", amount)
}

// FormatCurrencyFull formats amount with full number
func FormatCurrencyFull(amount float64) string {
	s := fmt.Sprintf("%.0f", amount)
	// Add thousand separators
	n := len(s)
	if n <= 3 {
		return "Rp " + s
	}
	var parts []string
	for i := n; i > 0; i -= 3 {
		start := i - 3
		if start < 0 {
			start = 0
		}
		parts = append([]string{s[start:i]}, parts...)
	}
	return "Rp " + strings.Join(parts, ".")
}

type ConfirmInfo struct {
	Amount       float64
	Note         string
	CategoryCode string
	Type         model.TransactionType
	Confidence   string
	Reason       string
}

// CodeToDisplayName converts a category code to display name
func CodeToDisplayName(code string) string {
	names := map[string]string{
		"FOOD_AND_DINING":     "Food & Dining",
		"GROCERIES":           "Groceries",
		"TRANSPORT":           "Transport",
		"SHOPPING":            "Shopping",
		"HEALTH":              "Health",
		"ENTERTAINMENT":       "Entertainment",
		"BILLS_AND_UTILITIES": "Bills & Utilities",
		"EDUCATION":           "Education",
		"PERSONAL_CARE":       "Personal Care",
		"DINING_OUT":          "Dining Out",
		"OTHER":               "Other",
		"SALARY":              "Salary",
		"FREELANCE":           "Freelance",
		"INVESTMENT_RETURN":   "Investment Return",
		"OTHER_INCOME":        "Other Income",
		"SAVINGS":             "Savings",
		"INVESTMENT":          "Investment",
		"TRANSFER":            "Transfer",
	}
	if name, ok := names[code]; ok {
		return name
	}
	// Fallback: replace underscores with spaces and title case
	return strings.ReplaceAll(code, "_", " ")
}

// BuildTransactionConfirm builds confirmation message for a transaction
func BuildTransactionConfirm(info ConfirmInfo) string {
	typeIcon := "🔴"
	typeLabel := "Pengeluaran"
	if info.Type == model.TypeIncome {
		typeIcon = "💚"
		typeLabel = "Pemasukan"
	} else if info.Type == model.TypeTransfer {
		typeIcon = "🔄"
		typeLabel = "Transfer"
	}

	confIcon := "🟢"
	if info.Confidence == "medium" {
		confIcon = "🟡"
	} else if info.Confidence == "low" {
		confIcon = "🔴"
	}

	categoryName := CodeToDisplayName(info.CategoryCode)

	return fmt.Sprintf(
		"📋 *Transaksi Tercatat!*\n\n"+
			"%s *Jenis:* %s\n"+
			"💰 *Jumlah:* %s\n"+
			"📁 *Kategori:* %s\n"+
			"📝 *Catatan:* %s\n"+
			"%s _AI Confidence: %s_",
		typeIcon, typeLabel,
		FormatCurrency(info.Amount),
		categoryName,
		info.Note,
		confIcon, info.Confidence,
	)
}

// BuildSummaryMessage builds monthly summary message
func BuildSummaryMessage(userName string, month, year int, income, expense float64, categories []repository.CategorySummary, budgets []repository.BudgetVsActual) string {
	monthName := time.Month(month).String()
	net := income - expense
	netIcon := "💰"
	if net < 0 {
		netIcon = "⚠️"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📊 *Ringkasan %s %d*\n", monthName, year))
	sb.WriteString(fmt.Sprintf("👤 %s\n\n", userName))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━\n")
	sb.WriteString(fmt.Sprintf("💚 Pemasukan  : %s\n", FormatCurrency(income)))
	sb.WriteString(fmt.Sprintf("🔴 Pengeluaran: %s\n", FormatCurrency(expense)))
	sb.WriteString(fmt.Sprintf("%s Saldo Bersih : %s\n", netIcon, FormatCurrency(net)))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━\n\n")

	if len(categories) > 0 {
		sb.WriteString("📁 *Pengeluaran per Kategori:*\n")
		for _, c := range categories {
			sb.WriteString(fmt.Sprintf("• %s: %s (%d tx)\n", c.Category, FormatCurrency(c.Total), c.Count))
		}
		sb.WriteString("\n")
	}

	if len(budgets) > 0 {
		sb.WriteString("🎯 *Budget vs Aktual:*\n")
		for _, b := range budgets {
			pct := (b.Actual / b.Budget) * 100
			bar := progressBar(pct)
			icon := "✅"
			if pct >= 100 {
				icon = "🔴"
			} else if pct >= 80 {
				icon = "🟡"
			}
			sb.WriteString(fmt.Sprintf("%s %s\n   %s %.0f%%\n   %s / %s\n",
				icon, b.CategoryName, bar, pct, FormatCurrency(b.Actual), FormatCurrency(b.Budget)))
		}
	}

	return sb.String()
}

func progressBar(pct float64) string {
	filled := int(pct / 10)
	if filled > 10 {
		filled = 10
	}
	if filled < 0 {
		filled = 0
	}
	return strings.Repeat("█", filled) + strings.Repeat("░", 10-filled)
}

// BuildDailySummaryMessage builds daily summary
func BuildDailySummaryMessage(userName string, date time.Time, income, expense float64, categories []repository.CategorySummary) string {
	dateStr := date.Format("02 January 2006")
	net := income - expense
	netIcon := "💰"
	if net < 0 {
		netIcon = "⚠️"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📆 *Ringkasan %s*\n", dateStr))
	sb.WriteString(fmt.Sprintf("👤 %s\n\n", userName))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━\n")
	sb.WriteString(fmt.Sprintf("💚 Pemasukan  : %s\n", FormatCurrency(income)))
	sb.WriteString(fmt.Sprintf("🔴 Pengeluaran: %s\n", FormatCurrency(expense)))
	sb.WriteString(fmt.Sprintf("%s Saldo       : %s\n", netIcon, FormatCurrency(net)))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━\n\n")

	if len(categories) > 0 {
		sb.WriteString("📁 *Pengeluaran per Kategori:*\n")
		for _, c := range categories {
			sb.WriteString(fmt.Sprintf("• %s: %s\n", c.Category, FormatCurrency(c.Total)))
		}
	}

	return sb.String()
}

// BuildHistoryMessage builds transaction history message
func BuildHistoryMessage(txs []repository.TransactionWithCategory) string {
	var sb strings.Builder
	sb.WriteString("📋 *Riwayat Transaksi:*\n\n")

	for _, tx := range txs {
		icon := "🔴"
		if tx.Type == model.TypeIncome {
			icon = "💚"
		}
		dateStr := tx.Date.Format("02/01")
		note := tx.Note.String
		if note == "" {
			note = tx.CategoryName
		}
		if len(note) > 25 {
			note = note[:25] + "..."
		}
		sb.WriteString(fmt.Sprintf("%s %s • %s • %s\n", icon, FormatCurrency(tx.Amount), note, dateStr))
	}

	return sb.String()
}

// BuildGoalsMessage builds savings goals display
func BuildGoalsMessage(goals []repository.GoalWithProgress) string {
	if len(goals) == 0 {
		return "📭 *Belum ada savings goal.*\n\nTambahkan dengan:\n`/goal add <nama> <target>`"
	}

	var sb strings.Builder
	sb.WriteString("🏆 *Savings Goals:*\n\n")

	for _, g := range goals {
		pct := (g.SavedAmount / g.TargetAmount) * 100
		if pct > 100 {
			pct = 100
		}
		bar := progressBar(pct)
		status := "💪"
		if pct >= 100 {
			status = "✅"
		} else if pct >= 50 {
			status = "🔥"
		}
		sb.WriteString(fmt.Sprintf("%s *%s*\n   %s %.0f%%\n   %s / %s\n\n",
			status, g.Name, bar, pct, FormatCurrency(g.SavedAmount), FormatCurrency(g.TargetAmount)))
	}

	return sb.String()
}

// GetStreakMessage returns gamification message based on hourly tx count
func GetStreakMessage(count int) string {
	messages := map[int]string{
		2: "🎯 *Double Kill!* Dua transaksi dalam sejam — rajin banget! 💪",
		3: "⚡ *Triple Kill!* Tiga transaksi dalam sejam — lo serius nih! 🔥",
		4: "💥 *Ultra Kill!* Empat transaksi dalam sejam — gila produktif! 😤",
		5: "🏆 *RAMPAGE!!!* Lima transaksi dalam sejam — PENCATAT KEUANGAN SEJATI! 🎮🔥",
	}
	if msg, ok := messages[count]; ok {
		return msg
	}
	if count > 5 {
		return "🏆 *BEYOND GODLIKE!* Lebih dari 5 transaksi dalam sejam — lo sudah transcend! 🌌"
	}
	return ""
}

// GetBudgetAlertMessage builds budget alert message
func GetBudgetAlertMessage(category string, budget, actual float64) string {
	pct := (actual / budget) * 100
	if pct < 80 {
		return ""
	}

	remaining := budget - actual
	icon := "🟡"
	status := "Mendekati Batas Budget!"
	label := "Sisa"

	if pct > 100 {
		icon = "🔴"
		status = "Budget Terlampaui!"
		label = "Melebihi"
		remaining = -remaining
	}

	return fmt.Sprintf(
		"%s *%s*\n\n"+
			"Kategori  : *%s*\n"+
			"Budget    : %s\n"+
			"Terpakai  : %s (%.0f%%)\n"+
			"%s    : %s",
		icon, status, category,
		FormatCurrency(budget), FormatCurrency(actual), pct,
		label, FormatCurrency(remaining),
	)
}
