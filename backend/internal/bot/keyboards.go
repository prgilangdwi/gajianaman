package bot

import tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

func mainMenuKeyboard() tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("➕ Catat Pengeluaran", "quick:add"),
			tgbotapi.NewInlineKeyboardButtonData("💚 Catat Pemasukan", "quick:income"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📊 Summary", "summary:picker"),
			tgbotapi.NewInlineKeyboardButtonData("📋 Riwayat Transaksi", "history:picker"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("💰 Budget", "quick:budget"),
			tgbotapi.NewInlineKeyboardButtonData("🎯 Goals & Tabungan", "quick:goals"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🌐 Live Dashboard", "menu:dashboard"),
			tgbotapi.NewInlineKeyboardButtonData("📜 List Commands", "menu:commands"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔄 Ubah Kategori", "recat_flow:start"),
			tgbotapi.NewInlineKeyboardButtonData("🗑️ Hapus Transaksi", "hapus:list"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("💬 Helpdesk", "menu:helpdesk"),
		),
	)
}

func recatKeyboard() tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🍜 Food & Dining", "recat:FOOD_AND_DINING"),
			tgbotapi.NewInlineKeyboardButtonData("🛒 Groceries", "recat:GROCERIES"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🚗 Transport", "recat:TRANSPORT"),
			tgbotapi.NewInlineKeyboardButtonData("🛍️ Shopping", "recat:SHOPPING"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("💊 Health", "recat:HEALTH"),
			tgbotapi.NewInlineKeyboardButtonData("🎮 Entertainment", "recat:ENTERTAINMENT"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📱 Bills", "recat:BILLS_AND_UTILITIES"),
			tgbotapi.NewInlineKeyboardButtonData("🏦 Savings", "recat:SAVINGS"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📁 Other", "recat:OTHER"),
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)
}

func quickBudgetCategoryKeyboard() tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🍜 Makanan", "qb_cat:food"),
			tgbotapi.NewInlineKeyboardButtonData("🚗 Transport", "qb_cat:transport"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🛍️ Shopping", "qb_cat:shopping"),
			tgbotapi.NewInlineKeyboardButtonData("💊 Kesehatan", "qb_cat:health"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🎮 Hiburan", "qb_cat:entertainment"),
			tgbotapi.NewInlineKeyboardButtonData("📱 Tagihan", "qb_cat:bills"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📚 Pendidikan", "qb_cat:education"),
			tgbotapi.NewInlineKeyboardButtonData("🛒 Groceries", "qb_cat:groceries"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ Selesai", "qb_done"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)
}

func quickBudgetAmountKeyboard(categoryKey string) tgbotapi.InlineKeyboardMarkup {
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
				"qb_amt:"+categoryKey+":"+string(rune(amounts[i].value))),
		)
		if i+1 < len(amounts) {
			row = append(row, tgbotapi.NewInlineKeyboardButtonData(amounts[i+1].label,
				"qb_amt:"+categoryKey+":"+string(rune(amounts[i+1].value))))
		}
		rows = append(rows, row)
	}

	rows = append(rows, tgbotapi.NewInlineKeyboardRow(
		tgbotapi.NewInlineKeyboardButtonData("← Pilih Kategori Lain", "qb_back"),
	))
	rows = append(rows, tgbotapi.NewInlineKeyboardRow(
		tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
	))

	return tgbotapi.InlineKeyboardMarkup{InlineKeyboard: rows}
}

func backToMainKeyboard() tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Menu Utama", "menu:main"),
		),
	)
}

func photoConfirmKeyboard() tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ Simpan", "photo:save"),
			tgbotapi.NewInlineKeyboardButtonData("✏️ Edit Jumlah", "photo:edit_amount"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("❌ Batal", "photo:cancel"),
		),
	)
}
