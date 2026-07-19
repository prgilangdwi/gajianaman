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
	"github.com/prgilangdwi/gajianaman/pkg/logger"
)

func (b *Bot) cmdStart(ctx context.Context, msg *tgbotapi.Message) {
	user, err := b.ensureUser(ctx, msg.From)
	if err != nil {
		logger.Error(ctx, "failed to ensure user", "err", err, "telegram_id", msg.From.ID)
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
			service.FormatCurrencyV2(stats.Expense),
			service.FormatCurrencyV2(stats.Income),
			stats.TxCount,
		)
		b.replyWithKeyboard(ctx, msg.Chat.ID, text, mainMenuKeyboard())
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
		b.replyWithKeyboard(ctx, msg.Chat.ID, text, keyboard)
	}
}

func (b *Bot) cmdAdd(ctx context.Context, msg *tgbotapi.Message) {
	_, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	amount, note, ok := parseCommandArgs(msg.Text)
	if !ok {
		b.reply(msg.Chat.ID,
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

	// Store pending transaction
	state := b.getUserState(msg.From.ID)
	state.PendingTx = &PendingTx{
		Amount: amount,
		Note:   cleanNote,
		Type:   model.TypeExpense,
		Date:   txDate,
	}

	// Show category selection keyboard
	text := fmt.Sprintf(
		"📝 *Pilih kategori untuk:*\n\n"+
			"💰 Nominal: *%s*\n"+
			"📝 Catatan: _%s_",
		service.FormatCurrencyV2(amount), cleanNote)

	if hasDate && !txDate.Equal(time.Now().Truncate(24*time.Hour)) {
		text += fmt.Sprintf("\n📅 Tanggal: _%s_", txDate.Format("02 January 2006"))
	}

	b.replyWithKeyboard(ctx, msg.Chat.ID, text, expenseCategoryKeyboard("cat"))
}

func (b *Bot) cmdIncome(ctx context.Context, msg *tgbotapi.Message) {
	_, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	amount, note, ok := parseCommandArgs(msg.Text)
	if !ok {
		b.reply(msg.Chat.ID,
			"❌ *Format command salah.*\n\n"+
				"Gunakan: `/income <nominal> <keterangan>`\n"+
				"Contoh: `/income 5jt gaji bulan ini`")
		return
	}

	// Store pending transaction
	state := b.getUserState(msg.From.ID)
	state.PendingTx = &PendingTx{
		Amount: amount,
		Note:   note,
		Type:   model.TypeIncome,
		Date:   time.Now(),
	}

	// Show category selection keyboard
	text := fmt.Sprintf(
		"💚 *Pilih kategori pemasukan:*\n\n"+
			"💰 Nominal: *%s*\n"+
			"📝 Catatan: _%s_",
		service.FormatCurrencyV2(amount), note)

	b.replyWithKeyboard(ctx, msg.Chat.ID, text, incomeCategoryKeyboard())
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

	b.replyWithKeyboard(ctx, msg.Chat.ID, "📊 *Summary — Pilih Periode*\n\nMau lihat ringkasan untuk kapan?", keyboard)
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

	b.replyWithKeyboard(ctx, msg.Chat.ID, "📋 *Riwayat Transaksi — Pilih Periode*\n\nPilih bulan:", keyboard)
}

func (b *Bot) cmdBudget(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	parts := splitCommand(msg.Text)
	if len(parts) < 3 {
		b.replyWithKeyboard(ctx, msg.Chat.ID,
			"🎯 *Quick Budget Setup*\n\n"+
				"Pilih kategori yang ingin kamu set budgetnya.\n"+
				"Kamu bisa set beberapa kategori sekaligus!\n\n"+
				"👇 Pilih kategori:",
			quickBudgetCategoryKeyboard())
		return
	}

	categoryName := mapCategoryShortcut(parts[1])
	amount, ok := parser.ParseAmountV2(parts[2])
	if !ok || amount <= 0 {
		b.reply(msg.Chat.ID, "❌ Nominal tidak valid.")
		return
	}

	categoryID, err := b.resolveCategoryID(ctx, user.ID, categoryName, model.TypeExpense)
	if err != nil {
		logger.Warn(ctx, "category not found", "err", err, "category", categoryName)
		b.reply(msg.Chat.ID, "❌ Kategori tidak ditemukan: "+categoryName)
		return
	}

	now := time.Now()
	err = b.budgetRepo.Upsert(ctx, user.ID, categoryID, amount, int16(now.Month()), int16(now.Year()))
	if err != nil {
		logger.Error(ctx, "failed to save budget", "err", err, "user_id", user.ID, "category", categoryName)
		b.reply(msg.Chat.ID, "⚠️ Gagal menyimpan budget: "+err.Error())
		return
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(ctx, msg.Chat.ID, fmt.Sprintf(
		"✅ *Budget berhasil diset!*\n\n"+
			"📁 Kategori : *%s*\n"+
			"🎯 Budget   : %s\n"+
			"📅 Periode  : %s %d\n\n"+
			"Cek progress budget di /summary",
		categoryName, service.FormatCurrencyV2(amount), now.Month().String(), now.Year(),
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
		target, ok := parser.ParseAmountV2(parts[len(parts)-1])
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
			logger.Error(ctx, "failed to create goal", "err", err, "user_id", user.ID, "goal_name", name)
			b.reply(msg.Chat.ID, "⚠️ Gagal membuat goal: "+err.Error())
			return
		}

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
			),
		)

		b.replyWithKeyboard(ctx, msg.Chat.ID, fmt.Sprintf(
			"🎯 *Goal berhasil ditambahkan!*\n\n"+
				"📌 Nama   : *%s*\n"+
				"💰 Target : %s\n\n"+
				"Pantau progress di /goal",
			name, service.FormatCurrencyV2(target),
		), keyboard)
		return
	}

	// List goals
	goals, err := b.goalRepo.ListWithProgress(ctx, user.ID)
	if err != nil {
		logger.Error(ctx, "failed to list goals", "err", err, "user_id", user.ID)
		b.reply(msg.Chat.ID, "⚠️ Gagal memuat goals: "+err.Error())
		return
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)

	b.replyWithKeyboard(ctx, msg.Chat.ID, service.BuildGoalsMessage(goals), keyboard)
}

func (b *Bot) cmdDelete(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	tx, err := b.txRepo.GetLast(ctx, user.ID)
	if err != nil {
		logger.Error(ctx, "failed to get last transaction", "err", err, "user_id", user.ID)
	}
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

	b.replyWithKeyboard(ctx, msg.Chat.ID, fmt.Sprintf(
		"🗑️ *Hapus Transaksi Terakhir?*\n\n"+
			"%s Jenis    : %s\n"+
			"💸 Nominal  : %s\n"+
			"📁 Kategori : %s\n"+
			"📝 Catatan  : %s\n\n"+
			"_Tindakan ini tidak bisa dibatalkan._",
		typeIcon, typeLabel, service.FormatCurrencyV2(tx.Amount), catName, tx.Note.String,
	), keyboard)
}

func (b *Bot) cmdStats(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	stats, err := b.txRepo.GetTodayStats(ctx, user.ID)
	if err != nil {
		logger.Error(ctx, "failed to get today stats", "err", err, "user_id", user.ID)
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

	b.replyWithKeyboard(ctx, msg.Chat.ID, fmt.Sprintf(
		"📊 *Statistik Hari Ini*\n"+
			"📅 %s\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"🔴 Pengeluaran : %s\n"+
			"💚 Pemasukan   : %s\n"+
			"%s Saldo Bersih  : %s\n"+
			"━━━━━━━━━━━━━━━━━━━━\n"+
			"📝 Transaksi   : %d transaksi",
		time.Now().Format("02 January 2006"),
		service.FormatCurrencyV2(stats.Expense),
		service.FormatCurrencyV2(stats.Income),
		netIcon, service.FormatCurrencyV2(net),
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

	b.replyWithKeyboard(ctx, msg.Chat.ID,
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

	b.replyWithKeyboard(ctx, msg.Chat.ID,
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
		"housing":    "HOUSING",
		"bills":      "BILLS",
		"utilities":  "BILLS",
		"lifestyle":  "LIFESTYLE",
		"transport":  "TRANSPORTATION",
		"dining":     "DINING",
		"food":       "DINING",
		"unexpected": "UNEXPECTED_EXPENSE",
		"saving":     "SAVING",
		"savings":    "SAVING",
		"education":  "EDUCATION",
	}
	if mapped, ok := shortcuts[strings.ToLower(input)]; ok {
		return mapped
	}
	return strings.ToUpper(strings.ReplaceAll(input, " ", "_"))
}

func (b *Bot) cmdAccount(ctx context.Context, msg *tgbotapi.Message) {
	user, ok := b.requireUser(ctx, msg)
	if !ok {
		return
	}

	args := parseQuotedArgs(msg.Text)
	// args[0] = "/account", args[1] = subcommand, args[2...] = params

	if len(args) < 2 {
		// No subcommand, list accounts
		b.listAccounts(ctx, msg, user)
		return
	}

	switch strings.ToLower(args[1]) {
	case "add":
		b.accountAdd(ctx, msg, user, args[2:])
	case "set":
		b.accountSetDefault(ctx, msg, user, args[2:])
	case "list":
		b.listAccounts(ctx, msg, user)
	default:
		b.reply(msg.Chat.ID,
			"❌ *Subcommand tidak dikenali.*\n\n"+
				"Gunakan:\n"+
				"• `/account` - Lihat semua akun\n"+
				"• `/account add \"nama\" tipe` - Tambah akun baru\n"+
				"• `/account set \"nama\"` - Set akun default\n\n"+
				"*Tipe akun:* cash, bank, ewallet, credit_card, investment")
	}
}

func (b *Bot) listAccounts(ctx context.Context, msg *tgbotapi.Message, user *model.User) {
	accounts, err := b.accountRepo.ListByUser(ctx, user.ID)
	if err != nil {
		logger.Error(ctx, "failed to list accounts", "err", err)
		b.reply(msg.Chat.ID, "⚠️ Gagal mengambil daftar akun.")
		return
	}

	if len(accounts) == 0 {
		b.reply(msg.Chat.ID, "📂 Belum ada akun. Gunakan `/account add \"nama\" tipe` untuk menambah.")
		return
	}

	text := "💳 *Daftar Akun*\n━━━━━━━━━━━━━━━━━━━━\n\n"
	for _, acc := range accounts {
		icon := getAccountIcon(acc.Type)
		defaultMark := ""
		if acc.IsDefault {
			defaultMark = " ⭐"
		}
		text += fmt.Sprintf("%s *%s*%s\n   └ %s • %s\n\n",
			icon, acc.Name, defaultMark,
			acc.Type.String(),
			service.FormatCurrencyV2(acc.Balance))
	}
	text += "━━━━━━━━━━━━━━━━━━━━\n"
	text += "💡 `/account add \"nama\" tipe` - Tambah akun\n"
	text += "💡 `/account set \"nama\"` - Set default"

	b.reply(msg.Chat.ID, text)
}

func (b *Bot) accountAdd(ctx context.Context, msg *tgbotapi.Message, user *model.User, args []string) {
	if len(args) < 2 {
		b.reply(msg.Chat.ID,
			"❌ *Format salah.*\n\n"+
				"Gunakan: `/account add \"nama akun\" tipe`\n"+
				"Contoh: `/account add \"BCA Debit\" bank`\n\n"+
				"*Tipe:* cash, bank, ewallet, credit_card, investment")
		return
	}

	name := args[0]
	typeStr := strings.ToLower(args[1])

	accType, ok := parseAccountType(typeStr)
	if !ok {
		b.reply(msg.Chat.ID,
			"❌ *Tipe akun tidak valid.*\n\n"+
				"Pilih salah satu: cash, bank, ewallet, credit_card, investment")
		return
	}

	// Check if account with same name exists
	existing, _ := b.accountRepo.GetByName(ctx, user.ID, name)
	if existing != nil {
		b.reply(msg.Chat.ID, fmt.Sprintf("⚠️ Akun dengan nama *%s* sudah ada.", name))
		return
	}

	acc := &model.Account{
		UserID:    user.ID,
		Name:      name,
		Type:      accType,
		Balance:   0,
		IsDefault: false,
	}

	if err := b.accountRepo.Create(ctx, acc); err != nil {
		logger.Error(ctx, "failed to create account", "err", err)
		b.reply(msg.Chat.ID, "⚠️ Gagal membuat akun. Coba lagi.")
		return
	}

	icon := getAccountIcon(accType)
	b.reply(msg.Chat.ID, fmt.Sprintf(
		"✅ *Akun berhasil dibuat!*\n\n"+
			"%s *%s*\n"+
			"Tipe: %s\n\n"+
			"Gunakan `/account set \"%s\"` untuk menjadikan default.",
		icon, name, accType.String(), name))
}

func (b *Bot) accountSetDefault(ctx context.Context, msg *tgbotapi.Message, user *model.User, args []string) {
	if len(args) < 1 {
		b.reply(msg.Chat.ID,
			"❌ *Format salah.*\n\n"+
				"Gunakan: `/account set \"nama akun\"`\n"+
				"Contoh: `/account set \"BCA Debit\"`")
		return
	}

	name := args[0]

	acc, err := b.accountRepo.GetByName(ctx, user.ID, name)
	if err != nil {
		logger.Error(ctx, "failed to get account", "err", err)
		b.reply(msg.Chat.ID, "⚠️ Gagal mencari akun.")
		return
	}
	if acc == nil {
		b.reply(msg.Chat.ID, fmt.Sprintf("❌ Akun *%s* tidak ditemukan.", name))
		return
	}

	if acc.IsDefault {
		b.reply(msg.Chat.ID, fmt.Sprintf("ℹ️ *%s* sudah menjadi akun default.", name))
		return
	}

	// Clear existing default and set new one
	if err := b.accountRepo.ClearDefault(ctx, user.ID); err != nil {
		logger.Error(ctx, "failed to clear default", "err", err)
		b.reply(msg.Chat.ID, "⚠️ Gagal mengubah akun default.")
		return
	}

	acc.IsDefault = true
	if err := b.accountRepo.Update(ctx, acc); err != nil {
		logger.Error(ctx, "failed to update account", "err", err)
		b.reply(msg.Chat.ID, "⚠️ Gagal mengubah akun default.")
		return
	}

	icon := getAccountIcon(acc.Type)
	b.reply(msg.Chat.ID, fmt.Sprintf("✅ *%s* %s sekarang menjadi akun default!", icon, name))
}

func parseQuotedArgs(text string) []string {
	var args []string
	var current strings.Builder
	inQuotes := false

	for _, r := range text {
		switch {
		case r == '"':
			inQuotes = !inQuotes
		case r == ' ' && !inQuotes:
			if current.Len() > 0 {
				args = append(args, current.String())
				current.Reset()
			}
		default:
			current.WriteRune(r)
		}
	}
	if current.Len() > 0 {
		args = append(args, current.String())
	}
	return args
}

func parseAccountType(s string) (model.AccountType, bool) {
	switch strings.ToLower(s) {
	case "cash":
		return model.AccountCash, true
	case "bank":
		return model.AccountBank, true
	case "ewallet", "e-wallet":
		return model.AccountEwallet, true
	case "credit_card", "creditcard", "cc":
		return model.AccountCreditCard, true
	case "investment", "invest":
		return model.AccountInvestment, true
	default:
		return 0, false
	}
}

func getAccountIcon(t model.AccountType) string {
	switch t {
	case model.AccountCash:
		return "💵"
	case model.AccountBank:
		return "🏦"
	case model.AccountEwallet:
		return "📱"
	case model.AccountCreditCard:
		return "💳"
	case model.AccountInvestment:
		return "📈"
	default:
		return "💰"
	}
}
