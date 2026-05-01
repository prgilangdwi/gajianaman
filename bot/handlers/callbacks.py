# bot/handlers/callbacks.py

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from datetime import date

from db.database import AsyncSessionLocal
from db import operations as db
from services.formatter import fmt_currency, build_history_message, build_summary_message

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
        "⚠️ Gajian Aman akan otomatis memberi *ALERT* saat\n"
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
    InlineKeyboardMarkup([
        [InlineKeyboardButton("🎯 Set Budget Sekarang", callback_data="tutorial:try_qb")],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ]),
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
    [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
])

HELP_PAGES = {
    "main": (
        "📖 *Gajian Aman — Pusat Bantuan*\n\n"
        "Pilih topik yang ingin kamu pelajari 👇",
        InlineKeyboardMarkup([
            [InlineKeyboardButton("📝 Catat Transaksi", callback_data="help:transactions")],
            [InlineKeyboardButton("💰 Budget & Goals", callback_data="help:budget")],
            [InlineKeyboardButton("💡 Tips & Trik", callback_data="help:tips")],
            [InlineKeyboardButton("🌐 Live Dashboard", callback_data="menu:dashboard")],
            [InlineKeyboardButton("💬 Helpdesk", callback_data="menu:helpdesk")],
            [InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main")],
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
        "💡 *Tips & Trik Gajian Aman*\n\n"
        "1️⃣ *Catat langsung setelah transaksi*\n"
        "   Biar tidak lupa!\n\n"
        "2️⃣ *Gunakan mode natural*\n"
        "   Ketik `kopi 15k` tanpa command `/add`\n\n"
        "3️⃣ *Set budget di awal bulan*\n"
        "   Gajian Aman akan alert ketika hampir habis (80%)\n\n"
        "4️⃣ *Cek /summary setiap minggu*\n"
        "   Pantau pengeluaranmu secara rutin\n\n"
        "5️⃣ *Tambah savings goal*\n"
        "   Motivasi lebih tinggi dengan target jelas\n\n"
        "6️⃣ *Hapus salah catat*\n"
        "   Tap 🗑️ Hapus Transaksi di menu utama",
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

    # ── Menu Utama ─────────────────────────────────────
    if data == "menu:main":
        user_id = update.effective_user.id
        user_name = update.effective_user.first_name
        async with AsyncSessionLocal() as session:
            stats = await db.get_today_stats(session, user_id)

        expense = float(stats.expense) if stats else 0
        income = float(stats.income) if stats else 0
        tx_count = stats.tx_count if stats else 0

        from bot.handlers.commands import MAIN_MENU_KEYBOARD
        await query.edit_message_text(
            f"👋 *Halo, {user_name}!*\n\n"
            f"📅 *{date.today().strftime('%d %B %Y')}*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"🔴 Pengeluaran : {fmt_currency(expense)}\n"
            f"💚 Pemasukan   : {fmt_currency(income)}\n"
            f"📝 Transaksi   : {tx_count} hari ini\n"
            f"━━━━━━━━━━━━━━━━━━━━\n\n"
            f"Mau ngapain hari ini? 👇",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=MAIN_MENU_KEYBOARD,
        )

    # ── Live Dashboard ─────────────────────────────────
    elif data == "menu:dashboard":
        await query.edit_message_text(
            "🌐 *Live Dashboard — Gajian Aman*\n\n"
            "Pantau keuanganmu secara real-time di dashboard web!\n\n"
            "🔗 *Link Dashboard:*\n"
            "https://gajianaman.streamlit.app/\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "🔐 *Cara Login:*\n"
            "1. Buka link dashboard di atas\n"
            "2. Masukkan *Telegram ID* kamu di sidebar\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "📱 *Cara Dapatkan Telegram ID:*\n"
            "1. Buka Telegram, cari *@SimpleID\\_Bot*\n"
            "2. Kirim `/start` ke bot tersebut\n"
            "3. Bot langsung tampilkan *Telegram ID* kamu\n"
            "4. Copy ID tersebut dan paste di dashboard\n\n"
            "💡 _(ID berupa angka, contoh: `123456789`)_",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main")],
            ]),
        )

    # ── Helpdesk ───────────────────────────────────────
    elif data == "menu:helpdesk":
        await query.edit_message_text(
            "💬 *Helpdesk — Gajian Aman*\n\n"
            "Butuh bantuan atau ada pertanyaan?\n\n"
            "📩 *Hubungi admin langsung:*\n"
            "@gilangdwipr\n\n"
            "Kami siap membantu kamu dengan:\n"
            "• Pertanyaan tentang fitur bot\n"
            "• Laporan bug atau error\n"
            "• Saran & masukan\n"
            "• Bantuan teknis lainnya",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main")],
            ]),
        )

    # ── Hapus Transaksi: tampilkan daftar ─────────────
    elif data == "hapus:list":
        user_id = update.effective_user.id
        async with AsyncSessionLocal() as session:
            txs = await db.get_last_transactions(session, user_id, 10)

        if not txs:
            await query.edit_message_text(
                "📭 *Tidak ada transaksi yang bisa dihapus.*",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main")],
                ]),
            )
            return

        lines = ["🗑️ *Pilih Transaksi yang Ingin Dihapus:*\n"]
        buttons = []
        row = []
        for i, tx in enumerate(txs, 1):
            icon = "🔴" if tx.type == "expense" else "💚"
            date_str = tx.date.strftime("%d/%m") if hasattr(tx.date, "strftime") else str(tx.date)[:5]
            note_short = (tx.note or tx.category)[:20]
            lines.append(f"*{i}.* {icon} {fmt_currency(float(tx.amount))}  •  {note_short}  •  {date_str}")
            row.append(InlineKeyboardButton(str(i), callback_data=f"hapus:tx:{tx.id}"))
            if len(row) == 5:
                buttons.append(row)
                row = []
        if row:
            buttons.append(row)
        buttons.append([InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main")])

        await query.edit_message_text(
            "\n".join(lines),
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(buttons),
        )

    # ── Hapus Transaksi: konfirmasi per ID ────────────
    elif data.startswith("hapus:tx:"):
        tx_id = int(data.split(":")[2])
        user_id = update.effective_user.id

        async with AsyncSessionLocal() as session:
            tx = await db.get_transaction_by_id(session, tx_id, user_id)

        if not tx:
            await query.answer("Transaksi tidak ditemukan.", show_alert=True)
            return

        icon = "🔴" if tx.type == "expense" else "💚"
        tx_type = "Pengeluaran" if tx.type == "expense" else "Pemasukan"
        date_str = tx.date.strftime("%d %b %Y") if hasattr(tx.date, "strftime") else str(tx.date)

        await query.edit_message_text(
            f"🗑️ *Hapus Transaksi?*\n\n"
            f"{icon} Jenis     : {tx_type}\n"
            f"💸 Nominal  : {fmt_currency(float(tx.amount))}\n"
            f"📁 Kategori : {tx.category}\n"
            f"📝 Catatan  : {tx.note or '-'}\n"
            f"📅 Tanggal  : {date_str}\n\n"
            f"_Tindakan ini tidak bisa dibatalkan._",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton("✅ Ya, Hapus", callback_data=f"hapus:confirm:{tx_id}"),
                    InlineKeyboardButton("❌ Batal", callback_data="hapus:list"),
                ],
            ]),
        )

    # ── Hapus Transaksi: eksekusi hapus ───────────────
    elif data.startswith("hapus:confirm:"):
        tx_id = int(data.split(":")[2])
        user_id = update.effective_user.id

        async with AsyncSessionLocal() as session:
            await db.delete_transaction(session, tx_id, user_id)

        await query.edit_message_text(
            "✅ *Transaksi berhasil dihapus!*\n\n"
            "Pilih tindakan selanjutnya:",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton("🗑️ Hapus Lagi", callback_data="hapus:list"),
                    InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main"),
                ],
            ]),
        )

    # ── Recategorize (updates DB) ──────────────────────
    elif data.startswith("recat:"):
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
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
                ]),
            )
        else:
            await query.edit_message_text(
                f"✅ Kategori diperbarui ke: *{new_category}*\n"
                f"_(Sesi telah berakhir, update tidak disimpan)_",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
                ]),
            )

    # ── Quick-delete from transaction confirm ──────────
    elif data == "delete:last":
        tx_id = context.user_data.get("last_tx_id")

        if not tx_id:
            await query.answer("Tidak ada transaksi tersimpan di sesi ini. Gunakan /delete.", show_alert=True)
            return

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Ya, Hapus", callback_data=f"confirm_delete:{tx_id}"),
                InlineKeyboardButton("❌ Batal", callback_data="cancel_delete"),
            ],
        ])
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
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
            ]),
        )

    # ── Cancel delete ──────────────────────────────────
    elif data == "cancel_delete":
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🗑️ Hapus Transaksi Ini", callback_data="delete:last")],
            [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
        ])
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
            await query.edit_message_text(
                QUICK_GUIDES[action],
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main")],
                ]),
            )
        elif action == "summary":
            user_id = update.effective_user.id
            today = date.today()
            async with AsyncSessionLocal() as session:
                by_cat = await db.get_monthly_summary(session, user_id, today.month, today.year)
                total_income = await db.get_monthly_income(session, user_id, today.month, today.year)
                budget_rows = await db.get_budget_vs_actual(session, user_id, today.month, today.year)
            total_expense = sum(row.total for row in by_cat)
            text = build_summary_message(
                user_name=update.effective_user.first_name,
                month=today.month,
                year=today.year,
                total_income=float(total_income),
                total_expense=float(total_expense),
                by_category=by_cat,
                budget_rows=budget_rows if budget_rows else None,
            )
            await query.edit_message_text(
                text,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main")],
                ]),
            )
        elif action == "history":
            user_id = update.effective_user.id
            async with AsyncSessionLocal() as session:
                txs = await db.get_last_transactions(session, user_id, 10)
            await query.edit_message_text(
                build_history_message(txs),
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [
                        InlineKeyboardButton("🗑️ Hapus Transaksi", callback_data="hapus:list"),
                        InlineKeyboardButton("🔙 Menu Utama", callback_data="menu:main"),
                    ],
                ]),
            )

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
        amount_buttons.append([InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")])

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
                ],
                [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
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
            "Gajian Aman akan otomatis memberi alert saat\n"
            "pengeluaran mencapai *80%* atau *terlampaui*.\n\n"
            "Cek progress budget kapan saja dengan /summary",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
            ]),
        )
