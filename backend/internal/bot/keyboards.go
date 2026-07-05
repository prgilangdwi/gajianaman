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
	return expenseCategoryKeyboard("recat")
}

func expenseCategoryKeyboard(prefix string) tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Housing", prefix+":HOUSING"),
			tgbotapi.NewInlineKeyboardButtonData("📱 Utilities", prefix+":BILLS"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🎮 Lifestyle", prefix+":LIFESTYLE"),
			tgbotapi.NewInlineKeyboardButtonData("🚗 Transport", prefix+":TRANSPORTATION"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🍜 Food & Dining", prefix+":DINING"),
			tgbotapi.NewInlineKeyboardButtonData("⚠️ Unexpected", prefix+":UNEXPECTED_EXPENSE"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏦 Savings", prefix+":SAVING"),
			tgbotapi.NewInlineKeyboardButtonData("📚 Education", prefix+":EDUCATION"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("❌ Batal", "cancel_pending"),
		),
	)
}

func incomeCategoryKeyboard() tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("💼 Salary", "cat:SALARY"),
			tgbotapi.NewInlineKeyboardButtonData("💻 Freelance", "cat:FREELANCE"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📈 Investment", "cat:INVESTMENT_RETURN"),
			tgbotapi.NewInlineKeyboardButtonData("💚 Other", "cat:OTHER_INCOME"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("❌ Batal", "cancel_pending"),
		),
	)
}

func quickBudgetCategoryKeyboard() tgbotapi.InlineKeyboardMarkup {
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏠 Housing", "qb_cat:housing"),
			tgbotapi.NewInlineKeyboardButtonData("📱 Utilities", "qb_cat:bills"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🎮 Lifestyle", "qb_cat:lifestyle"),
			tgbotapi.NewInlineKeyboardButtonData("🚗 Transport", "qb_cat:transportation"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🍜 Food & Dining", "qb_cat:dining"),
			tgbotapi.NewInlineKeyboardButtonData("⚠️ Unexpected", "qb_cat:unexpected"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🏦 Savings", "qb_cat:saving"),
			tgbotapi.NewInlineKeyboardButtonData("📚 Education", "qb_cat:education"),
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
