package bot

import (
	"context"
	"fmt"
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
		b.reply(msg.Chat.ID, "💡 Untuk transaksi multiple, gunakan command `/multi` atau kirim satu per satu.")
		return
	}

	// Try to parse as natural transaction
	amount, note, txType, _, _, ok := parser.ParseNaturalTransaction(text)
	if !ok {
		b.reply(msg.Chat.ID,
			"💬 Tidak mengerti maksudmu.\n\n"+
				"Untuk catat transaksi:\n"+
				"• *Pengeluaran:* `/add 15000 beli kopi`\n"+
				"• *Pemasukan:* `/income 200k gaji`\n\n"+
				"Ketik /help untuk panduan lengkap.")
		return
	}

	// Determine transaction type
	var modelTxType model.TransactionType
	switch txType {
	case parser.TxIncome:
		modelTxType = model.TypeIncome
	case parser.TxTransfer:
		modelTxType = model.TypeTransfer
	default:
		modelTxType = model.TypeExpense
	}

	// Store pending transaction
	state.PendingTx = &PendingTx{
		Amount: amount,
		Note:   note,
		Type:   modelTxType,
		Date:   time.Now(),
	}

	// Show category selection keyboard
	var keyboard tgbotapi.InlineKeyboardMarkup
	var typeLabel string

	if modelTxType == model.TypeIncome {
		keyboard = incomeCategoryKeyboard()
		typeLabel = "pemasukan"
	} else {
		keyboard = expenseCategoryKeyboard("cat")
		typeLabel = "pengeluaran"
	}

	text = fmt.Sprintf(
		"📝 *Pilih kategori %s:*\n\n"+
			"💰 Nominal: *%s*\n"+
			"📝 Catatan: _%s_",
		typeLabel, service.FormatCurrencyV2(amount), note)

	b.replyWithKeyboard(ctx, msg.Chat.ID, text, keyboard)
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
	b.replyWithKeyboard(ctx, msg.Chat.ID, confMsg, photoConfirmKeyboard())
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
