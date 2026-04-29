# bot/handlers/callbacks.py

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode

from db.database import AsyncSessionLocal
from db import operations as db
from services.formatter import fmt_currency

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
