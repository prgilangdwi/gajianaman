# bot/handlers/callbacks.py

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from datetime import date

from db.database import AsyncSessionLocal
from db import operations as db
from services.formatter import fmt_currency

# ─────────────────────────────────────────
# Tutorial steps (1-indexed, step 1 is sent by cmd_tutorial)
# ─────────────────────────────────────────
def _nav(step: int, total: int = 5):
    buttons = []
    if step > 2:
        buttons.append(InlineKeyboardButton("← Kembali", callback_data=f"tutorial:{step - 1}"))
    if step <= total:
        buttons.append(InlineKeyboardButton("Selanjutnya →", callback_data=f"tutorial:{step + 1}"))
    return InlineKeyboardMarkup([buttons]) if buttons else None


TUTORIAL_STEPS = {
    2: (
        "📝 *Mencatat Pengeluaran* — Langkah 2/5\n\n"
        "Gunakan `/add` untuk mencatat pengeluaran:\n\n"
        "`/add <nominal> <keterangan>`\n\n"
        "*Contoh:*\n"
        "• `/add 15000 beli kopi`\n"
        "• `/add 75k makan siang`\n"
        "• `/add 1.5jt bayar listrik`\n\n"
        "💡 *Cara lebih cepat:* Ketik langsung tanpa command!\n"
        "   `beli makan 25000` → langsung tercatat\n\n"
        "🤖 AI akan otomatis mendeteksi kategori transaksimu.",
        _nav(2),
    ),
    3: (
        "💚 *Mencatat Pemasukan* — Langkah 3/5\n\n"
        "Gunakan `/income` untuk mencatat pemasukan:\n\n"
        "`/income <nominal> <keterangan>`\n\n"
        "*Contoh:*\n"
        "• `/income 5000000 gaji bulan ini`\n"
        "• `/income 500k freelance desain`\n"
        "• `/income 2jt project web`\n\n"
        "💡 Kamu bisa cek ringkasan pemasukan vs pengeluaran\n"
        "   kapan saja dengan `/summary`.",
        _nav(3),
    ),
    4: (
        "🎯 *Set Budget Bulanan* — Langkah 4/5\n\n"
        "Budget membantu kamu kontrol pengeluaran tiap bulan!\n\n"
        "*Cara mudah (direkomendasikan):*\n"
        "Ketik `/quickbudget` → pilih kategori → pilih nominal\n"
        "Selesai dalam hitungan detik! ⚡\n\n"
        "*Cara manual:*\n"
        "`/budget <kategori> <nominal>`\n"
        "Contoh: `/budget food 1000000`\n\n"
        "*Kategori tersedia:*\n"
        "`food` `transport` `shopping` `health`\n"
        "`entertainment` `bills` `education` `groceries`\n\n"
        "⚠️ FinTrack akan otomatis memberi *ALERT* saat\n"
        "   budget kamu mencapai *80%* atau *terlampaui!*",
        InlineKeyboardMarkup([
            [
                InlineKeyboardButton("← Kembali", callback_data="tutorial:3"),
                InlineKeyboardButton("Selanjutnya →", callback_data="tutorial:5"),
            ],
            [InlineKeyboardButton("🎯 Coba Quick Budget", callback_data="tutorial:try_qb")],
        ]),
    ),
    5: (
        "🏆 *Savings Goals* — Langkah 5/5\n\n"
        "Set target tabungan dan pantau progressnya!\n\n"
        "*Tambah goal baru:*\n"
        "`/goal add <nama> <target>`\n\n"
        "*Contoh:*\n"
        "• `/goal add Liburan Bali 5000000`\n"
        "• `/goal add Emergency Fund 10000000`\n"
        "• `/goal add Beli Motor 15000000`\n\n"
        "*Lihat semua goals:*\n"
        "`/goal` → tampil progress bar tiap goal\n\n"
        "💡 Progress bar otomatis update setiap kamu\n"
        "   mencatat pemasukan.",
        InlineKeyboardMarkup([
            [
                InlineKeyboardButton("← Kembali", callback_data="tutorial:4"),
                InlineKeyboardButton("Selesai ✅", callback_data="tutorial:done"),
            ],
        ]),
    ),
}

TUTORIAL_DONE = (
    "🎉 *Tutorial Selesai! Kamu siap!*\n\n"
    "Berikut rangkuman perintah utama:\n\n"
    "━━━━━━━━━━━━━━━━━━━━\n"
    "➕ `/add` — Catat pengeluaran\n"
    "💚 `/income` — Catat pemasukan\n"
    "📊 `/summary` — Ringkasan bulan ini\n"
    "📋 `/history` — 10 transaksi terakhir\n"
    "📈 `/stats` — Statistik hari ini\n"
    "━━━━━━━━━━━━━━━━━━━━\n"
    "🎯 `/quickbudget` — Set budget mudah\n"
    "📝 `/budget` — Set budget manual\n"
    "🏆 `/goal` — Savings goals\n"
    "🗑️ `/delete` — Hapus transaksi terakhir\n"
    "━━━━━━━━━━━━━━━━━━━━\n\n"
    "Selamat mencatat keuanganmu! 💪",
    InlineKeyboardMarkup([[
        InlineKeyboardButton("🎯 Set Budget Sekarang", callback_data="tutorial:try_qb"),
    ]]),
)

# ─────────────────────────────────────────
# Quick Budget wizard data
# ─────────────────────────────────────────
QB_CATEGORIES = {
    "food":          ("Food & Dining",     "🍜 Makanan"),
    "transport":     ("Transport",         "🚗 Transport"),
    "shopping":      ("Shopping",          "🛍️ Shopping"),
    "health":        ("Health",            "💊 Kesehatan"),
    "entertainment": ("Entertainment",     "🎮 Hiburan"),
    "bills":         ("Bills & Utilities", "📱 Tagihan"),
    "education":     ("Education",         "📚 Pendidikan"),
    "groceries":     ("Groceries",         "🛒 Groceries"),
}

QB_AMOUNTS = [500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000]

QB_CATEGORY_KEYBOARD = InlineKeyboardMarkup([
    [
        InlineKeyboardButton("🍜 Makanan",    callback_data="qb_cat:food"),
        InlineKeyboardButton("🚗 Transport",  callback_data="qb_cat:transport"),
    ],
    [
        InlineKeyboardButton("🛍️ Shopping",   callback_data="qb_cat:shopping"),
        InlineKeyboardButton("💊 Kesehatan",  callback_data="qb_cat:health"),
    ],
    [
        InlineKeyboardButton("🎮 Hiburan",    callback_data="qb_cat:entertainment"),
        InlineKeyboardButton("📱 Tagihan",    callback_data="qb_cat:bills"),
    ],
    [
        InlineKeyboardButton("📚 Pendidikan", callback_data="qb_cat:education"),
        InlineKeyboardButton("🛒 Groceries",  callback_data="qb_cat:groceries"),
    ],
    [InlineKeyboardButton("✅ Selesai", callback_data="qb_done")],
])

HELP_PAGES = {
    "main": (
        "📖 *FinTrack — Pusat Bantuan*\n\n"
        "Pilih topik yang ingin kamu pelajari 👇",
        InlineKeyboardMarkup([
            [InlineKeyboardButton("📝 Catat Transaksi", callback_data="help:transactions")],
            [InlineKeyboardButton("💰 Budget & Goals", callback_data="help:budget")],
            [InlineKeyboardButton("💡 Tips & Trik", callback_data="help:tips")],
        ]),
    ),
    "transactions": (
        "📝 *Mencatat Transaksi*\n\n"
        "*Catat Pengeluaran:*\n"
        "`/add <nominal> <keterangan>`\n"
        "Contoh: `/add 15000 beli kopi`\n\n"
        "*Catat Pemasukan:*\n"
        "`/income <nominal> <keterangan>`\n"
        "Contoh: `/income 5000000 gaji april`\n\n"
        "*Mode Natural (tanpa command):*\n"
        "Ketik langsung: `beli makan 25000`\n\n"
        "*Format Nominal:*\n"
        "• `15000` → Rp 15.000\n"
        "• `15k` atau `15rb` → Rp 15.000\n"
        "• `1.5jt` atau `1juta` → Rp 1.500.000\n\n"
        "*Perintah lainnya:*\n"
        "/history — 10 transaksi terakhir\n"
        "/stats — Statistik hari ini\n"
        "/delete — Hapus transaksi terakhir",
        InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Kembali", callback_data="help:main")],
        ]),
    ),
    "budget": (
        "💰 *Budget & Savings Goals*\n\n"
        "*Set Budget Bulanan:*\n"
        "`/budget <kategori> <nominal>`\n"
        "Contoh: `/budget food 1000000`\n\n"
        "*Kategori Budget:*\n"
        "food, groceries, transport, shopping,\n"
        "health, entertainment, bills, education\n\n"
        "*Lihat Progress Budget:*\n"
        "/summary — Termasuk grafik budget vs aktual\n\n"
        "*Savings Goals:*\n"
        "`/goal` — Lihat semua goals\n"
        "`/goal add <nama> <target>` — Tambah goal\n\n"
        "Contoh:\n"
        "`/goal add Liburan Bali 5000000`",
        InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Kembali", callback_data="help:main")],
        ]),
    ),
    "tips": (
        "💡 *Tips & Trik FinTrack*\n\n"
        "1️⃣ *Catat langsung setelah transaksi*\n"
        "   Biar tidak lupa!\n\n"
        "2️⃣ *Gunakan mode natural*\n"
        "   Ketik `kopi 15k` tanpa command `/add`\n\n"
        "3️⃣ *Set budget di awal bulan*\n"
        "   FinTrack akan alert ketika hampir habis (80%)\n\n"
        "4️⃣ *Cek /summary setiap minggu*\n"
        "   Pantau pengeluaranmu secara rutin\n\n"
        "5️⃣ *Tambah savings goal*\n"
        "   Motivasi lebih tinggi dengan target jelas\n\n"
        "6️⃣ *Hapus salah catat*\n"
        "   Ketik /delete atau tap tombol 🗑️",
        InlineKeyboardMarkup([
            [InlineKeyboardButton("🔙 Kembali", callback_data="help:main")],
        ]),
    ),
}

QUICK_GUIDES = {
    "add": (
        "➕ *Catat Pengeluaran*\n\n"
        "Gunakan format:\n"
        "`/add <nominal> <keterangan>`\n\n"
        "Contoh:\n"
        "• `/add 15000 beli kopi`\n"
        "• `/add 75k makan siang`\n"
        "• `/add 1.5jt bayar listrik`\n\n"
        "Atau ketik langsung:\n"
        "`beli makan 25000`"
    ),
    "income": (
        "💚 *Catat Pemasukan*\n\n"
        "Gunakan format:\n"
        "`/income <nominal> <keterangan>`\n\n"
        "Contoh:\n"
        "• `/income 5000000 gaji bulan ini`\n"
        "• `/income 500k freelance desain`\n"
        "• `/income 2jt project web`"
    ),
}


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    # ── Recategorize (updates DB) ──────────────────────
    if data.startswith("recat:"):
        new_category = data.split(":", 1)[1]
        tx_id = context.user_data.get("last_tx_id")

        if tx_id:
            async with AsyncSessionLocal() as session:
                await db.update_transaction_category(session, tx_id, new_category)
            await query.edit_message_text(
                f"✅ *Kategori diperbarui!*\n\n"
                f"Transaksi dikategorikan ulang ke:\n"
                f"📁 *{new_category}*",
                parse_mode=ParseMode.MARKDOWN,
            )
        else:
            await query.edit_message_text(
                f"✅ Kategori diperbarui ke: *{new_category}*\n"
                f"_(Sesi telah berakhir, update tidak disimpan)_",
                parse_mode=ParseMode.MARKDOWN,
            )

    # ── Quick-delete from transaction confirm ──────────
    elif data == "delete:last":
        tx_id = context.user_data.get("last_tx_id")

        if not tx_id:
            await query.answer("Tidak ada transaksi tersimpan di sesi ini. Gunakan /delete.", show_alert=True)
            return

        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ Ya, Hapus", callback_data=f"confirm_delete:{tx_id}"),
            InlineKeyboardButton("❌ Batal", callback_data="cancel_delete"),
        ]])
        await query.edit_message_reply_markup(reply_markup=keyboard)

    # ── Confirm delete ─────────────────────────────────
    elif data.startswith("confirm_delete:"):
        tx_id = int(data.split(":", 1)[1])
        user_id = update.effective_user.id

        async with AsyncSessionLocal() as session:
            await db.delete_transaction(session, tx_id, user_id)

        context.user_data.pop("last_tx_id", None)
        context.user_data.pop("last_tx_info", None)

        await query.edit_message_text(
            "🗑️ *Transaksi berhasil dihapus.*",
            parse_mode=ParseMode.MARKDOWN,
        )

    # ── Cancel delete ──────────────────────────────────
    elif data == "cancel_delete":
        # Restore original "Hapus" button
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("🗑️ Hapus Transaksi Ini", callback_data="delete:last"),
        ]])
        await query.edit_message_reply_markup(reply_markup=keyboard)

    # ── Help page navigation ───────────────────────────
    elif data.startswith("help:"):
        page = data.split(":", 1)[1]
        if page in HELP_PAGES:
            text, keyboard = HELP_PAGES[page]
            await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)

    # ── Quick action buttons from /start ───────────────
    elif data.startswith("quick:"):
        action = data.split(":", 1)[1]
        if action in QUICK_GUIDES:
            await query.edit_message_text(QUICK_GUIDES[action], parse_mode=ParseMode.MARKDOWN)
        elif action == "summary":
            await query.answer("Menampilkan summary...", show_alert=False)
            await query.message.reply_text("Ketik /summary untuk melihat ringkasan bulan ini. 📊")
        elif action == "history":
            await query.answer("Menampilkan riwayat...", show_alert=False)
            await query.message.reply_text("Ketik /history untuk melihat 10 transaksi terakhir. 📋")

    # ── Tutorial navigation ────────────────────────────
    elif data.startswith("tutorial:"):
        step = data.split(":", 1)[1]

        if step == "done":
            text, keyboard = TUTORIAL_DONE
            await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)

        elif step == "try_qb":
            await query.edit_message_text(
                "🎯 *Quick Budget Setup*\n\n"
                "Pilih kategori yang ingin kamu set budgetnya.\n"
                "Kamu bisa set beberapa kategori sekaligus!\n\n"
                "👇 Pilih kategori:",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=QB_CATEGORY_KEYBOARD,
            )

        elif step.isdigit():
            step_num = int(step)
            if step_num in TUTORIAL_STEPS:
                text, keyboard = TUTORIAL_STEPS[step_num]
                await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)

    # ── Quick Budget: category selected ───────────────
    elif data.startswith("qb_cat:"):
        cat_key = data.split(":", 1)[1]
        if cat_key not in QB_CATEGORIES:
            await query.answer("Kategori tidak ditemukan.", show_alert=True)
            return

        _, label = QB_CATEGORIES[cat_key]

        amount_buttons = [
            [
                InlineKeyboardButton(
                    f"Rp {amt // 1000}.000" if amt < 1_000_000
                    else f"Rp {amt // 1_000_000}jt" + (f".{(amt % 1_000_000) // 100_000}00" if amt % 1_000_000 else ""),
                    callback_data=f"qb_amt:{cat_key}:{amt}",
                )
                for amt in pair
            ]
            for pair in [QB_AMOUNTS[i:i+2] for i in range(0, len(QB_AMOUNTS), 2)]
        ]
        amount_buttons.append([InlineKeyboardButton("← Pilih Kategori Lain", callback_data="qb_back")])

        await query.edit_message_text(
            f"🎯 *Quick Budget — {label}*\n\n"
            f"Pilih nominal budget untuk *{label}* bulan ini:\n\n"
            f"_(Kamu bisa set ulang kapan saja)_",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(amount_buttons),
        )

    # ── Quick Budget: amount selected → save ──────────
    elif data.startswith("qb_amt:"):
        _, cat_key, amt_str = data.split(":")
        amount = float(amt_str)
        user_id = update.effective_user.id
        today = date.today()

        if cat_key not in QB_CATEGORIES:
            await query.answer("Kategori tidak valid.", show_alert=True)
            return

        category, label = QB_CATEGORIES[cat_key]

        async with AsyncSessionLocal() as session:
            await db.upsert_budget(session, user_id, category, amount, today.month, today.year)

        await query.edit_message_text(
            f"✅ *Budget Berhasil Diset!*\n\n"
            f"📁 Kategori : *{label}*\n"
            f"🎯 Budget   : {fmt_currency(amount)}\n"
            f"📅 Periode  : {today.strftime('%B %Y')}\n\n"
            f"Mau set kategori lain?",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton("➕ Set Kategori Lain", callback_data="qb_back"),
                    InlineKeyboardButton("✅ Selesai", callback_data="qb_done"),
                ]
            ]),
        )

    # ── Quick Budget: back to category selection ───────
    elif data == "qb_back":
        await query.edit_message_text(
            "🎯 *Quick Budget Setup*\n\n"
            "Pilih kategori yang ingin kamu set budgetnya.\n"
            "Kamu bisa set beberapa kategori sekaligus!\n\n"
            "👇 Pilih kategori:",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=QB_CATEGORY_KEYBOARD,
        )

    # ── Quick Budget: done ─────────────────────────────
    elif data == "qb_done":
        await query.edit_message_text(
            "✅ *Budget Setup Selesai!*\n\n"
            "Budget kamu sudah aktif untuk bulan ini.\n\n"
            "FinTrack akan otomatis memberi alert saat\n"
            "pengeluaran mencapai *80%* atau *terlampaui*.\n\n"
            "Cek progress budget kapan saja dengan /summary",
            parse_mode=ParseMode.MARKDOWN,
        )
