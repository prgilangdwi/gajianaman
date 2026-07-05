package bot

import (
	"context"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/parser"
	"github.com/prgilangdwi/gajianaman/internal/service"
	"github.com/prgilangdwi/gajianaman/pkg/logger"
)

func (b *Bot) handleMessage(ctx context.Context, msg *tgbotapi.Message) {
	text := msg.Text
	user, err := b.getUser(ctx, msg.From.ID)
	if err != nil {
		logger.Error(ctx, "failed to get user in message handler", "err", err, "telegram_id", msg.From.ID)
	}
	if err != nil || user == nil {
		b.reply(msg.Chat.ID, "👋 Halo! Ketik /start untuk mendaftar dan mulai menggunakan Gajian Aman.")
		return
	}

	state := b.getUserState(msg.From.ID)

	// Handle awaiting states
	switch state.Awaiting {
	case "photo_edit_amount":
		b.handlePhotoEditAmount(ctx, msg, user, state)
		return
	}

	// Check for multi-transaction
	if parser.IsMultiTransaction(text) {
		// For simplicity, we'll handle single transactions for now
		// Multi-transaction can be added later
		b.reply(msg.Chat.ID, "💡 Untuk transaksi multiple, gunakan command `/multi` atau kirim satu per satu.")
		return
	}

	// Try to parse as natural transaction
	amount, note, txType, _, _, ok := parser.ParseNaturalTransaction(text)
	if !ok {
		b.reply(msg.Chat.ID,
			"💬 Tidak mengerti maksudmu.\n\n"+
				"Untuk catat transaksi:\n"+
				"• *Pengeluaran:* `beli kopi 15000` atau `/add 15000 beli kopi`\n"+
				"• *Pemasukan:* `uang masuk 200k` atau `/income 200k gaji`\n\n"+
				"Ketik /help untuk panduan lengkap.")
		return
	}

	b.api.Send(tgbotapi.NewChatAction(msg.Chat.ID, "typing"))

	// Categorize with AI
	result, err := b.categorizer.Categorize(ctx, note)
	if err != nil {
		logger.Warn(ctx, "categorization failed in message handler", "err", err, "note", note)
		result = &service.CategorizationResult{
			CategoryCode: "OTHER",
			Type:         string(txType),
			Confidence:   0.3,
		}
	}

	// Override type based on detection
	var modelTxType model.TransactionType
	switch txType {
	case parser.TxIncome:
		modelTxType = model.TypeIncome
		result.Type = "income"
	case parser.TxTransfer:
		modelTxType = model.TypeTransfer
		result.Type = "transfer"
	default:
		modelTxType = model.TypeExpense
		result.Type = "expense"
	}

	// Create transaction
	tx, err := b.createTransaction(ctx, user, amount, modelTxType, result.CategoryCode, note, time.Now(), result.Confidence)
	if err != nil {
		logger.Error(ctx, "failed to create transaction from message", "err", err, "user_id", user.ID, "amount", amount)
		b.reply(msg.Chat.ID, "⚠️ Gagal menyimpan transaksi: "+err.Error())
		return
	}

	state.LastTxID = tx.ID

	// Build confirmation
	confMsg := service.BuildTransactionConfirm(service.ConfirmInfo{
		Amount:       amount,
		Note:         note,
		CategoryCode: result.CategoryCode,
		Type:         modelTxType,
		Confidence:   service.ConfidenceLevel(result.Confidence),
	})

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🗑️ Hapus Transaksi Ini", "delete:last"),
		),
	)

	if result.Confidence < 0.5 {
		confMsg += "\n\n⚠️ _Confidence rendah. Pilih kategori yang tepat:_"
		keyboard = recatKeyboard()
	}

	b.replyWithKeyboard(msg.Chat.ID, confMsg, keyboard)

	// Check budget alert for expenses
	if modelTxType == model.TypeExpense {
		categoryID, _ := b.resolveCategoryID(ctx, user.ID, result.CategoryCode, model.TypeExpense)
		b.checkBudgetAlert(ctx, msg, user, categoryID)
	}

	// Send streak message
	b.sendStreakMessage(ctx, msg, user.ID)
}

func (b *Bot) handlePhotoEditAmount(ctx context.Context, msg *tgbotapi.Message, user *model.User, state *UserState) {
	amount, ok := parser.ParseAmountV2(msg.Text)
	if !ok {
		b.reply(msg.Chat.ID, "❌ Format tidak dikenali.\n\nContoh: `25000` · `25k` · `1.5jt`")
		return
	}

	state.Awaiting = ""
	if state.PendingPhotoTx == nil {
		b.reply(msg.Chat.ID, "⚠️ Tidak ada foto yang pending. Kirim foto kembali.")
		return
	}

	state.PendingPhotoTx.Amount = amount

	confMsg := buildPhotoConfirmText(state.PendingPhotoTx)
	b.replyWithKeyboard(msg.Chat.ID, confMsg, photoConfirmKeyboard())
}

func buildPhotoConfirmText(p *PendingPhotoTx) string {
	typeLabel := "Pengeluaran"
	if p.Type == model.TypeIncome {
		typeLabel = "Pemasukan"
	}

	confIcon := "🟢"
	confLevel := "high"
	if p.Confidence < 0.5 {
		confIcon = "🔴"
		confLevel = "low"
	} else if p.Confidence < 0.8 {
		confIcon = "🟡"
		confLevel = "medium"
	}

	categoryName := service.CodeToDisplayName(p.CategoryCode)

	return "📸 *Hasil Analisis Foto*\n\n" +
		"💰 Jumlah: *" + service.FormatCurrencyV2(p.Amount) + "*\n" +
		"📂 Kategori: *" + categoryName + "*\n" +
		"📝 Catatan: *" + p.Note + "*\n" +
		"📅 Tipe: *" + typeLabel + "*\n" +
		confIcon + " Confidence: _" + confLevel + "_\n\n" +
		"_Konfirmasi transaksi ini?_"
}
