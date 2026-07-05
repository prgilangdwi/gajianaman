package bot

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/google/uuid"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/service"
	"github.com/prgilangdwi/gajianaman/pkg/logger"
)

func (b *Bot) handleCallback(ctx context.Context, query *tgbotapi.CallbackQuery) {
	b.answerCallback(query.ID)
	data := query.Data
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID
	user, _ := b.getUser(ctx, query.From.ID)

	switch {
	case data == "menu:main":
		b.callbackMainMenu(ctx, query, user)

	case data == "menu:commands":
		b.editMessage(chatID, msgID, commandsText(), &[]tgbotapi.InlineKeyboardMarkup{backToMainKeyboard()}[0])

	case data == "menu:dashboard":
		b.editMessage(chatID, msgID, dashboardText(), &[]tgbotapi.InlineKeyboardMarkup{backToMainKeyboard()}[0])

	case data == "menu:helpdesk":
		b.editMessage(chatID, msgID, helpdeskText(), &[]tgbotapi.InlineKeyboardMarkup{backToMainKeyboard()}[0])

	case data == "summary:picker":
		b.callbackSummaryPicker(ctx, chatID, msgID)

	case strings.HasPrefix(data, "summary:monthly:"):
		b.callbackSummaryMonthly(ctx, query, user, data)

	case data == "summary:daily:today":
		b.callbackSummaryDaily(ctx, query, user, time.Now())

	case data == "summary:daily:yesterday":
		b.callbackSummaryDaily(ctx, query, user, time.Now().AddDate(0, 0, -1))

	case data == "history:picker":
		b.callbackHistoryPicker(ctx, chatID, msgID)

	case strings.HasPrefix(data, "history:month:"):
		b.callbackHistoryMonth(ctx, query, user, data)

	case data == "quick:goals":
		b.callbackQuickGoals(ctx, query, user)

	case data == "quick:budget":
		kb := quickBudgetCategoryKeyboard()
		b.editMessage(chatID, msgID, "🎯 *Quick Budget Setup*\n\nPilih kategori:", &kb)

	case strings.HasPrefix(data, "qb_cat:"):
		b.callbackQuickBudgetCategory(ctx, query, data)

	case strings.HasPrefix(data, "qb_amt:"):
		b.callbackQuickBudgetAmount(ctx, query, user, data)

	case data == "qb_back":
		kb := quickBudgetCategoryKeyboard()
		b.editMessage(chatID, msgID, "🎯 *Quick Budget Setup*\n\nPilih kategori:", &kb)

	case data == "qb_done":
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "✅ *Budget Setup Selesai!*\n\nBudget kamu sudah aktif.", &kb)

	case strings.HasPrefix(data, "recat:"):
		b.callbackRecat(ctx, query, user, data)

	case data == "delete:last":
		b.callbackDeleteLast(ctx, query, user)

	case strings.HasPrefix(data, "confirm_delete:"):
		b.callbackConfirmDelete(ctx, query, user, data)

	case data == "cancel_delete":
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "❌ Penghapusan dibatalkan.", &kb)

	case strings.HasPrefix(data, "hapus:list"):
		b.callbackDeleteList(ctx, query, user)

	case strings.HasPrefix(data, "hapus:tx:"):
		b.callbackDeleteTx(ctx, query, user, data)

	case strings.HasPrefix(data, "hapus:confirm:"):
		b.callbackDeleteConfirm(ctx, query, user, data)

	case strings.HasPrefix(data, "help:"):
		b.callbackHelp(ctx, query, data)

	case strings.HasPrefix(data, "quick:add"):
		b.editMessage(chatID, msgID, quickAddGuide(), &[]tgbotapi.InlineKeyboardMarkup{backToMainKeyboard()}[0])

	case strings.HasPrefix(data, "quick:income"):
		b.editMessage(chatID, msgID, quickIncomeGuide(), &[]tgbotapi.InlineKeyboardMarkup{backToMainKeyboard()}[0])

	case strings.HasPrefix(data, "photo:"):
		b.callbackPhoto(ctx, query, user, data)
	}
}

func (b *Bot) callbackMainMenu(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	var expense, income float64
	var txCount int
	if user != nil {
		stats, _ := b.txRepo.GetTodayStats(ctx, user.ID)
		if stats != nil {
			expense = stats.Expense
			income = stats.Income
			txCount = stats.TxCount
		}
	}

	text := fmt.Sprintf(
		"👋 *Halo, %s!*\n\n"+
			"📅 *%s*\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"🔴 Pengeluaran : %s\n"+
			"💚 Pemasukan   : %s\n"+
			"📝 Transaksi   : %d hari ini\n"+
			"━━━━━━━━━━━━━━━━━━━━\n\n"+
			"Mau ngapain hari ini? 👇",
		query.From.FirstName,
		time.Now().Format("02 January 2006"),
		service.FormatCurrencyV2(expense),
		service.FormatCurrencyV2(income),
		txCount,
	)

	kb := mainMenuKeyboard()
	b.editMessage(chatID, msgID, text, &kb)
}

func (b *Bot) callbackSummaryPicker(ctx context.Context, chatID int64, msgID int) {
	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0)

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("📅 Bulan Ini (%s)", now.Month().String()[:3]),
				fmt.Sprintf("summary:monthly:%d:%d", now.Month(), now.Year()),
			),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("📅 Bulan Lalu (%s)", lastMonth.Month().String()[:3]),
				fmt.Sprintf("summary:monthly:%d:%d", lastMonth.Month(), lastMonth.Year()),
			),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📆 Hari Ini", "summary:daily:today"),
			tgbotapi.NewInlineKeyboardButtonData("📆 Kemarin", "summary:daily:yesterday"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.editMessage(chatID, msgID, "📊 *Summary — Pilih Periode*", &keyboard)
}

func (b *Bot) callbackSummaryMonthly(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	parts := strings.Split(data, ":")
	if len(parts) < 4 {
		return
	}
	month, _ := strconv.Atoi(parts[2])
	year, _ := strconv.Atoi(parts[3])

	if user == nil {
		b.editMessage(chatID, msgID, "⚠️ User tidak ditemukan.", nil)
		return
	}

	categories, _ := b.txRepo.GetMonthlySummary(ctx, user.ID, month, year)
	income, _ := b.txRepo.GetMonthlyIncome(ctx, user.ID, month, year)
	budgets, _ := b.budgetRepo.GetBudgetVsActual(ctx, user.ID, month, year)

	var expense float64
	for _, c := range categories {
		expense += c.Total
	}

	text := service.BuildSummaryMessage(query.From.FirstName, month, year, income, expense, categories, budgets)
	kb := backToMainKeyboard()
	b.editMessage(chatID, msgID, text, &kb)
}

func (b *Bot) callbackSummaryDaily(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, date time.Time) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	if user == nil {
		return
	}

	categories, _ := b.txRepo.GetDailySummary(ctx, user.ID, date)
	income, _ := b.txRepo.GetDailyIncome(ctx, user.ID, date)

	var expense float64
	for _, c := range categories {
		expense += c.Total
	}

	text := service.BuildDailySummaryMessage(query.From.FirstName, date, income, expense, categories)
	kb := backToMainKeyboard()
	b.editMessage(chatID, msgID, text, &kb)
}

func (b *Bot) callbackHistoryPicker(ctx context.Context, chatID int64, msgID int) {
	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0)

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("📅 %s %d", now.Month().String(), now.Year()),
				fmt.Sprintf("history:month:%d:%d", now.Month(), now.Year()),
			),
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("📅 %s %d", lastMonth.Month().String(), lastMonth.Year()),
				fmt.Sprintf("history:month:%d:%d", lastMonth.Month(), lastMonth.Year()),
			),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.editMessage(chatID, msgID, "📋 *Riwayat Transaksi — Pilih Periode*", &keyboard)
}

func (b *Bot) callbackHistoryMonth(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	parts := strings.Split(data, ":")
	if len(parts) < 4 {
		return
	}
	month, _ := strconv.Atoi(parts[2])
	year, _ := strconv.Atoi(parts[3])

	if user == nil {
		return
	}

	txs, _ := b.txRepo.ListByMonth(ctx, user.ID, month, year, 20)
	if len(txs) == 0 {
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "📭 Tidak ada transaksi di periode ini.", &kb)
		return
	}

	text := service.BuildHistoryMessage(txs)
	kb := backToMainKeyboard()
	b.editMessage(chatID, msgID, text, &kb)
}

func (b *Bot) callbackQuickGoals(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	if user == nil {
		return
	}

	goals, _ := b.goalRepo.ListWithProgress(ctx, user.ID)
	text := service.BuildGoalsMessage(goals)
	kb := backToMainKeyboard()
	b.editMessage(chatID, msgID, text, &kb)
}

func (b *Bot) callbackQuickBudgetCategory(ctx context.Context, query *tgbotapi.CallbackQuery, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	catKey := strings.TrimPrefix(data, "qb_cat:")
	catNames := map[string]string{
		"food":          "🍜 Makanan",
		"transport":     "🚗 Transport",
		"shopping":      "🛍️ Shopping",
		"health":        "💊 Kesehatan",
		"entertainment": "🎮 Hiburan",
		"bills":         "📱 Tagihan",
		"education":     "📚 Pendidikan",
		"groceries":     "🛒 Groceries",
	}

	label := catNames[catKey]
	if label == "" {
		label = catKey
	}

	// Build amount buttons
	amounts := []struct {
		label string
		value int
	}{
		{"Rp 500k", 500000},
		{"Rp 750k", 750000},
		{"Rp 1jt", 1000000},
		{"Rp 1.5jt", 1500000},
		{"Rp 2jt", 2000000},
		{"Rp 3jt", 3000000},
	}

	var rows [][]tgbotapi.InlineKeyboardButton
	for i := 0; i < len(amounts); i += 2 {
		row := tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(amounts[i].label,
				fmt.Sprintf("qb_amt:%s:%d", catKey, amounts[i].value)),
		)
		if i+1 < len(amounts) {
			row = append(row, tgbotapi.NewInlineKeyboardButtonData(amounts[i+1].label,
				fmt.Sprintf("qb_amt:%s:%d", catKey, amounts[i+1].value)))
		}
		rows = append(rows, row)
	}
	rows = append(rows, tgbotapi.NewInlineKeyboardRow(
		tgbotapi.NewInlineKeyboardButtonData("← Pilih Kategori Lain", "qb_back"),
	))
	rows = append(rows, tgbotapi.NewInlineKeyboardRow(
		tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
	))

	kb := tgbotapi.InlineKeyboardMarkup{InlineKeyboard: rows}
	b.editMessage(chatID, msgID, fmt.Sprintf("🎯 *Quick Budget — %s*\n\nPilih nominal:", label), &kb)
}

func (b *Bot) callbackQuickBudgetAmount(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	parts := strings.Split(data, ":")
	if len(parts) < 3 || user == nil {
		return
	}

	catKey := parts[1]
	amount, _ := strconv.ParseFloat(parts[2], 64)

	catNames := map[string]string{
		"food":          "FOOD_AND_DINING",
		"transport":     "TRANSPORT",
		"shopping":      "SHOPPING",
		"health":        "HEALTH",
		"entertainment": "ENTERTAINMENT",
		"bills":         "BILLS_AND_UTILITIES",
		"education":     "EDUCATION",
		"groceries":     "GROCERIES",
	}

	categoryCode := catNames[catKey]
	if categoryCode == "" {
		categoryCode = strings.ToUpper(strings.ReplaceAll(catKey, " ", "_"))
	}

	categoryID, err := b.resolveCategoryID(ctx, user.ID, categoryCode, model.TypeExpense)
	if err != nil {
		logger.Warn(ctx, "category not found in quick budget", "err", err, "category", categoryCode)
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Kategori tidak ditemukan.", &kb)
		return
	}

	now := time.Now()
	err = b.budgetRepo.Upsert(ctx, user.ID, categoryID, amount, int16(now.Month()), int16(now.Year()))
	if err != nil {
		logger.Error(ctx, "failed to upsert budget", "err", err, "user_id", user.ID, "category", categoryCode)
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Gagal menyimpan budget.", &kb)
		return
	}

	kb := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("➕ Set Kategori Lain", "qb_back"),
			tgbotapi.NewInlineKeyboardButtonData("✅ Selesai", "qb_done"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.editMessage(chatID, msgID, fmt.Sprintf(
		"✅ *Budget Berhasil Diset!*\n\n"+
			"📁 Kategori : *%s*\n"+
			"🎯 Budget   : %s\n"+
			"📅 Periode  : %s %d",
		service.CodeToDisplayName(categoryCode), service.FormatCurrencyV2(amount), now.Month().String(), now.Year(),
	), &kb)
}

func (b *Bot) callbackRecat(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	categoryCode := strings.TrimPrefix(data, "recat:")
	state := b.getUserState(query.From.ID)

	if state.LastTxID == uuid.Nil {
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Tidak ada transaksi yang bisa diubah.", &kb)
		return
	}

	if user == nil {
		return
	}

	tx, _ := b.txRepo.GetByID(ctx, state.LastTxID)
	if tx == nil {
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Transaksi tidak ditemukan.", &kb)
		return
	}

	categoryID, err := b.resolveCategoryID(ctx, user.ID, categoryCode, tx.Type)
	if err != nil {
		logger.Warn(ctx, "category not found for recategorization", "err", err, "category", categoryCode)
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Kategori tidak ditemukan.", &kb)
		return
	}

	if err := b.txRepo.UpdateCategory(ctx, tx.ID, categoryID); err != nil {
		logger.Error(ctx, "failed to update transaction category", "err", err, "tx_id", tx.ID)
	}

	kb := backToMainKeyboard()
	b.editMessage(chatID, msgID, fmt.Sprintf("✅ *Kategori diperbarui!*\n\nKategori baru: *%s*", service.CodeToDisplayName(categoryCode)), &kb)
}

func (b *Bot) callbackDeleteLast(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	state := b.getUserState(query.From.ID)
	if state.LastTxID == uuid.Nil {
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Tidak ada transaksi tersimpan di sesi ini.", &kb)
		return
	}

	kb := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ Ya, Hapus", fmt.Sprintf("confirm_delete:%s", state.LastTxID.String())),
			tgbotapi.NewInlineKeyboardButtonData("❌ Batal", "cancel_delete"),
		),
	)
	b.editMessage(chatID, msgID, "🗑️ *Hapus transaksi ini?*\n\n_Tindakan ini tidak bisa dibatalkan._", &kb)
}

func (b *Bot) callbackConfirmDelete(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	txIDStr := strings.TrimPrefix(data, "confirm_delete:")
	txID, err := uuid.Parse(txIDStr)
	if err != nil || user == nil {
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Transaksi tidak valid.", &kb)
		return
	}

	b.txRepo.Delete(ctx, txID, user.ID)

	state := b.getUserState(query.From.ID)
	state.LastTxID = uuid.Nil

	kb := backToMainKeyboard()
	b.editMessage(chatID, msgID, "🗑️ *Transaksi berhasil dihapus.*", &kb)
}

func (b *Bot) callbackDeleteList(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	if user == nil {
		return
	}

	txs, _ := b.txRepo.ListRecent(ctx, user.ID, 10)
	if len(txs) == 0 {
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "📭 *Tidak ada transaksi yang bisa dihapus.*", &kb)
		return
	}

	var lines []string
	lines = append(lines, "🗑️ *Pilih Transaksi yang Ingin Dihapus:*\n")

	var buttons [][]tgbotapi.InlineKeyboardButton
	var row []tgbotapi.InlineKeyboardButton

	for i, tx := range txs {
		icon := "🔴"
		if tx.Type == model.TypeIncome {
			icon = "💚"
		}
		note := tx.Note.String
		if note == "" {
			note = tx.CategoryName
		}
		if len(note) > 20 {
			note = note[:20]
		}
		dateStr := tx.Date.Format("02/01")
		lines = append(lines, fmt.Sprintf("*%d.* %s %s • %s • %s", i+1, icon, service.FormatCurrencyV2(tx.Amount), note, dateStr))

		row = append(row, tgbotapi.NewInlineKeyboardButtonData(
			fmt.Sprintf("%d", i+1),
			fmt.Sprintf("hapus:tx:%s", tx.ID.String()),
		))
		if len(row) == 5 {
			buttons = append(buttons, row)
			row = nil
		}
	}
	if len(row) > 0 {
		buttons = append(buttons, row)
	}
	buttons = append(buttons, tgbotapi.NewInlineKeyboardRow(
		tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
	))

	kb := tgbotapi.InlineKeyboardMarkup{InlineKeyboard: buttons}
	b.editMessage(chatID, msgID, strings.Join(lines, "\n"), &kb)
}

func (b *Bot) callbackDeleteTx(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	txIDStr := strings.TrimPrefix(data, "hapus:tx:")
	txID, err := uuid.Parse(txIDStr)
	if err != nil || user == nil {
		return
	}

	tx, _ := b.txRepo.GetByID(ctx, txID)
	if tx == nil {
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "⚠️ Transaksi tidak ditemukan.", &kb)
		return
	}

	cat, _ := b.categoryRepo.GetByID(ctx, tx.CategoryID)
	catName := "Unknown"
	if cat != nil {
		catName = cat.Name
	}

	typeIcon := "🔴"
	typeLabel := "Pengeluaran"
	if tx.Type == model.TypeIncome {
		typeIcon = "💚"
		typeLabel = "Pemasukan"
	}

	kb := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ Ya, Hapus", fmt.Sprintf("hapus:confirm:%s", tx.ID.String())),
			tgbotapi.NewInlineKeyboardButtonData("❌ Batal", "hapus:list"),
		),
	)

	b.editMessage(chatID, msgID, fmt.Sprintf(
		"🗑️ *Hapus Transaksi?*\n\n"+
			"%s Jenis     : %s\n"+
			"💸 Nominal  : %s\n"+
			"📁 Kategori : %s\n"+
			"📝 Catatan  : %s\n\n"+
			"_Tindakan ini tidak bisa dibatalkan._",
		typeIcon, typeLabel, service.FormatCurrencyV2(tx.Amount), catName, tx.Note.String,
	), &kb)
}

func (b *Bot) callbackDeleteConfirm(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	txIDStr := strings.TrimPrefix(data, "hapus:confirm:")
	txID, err := uuid.Parse(txIDStr)
	if err != nil || user == nil {
		return
	}

	if err := b.txRepo.Delete(ctx, txID, user.ID); err != nil {
		logger.Error(ctx, "failed to delete transaction", "err", err, "tx_id", txID, "user_id", user.ID)
	} else {
		logger.Info(ctx, "transaction deleted", "tx_id", txID, "user_id", user.ID)
	}

	kb := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🗑️ Hapus Lagi", "hapus:list"),
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.editMessage(chatID, msgID, "✅ *Transaksi berhasil dihapus!*", &kb)
}

func (b *Bot) callbackHelp(ctx context.Context, query *tgbotapi.CallbackQuery, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID

	page := strings.TrimPrefix(data, "help:")
	var text string
	switch page {
	case "transactions":
		text = helpTransactionsText()
	case "budget":
		text = helpBudgetText()
	case "tips":
		text = helpTipsText()
	default:
		text = helpMainText()
	}

	kb := backToMainKeyboard()
	b.editMessage(chatID, msgID, text, &kb)
}

func (b *Bot) callbackPhoto(ctx context.Context, query *tgbotapi.CallbackQuery, user *model.User, data string) {
	chatID := query.Message.Chat.ID
	msgID := query.Message.MessageID
	state := b.getUserState(query.From.ID)

	action := strings.TrimPrefix(data, "photo:")

	switch action {
	case "save":
		if state.PendingPhotoTx == nil || user == nil {
			kb := backToMainKeyboard()
			b.editMessage(chatID, msgID, "⚠️ Data foto sudah kedaluwarsa. Kirim foto kembali.", &kb)
			return
		}

		pending := state.PendingPhotoTx
		_, err := b.createTransaction(ctx, user, pending.Amount, pending.Type, pending.CategoryCode, pending.Note, time.Now(), pending.Confidence)
		if err != nil {
			logger.Error(ctx, "failed to save photo transaction", "err", err, "user_id", user.ID, "amount", pending.Amount)
			kb := backToMainKeyboard()
			b.editMessage(chatID, msgID, "⚠️ Gagal menyimpan: "+err.Error(), &kb)
			return
		}

		state.PendingPhotoTx = nil
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, fmt.Sprintf(
			"✅ *Transaksi berhasil disimpan!*\n\n💰 %s — %s",
			service.FormatCurrencyV2(pending.Amount), pending.Note,
		), &kb)

	case "cancel":
		state.PendingPhotoTx = nil
		kb := backToMainKeyboard()
		b.editMessage(chatID, msgID, "❌ Dibatalkan. Kirim foto lain kapan saja.", &kb)

	case "edit_amount":
		state.Awaiting = "photo_edit_amount"
		b.editMessage(chatID, msgID, "✏️ *Edit Jumlah*\n\nKetik jumlah yang benar:\n_(contoh: `25000` atau `25k` atau `1.5jt`)_", nil)
	}
}

// Text helpers
func commandsText() string {
	return "📜 *Daftar Semua Command — Gajian Aman*\n\n" +
		"━━━━━━━━━━━━━━━━━━━━\n" +
		"💸 *Transaksi*\n" +
		"➕ `/add <nominal> <ket>` — Catat pengeluaran\n" +
		"💚 `/income <nominal> <ket>` — Catat pemasukan\n" +
		"🗑️ `/delete` — Hapus transaksi terakhir\n\n" +
		"📊 *Laporan*\n" +
		"📊 `/summary` — Ringkasan bulanan / harian\n" +
		"📋 `/history` — 20 transaksi terbaru\n" +
		"📈 `/stats` — Statistik hari ini\n\n" +
		"🎯 *Budget & Goals*\n" +
		"💰 `/budget <kat> <nominal>` — Set budget\n" +
		"🏆 `/goal` — Lihat savings goals\n" +
		"🏆 `/goal add <nama> <target>` — Tambah goal"
}

func dashboardText() string {
	return "🌐 *Live Dashboard — Gajian Aman*\n\n" +
		"Pantau keuanganmu di dashboard web!\n\n" +
		"🔗 *Link Dashboard:*\nhttps://gajianaman.xyz\n\n" +
		"🔐 *Cara Login:*\n" +
		"1. Buka link dashboard di atas\n" +
		"2. Masukkan *Telegram ID* kamu di sidebar"
}

func helpdeskText() string {
	return "💬 *Helpdesk — Gajian Aman*\n\n" +
		"Butuh bantuan?\n\n" +
		"📩 *Hubungi admin langsung:*\n@gilangdwipr"
}

func quickAddGuide() string {
	return "➕ *Catat Pengeluaran*\n\n" +
		"🤖 *Cara termudah — ketik natural language:*\n" +
		"• `beli kopi 15000`\n" +
		"• `makan siang 75k`\n" +
		"• `bayar listrik 1.5jt`\n\n" +
		"━━━━━━━━━━━━━━━━━━━━\n" +
		"⌨️ *Atau gunakan command:*\n" +
		"`/add <nominal> <keterangan>`\n\n" +
		"Contoh: `/add 15000 beli kopi`"
}

func quickIncomeGuide() string {
	return "💚 *Catat Pemasukan*\n\n" +
		"🤖 *Cara termudah — ketik natural language:*\n" +
		"• `gaji april 5jt`\n" +
		"• `freelance desain 500k`\n\n" +
		"━━━━━━━━━━━━━━━━━━━━\n" +
		"⌨️ *Atau gunakan command:*\n" +
		"`/income <nominal> <keterangan>`"
}

func helpMainText() string {
	return "📖 *Gajian Aman — Pusat Bantuan*\n\n" +
		"Halo! Saya Gajian Aman, asisten keuangan pribadimu 🤖"
}

func helpTransactionsText() string {
	return "📝 *Mencatat Transaksi*\n\n" +
		"🤖 *Cara termudah — Natural Language AI:*\n" +
		"Langsung ketik: `beli kopi 15k`\n\n" +
		"━━━━━━━━━━━━━━━━━━━━\n" +
		"⌨️ *Atau pakai command:*\n" +
		"`/add <nominal> <ket>` — Pengeluaran\n" +
		"`/income <nominal> <ket>` — Pemasukan\n\n" +
		"*Format Nominal:*\n" +
		"`15k` `15rb` `15ribu` → Rp 15.000\n" +
		"`1.5jt` `1juta` → Rp 1.500.000"
}

func helpBudgetText() string {
	return "💰 *Budget & Savings Goals*\n\n" +
		"*Set Budget:*\n" +
		"`/budget food 1jt`\n\n" +
		"*Savings Goals:*\n" +
		"`/goal` — Lihat goals\n" +
		"`/goal add Liburan 5jt` — Tambah goal"
}

func helpTipsText() string {
	return "💡 *Tips & Trik*\n\n" +
		"1️⃣ Catat langsung setelah transaksi\n" +
		"2️⃣ Gunakan mode natural: `kopi 15k`\n" +
		"3️⃣ Set budget di awal bulan\n" +
		"4️⃣ Cek /summary setiap minggu\n" +
		"5️⃣ Tambah savings goal"
}
