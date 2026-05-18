# bot/handlers/photos.py
# Handles photo messages: runs Claude Haiku vision, shows confirmation before saving.

import base64

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode

from db.database import AsyncSessionLocal
from db import operations as db
from services.categorizer import parse_image_transaction
from services.formatter import fmt_currency


def _build_confirm_text(result: dict) -> str:
    amount_str = fmt_currency(float(result["amount"]))
    tx_type_map = {"expense": "Pengeluaran", "income": "Pemasukan", "transfer": "Transfer"}
    tx_type = tx_type_map.get(result["type"], "Pengeluaran")
    confidence_icon = {"high": "🟢", "medium": "🟡", "low": "🔴"}.get(result["confidence"], "⚪")

    wallet_line = ""
    if result.get("wallet"):
        wallet_line = f"💳 *Kantong/Wallet:* {result['wallet']}\n"

    return (
        f"📸 *Hasil Analisis Foto*\n\n"
        f"💰 Jumlah: *{amount_str}*\n"
        f"📂 Kategori: *{result['category']}*\n"
        f"📝 Catatan: *{result.get('note', '-')}*\n"
        f"📅 Tipe: *{tx_type}*\n"
        f"{wallet_line}"
        f"{confidence_icon} Confidence: _{result['confidence']}_\n\n"
        f"_Konfirmasi transaksi ini?_"
    )


_CONFIRM_KEYBOARD = InlineKeyboardMarkup([
    [
        InlineKeyboardButton("✅ Simpan", callback_data="photo:save"),
        InlineKeyboardButton("✏️ Edit Jumlah", callback_data="photo:edit_amount"),
    ],
    [InlineKeyboardButton("❌ Batal", callback_data="photo:cancel")],
])


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming photo — analyze with Claude Haiku vision, show confirmation."""
    if not update.message or not update.message.photo:
        return

    user_id = update.effective_user.id

    async with AsyncSessionLocal() as session:
        user = await db.get_user(session, user_id)

    if not user:
        await update.message.reply_text(
            "👋 Ketik /start untuk mendaftar dan mulai menggunakan Gajian Aman."
        )
        return

    status_msg = await update.message.reply_text(
        "📸 Menganalisis foto...\n_Mohon tunggu sebentar._",
        parse_mode=ParseMode.MARKDOWN,
    )

    # Telegram provides multiple sizes — use the largest for best accuracy
    photo = update.message.photo[-1]
    tg_file = await context.bot.get_file(photo.file_id)
    photo_bytes = await tg_file.download_as_bytearray()
    photo_b64 = base64.b64encode(photo_bytes).decode()

    result = parse_image_transaction(photo_b64, "image/jpeg")

    if "error" in result:
        await status_msg.edit_text(
            f"❌ *Gagal membaca foto*\n\n{result['error']}\n\n"
            "Pastikan foto menampilkan struk, bukti transfer, atau konfirmasi pembayaran yang jelas.",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    context.user_data["pending_photo_tx"] = result

    await status_msg.edit_text(
        _build_confirm_text(result),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=_CONFIRM_KEYBOARD,
    )
