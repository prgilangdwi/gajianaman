package bot

import (
	"context"
	"fmt"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/parser"
	"github.com/prgilangdwi/gajianaman/internal/service"
)

func (b *Bot) cmdStart(ctx context.Context, msg *tgbotapi.Message) {
	user, err := b.ensureUser(ctx, msg.From)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal mendaftarkan user. Coba lagi.")
		return
	}

	// Check if returning user
	stats, _ := b.txRepo.GetTodayStats(ctx, user.ID)

	if stats != nil && stats.TxCount > 0 {
		text := fmt.Sprintf(
			"👋 *Halo kembali, %s!*\n\n"+
				"📅 *%s*\n"+
				"━━━━━━━━━━━━━━━━━━━━\n"+
				"🔴 Pengeluaran : %s\n"+
				"💚 Pemasukan   : %s\n"+
				"📝 Transaksi   : %d hari ini\n"+
				"━━━━━━━━━━━━━━━━━━━━\n\n"+
				"Mau ngapain hari ini? 👇",
			msg.From.FirstName,
			time.Now().Format("02 January 2006"),
			service.FormatCurrency(stats.Expense),
			service.FormatCurrency(stats.Income),
			stats.TxCount,
		)
		b.replyWithKeyboard(msg.Chat.ID, text, mainMenuKeyboard())
	} else {
		text := fmt.Sprintf(
			"🎉 *Selamat datang di Gajian Aman, %s!*\n\n"+
				"Saya adalah asisten keuangan pribadi yang didukung *AI Claude* 🤖\n\n"+
				"✅ Catat pengeluaran & pemasukan\n"+
				"🧠 AI otomatis kategorikan transaksi\n"+
				"🎯 Set & monitor budget per kategori\n"+
				"🏆 Track savings goals kamu\n"+
				"📊 Laporan keuangan bulanan\n\n"+
				"Kamu sudah terdaftar! Yuk mulai 👇",
			msg.From.FirstName,
		)
		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("📖 Cara Pakai", "help:main"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("➕ Catat Pengeluaran", "quick:add"),
				tgbotapi.NewInlineKeyboardButtonData("💚 Catat Pemasukan", "quick:income"),
			),
		)
		b.replyWithKeyboard(msg.Chat.ID, text, keyboard)
	}
}

func (b *Bot) cmdAdd(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	amount, note, ok := parseCommandArgs(msg.Text)
	if !ok {
		b.reply(msg.Chat.ID,
			"💡 *Tahukah kamu?* Kamu tidak perlu pakai command!\n"+
				"Cukup ketik langsung, AI yang urusin sisanya:\n"+
				"`beli jajan 7500` atau `makan siang 50rb`\n\n"+
				"━━━━━━━━━━━━━━━━━━━━\n"+
				"❌ *Format command salah.*\n\n"+
				"Gunakan: `/add <nominal> <keterangan>`\n"+
				"Contoh: `/add 7500 beli jajan di warung`\n\n"+
				"*Format nominal:*\n"+
				"• `15000` → Rp 15.000\n"+
				"• `15k` · `15rb` · `15ribu` → Rp 15.000\n"+
				"• `1.5jt` · `1juta` · `1jt` → Rp 1.500.000")
		return
	}

	// Parse backdate
	cleanNote, txDate, hasDate := parser.ParseBackdate(note)
	if !hasDate {
		txDate = time.Now()
	}
	note = cleanNote

	// Show typing indicator
	b.api.Send(tgbotapi.NewChatAction(msg.Chat.ID, "typing"))

	// Categorize with AI
	result, err := b.categorizer.Categorize(ctx, note)
	if err != nil {
		result = &service.CategorizationResult{
			CategoryCode: "OTHER",
			Type:         "expense",
			Confidence:   0.3,
		}
	}

	// Create transaction
	tx, err := b.createTransaction(ctx, user, amount, model.TypeExpense, result.CategoryCode, note, txDate, result.Confidence)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal menyimpan transaksi: "+err.Error())
		return
	}

	// Store for potential undo
	state := b.getUserState(msg.From.ID)
	state.LastTxID = tx.ID

	// Build confirmation message
	confMsg := service.BuildTransactionConfirm(service.ConfirmInfo{
		Amount:       amount,
		Note:         note,
		CategoryCode: result.CategoryCode,
		Type:         model.TypeExpense,
		Confidence:   service.ConfidenceLevel(result.Confidence),
	})

	if hasDate && !txDate.Equal(time.Now().Truncate(24*time.Hour)) {
		confMsg += fmt.Sprintf("\n📅 _Dicatat untuk tanggal: %s_", txDate.Format("02 January 2006"))
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🗑️ Hapus Transaksi Ini", "delete:last"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	if result.Confidence < 0.5 {
		confMsg += "\n\n⚠️ _Confidence rendah. Pilih kategori yang tepat:_"
		keyboard = recatKeyboard()
	}

	b.replyWithKeyboard(msg.Chat.ID, confMsg, keyboard)

	// Check budget alert
	categoryID, _ := b.resolveCategoryID(ctx, user.ID, result.CategoryCode, model.TypeExpense)
	b.checkBudgetAlert(ctx, msg, user, categoryID)

	// Send streak message
	b.sendStreakMessage(ctx, msg, user.ID)
}

func (b *Bot) cmdIncome(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	amount, note, ok := parseCommandArgs(msg.Text)
	if !ok {
		b.reply(msg.Chat.ID,
			"💡 *Tahukah kamu?* Kamu tidak perlu pakai command!\n"+
				"Cukup ketik langsung, AI yang urusin sisanya:\n"+
				"`gaji april 5jt` atau `freelance desain 500k`\n\n"+
				"━━━━━━━━━━━━━━━━━━━━\n"+
				"❌ *Format command salah.*\n\n"+
				"Gunakan: `/income <nominal> <keterangan>`\n"+
				"Contoh: `/income 5jt gaji bulan ini`")
		return
	}

	b.api.Send(tgbotapi.NewChatAction(msg.Chat.ID, "typing"))

	result, _ := b.categorizer.Categorize(ctx, note)
	if result == nil {
		result = &service.CategorizationResult{CategoryCode: "OTHER_INCOME", Confidence: 0.5}
	}
	result.Type = "income"

	tx, err := b.createTransaction(ctx, user, amount, model.TypeIncome, result.CategoryCode, note, time.Now(), result.Confidence)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal menyimpan transaksi: "+err.Error())
		return
	}

	state := b.getUserState(msg.From.ID)
	state.LastTxID = tx.ID

	confMsg := service.BuildTransactionConfirm(service.ConfirmInfo{
		Amount:       amount,
		Note:         note,
		CategoryCode: result.CategoryCode,
		Type:         model.TypeIncome,
		Confidence:   service.ConfidenceLevel(result.Confidence),
	})

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🗑️ Hapus Transaksi Ini", "delete:last"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(msg.Chat.ID, confMsg, keyboard)
	b.sendStreakMessage(ctx, msg, user.ID)
}

func (b *Bot) cmdSummary(ctx context.Context, msg *tgbotapi.Message) {
	_, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0)

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("📅 Bulan Ini (%s %d)", now.Month().String()[:3], now.Year()),
				fmt.Sprintf("summary:monthly:%d:%d", now.Month(), now.Year()),
			),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("📅 Bulan Lalu (%s %d)", lastMonth.Month().String()[:3], lastMonth.Year()),
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

	b.replyWithKeyboard(msg.Chat.ID, "📊 *Summary — Pilih Periode*\n\nMau lihat ringkasan untuk kapan?", keyboard)
}

func (b *Bot) cmdHistory(ctx context.Context, msg *tgbotapi.Message) {
	_, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

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

	b.replyWithKeyboard(msg.Chat.ID, "📋 *Riwayat Transaksi — Pilih Periode*\n\nPilih bulan:", keyboard)
}

func (b *Bot) cmdBudget(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	parts := splitCommand(msg.Text)
	if len(parts) < 3 {
		b.replyWithKeyboard(msg.Chat.ID,
			"🎯 *Quick Budget Setup*\n\n"+
				"Pilih kategori yang ingin kamu set budgetnya.\n"+
				"Kamu bisa set beberapa kategori sekaligus!\n\n"+
				"👇 Pilih kategori:",
			quickBudgetCategoryKeyboard())
		return
	}

	categoryName := mapCategoryShortcut(parts[1])
	amount, ok := parser.ParseAmount(parts[2])
	if !ok || amount <= 0 {
		b.reply(msg.Chat.ID, "❌ Nominal tidak valid.")
		return
	}

	categoryID, err := b.resolveCategoryID(ctx, user.ID, categoryName, model.TypeExpense)
	if err != nil {
		b.reply(msg.Chat.ID, "❌ Kategori tidak ditemukan: "+categoryName)
		return
	}

	now := time.Now()
	err = b.budgetRepo.Upsert(ctx, user.ID, categoryID, amount, int16(now.Month()), int16(now.Year()))
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal menyimpan budget: "+err.Error())
		return
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(msg.Chat.ID, fmt.Sprintf(
		"✅ *Budget berhasil diset!*\n\n"+
			"📁 Kategori : *%s*\n"+
			"🎯 Budget   : %s\n"+
			"📅 Periode  : %s %d\n\n"+
			"Cek progress budget di /summary",
		categoryName, service.FormatCurrency(amount), now.Month().String(), now.Year(),
	), keyboard)
}

func (b *Bot) cmdGoal(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	parts := splitCommand(msg.Text)

	// Check for /goal add <name> <target>
	if len(parts) >= 4 && strings.ToLower(parts[1]) == "add" {
		target, ok := parser.ParseAmount(parts[len(parts)-1])
		if !ok || target <= 0 {
			b.reply(msg.Chat.ID, "❌ Format: `/goal add <nama> <target>`\nContoh: `/goal add Liburan Bali 5jt`")
			return
		}
		name := strings.Join(parts[2:len(parts)-1], " ")
		if name == "" {
			b.reply(msg.Chat.ID, "❌ Nama goal tidak boleh kosong.")
			return
		}

		_, err := b.goalRepo.Create(ctx, user.ID, name, target)
		if err != nil {
			b.reply(msg.Chat.ID, "⚠️ Gagal membuat goal: "+err.Error())
			return
		}

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
			),
		)

		b.replyWithKeyboard(msg.Chat.ID, fmt.Sprintf(
			"🎯 *Goal berhasil ditambahkan!*\n\n"+
				"📌 Nama   : *%s*\n"+
				"💰 Target : %s\n\n"+
				"Pantau progress di /goal",
			name, service.FormatCurrency(target),
		), keyboard)
		return
	}

	// List goals
	goals, err := b.goalRepo.ListWithProgress(ctx, user.ID)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal memuat goals: "+err.Error())
		return
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(msg.Chat.ID, service.BuildGoalsMessage(goals), keyboard)
}

func (b *Bot) cmdDelete(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	tx, err := b.txRepo.GetLast(ctx, user.ID)
	if err != nil || tx == nil {
		b.reply(msg.Chat.ID, "📭 Tidak ada transaksi yang bisa dihapus.")
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

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ Ya, Hapus", fmt.Sprintf("confirm_delete:%s", tx.ID.String())),
			tgbotapi.NewInlineKeyboardButtonData("❌ Batal", "cancel_delete"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(msg.Chat.ID, fmt.Sprintf(
		"🗑️ *Hapus Transaksi Terakhir?*\n\n"+
			"%s Jenis    : %s\n"+
			"💸 Nominal  : %s\n"+
			"📁 Kategori : %s\n"+
			"📝 Catatan  : %s\n\n"+
			"_Tindakan ini tidak bisa dibatalkan._",
		typeIcon, typeLabel, service.FormatCurrency(tx.Amount), catName, tx.Note.String,
	), keyboard)
}

func (b *Bot) cmdStats(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	stats, err := b.txRepo.GetTodayStats(ctx, user.ID)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal memuat statistik.")
		return
	}

	net := stats.Income - stats.Expense
	netIcon := "💰"
	if net < 0 {
		netIcon = "⚠️"
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📊 Summary", "summary:picker"),
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(msg.Chat.ID, fmt.Sprintf(
		"📊 *Statistik Hari Ini*\n"+
			"📅 %s\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"🔴 Pengeluaran : %s\n"+
			"💚 Pemasukan   : %s\n"+
			"%s Saldo Bersih  : %s\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"📝 Transaksi   : %d transaksi",
		time.Now().Format("02 January 2006"),
		service.FormatCurrency(stats.Expense),
		service.FormatCurrency(stats.Income),
		netIcon, service.FormatCurrency(net),
		stats.TxCount,
	), keyboard)
}

func (b *Bot) cmdHelp(ctx context.Context, msg *tgbotapi.Message) {
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📝 Catat Transaksi", "help:transactions"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("💰 Budget & Goals", "help:budget"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("💡 Tips & Trik", "help:tips"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(msg.Chat.ID,
		"📖 *Gajian Aman — Pusat Bantuan*\n\n"+
			"Halo! Saya Gajian Aman, asisten keuangan pribadimu 🤖\n\n"+
			"Pilih topik yang ingin kamu pelajari 👇",
		keyboard)
}

func (b *Bot) cmdCommands(ctx context.Context, msg *tgbotapi.Message) {
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(msg.Chat.ID,
		"📜 *Daftar Semua Command — Gajian Aman*\n\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"💸 *Transaksi*\n"+
			"➕ `/add <nominal> <ket>` — Catat pengeluaran\n"+
			"💚 `/income <nominal> <ket>` — Catat pemasukan\n"+
			"🗑️ `/delete` — Hapus transaksi terakhir\n\n"+
			"📊 *Laporan*\n"+
			"📊 `/summary` — Ringkasan bulanan / harian\n"+
			"📋 `/history` — 20 transaksi terbaru\n"+
			"📈 `/stats` — Statistik hari ini\n\n"+
			"🎯 *Budget & Goals*\n"+
			"💰 `/budget <kat> <nominal>` — Set budget\n"+
			"🏆 `/goal` — Lihat savings goals\n"+
			"🏆 `/goal add <nama> <target>` — Tambah goal\n\n"+
			"ℹ️ *Lainnya*\n"+
			"🏠 `/start` — Menu utama\n"+
			"📜 `/commands` — Daftar ini\n"+
			"❓ `/help` — Pusat bantuan\n\n"+
			"💡 *Format:* `15k` · `15ribu` · `1.5jt`",
		keyboard)
}

func (b *Bot) cmdCancel(ctx context.Context, msg *tgbotapi.Message) {
	state := b.getUserState(msg.From.ID)
	state.Awaiting = ""
	state.PendingPhotoTx = nil
	b.reply(msg.Chat.ID, "✅ Operasi dibatalkan.")
}

func mapCategoryShortcut(input string) string {
	shortcuts := map[string]string{
		"food":          "FOOD_AND_DINING",
		"groceries":     "GROCERIES",
		"transport":     "TRANSPORT",
		"shopping":      "SHOPPING",
		"health":        "HEALTH",
		"entertainment": "ENTERTAINMENT",
		"bills":         "BILLS_AND_UTILITIES",
		"education":     "EDUCATION",
		"personal":      "PERSONAL_CARE",
		"dining":        "DINING_OUT",
		"savings":       "SAVINGS",
		"other":         "OTHER",
	}
	if mapped, ok := shortcuts[strings.ToLower(input)]; ok {
		return mapped
	}
	// Return uppercase with underscores (assume it's already a code or close to one)
	return strings.ToUpper(strings.ReplaceAll(input, " ", "_"))
}
