# bot/handlers/messages.py
# Handles natural language messages like "beli makan 15000" without a command.

import re
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode

from db.database import AsyncSessionLocal
from db import operations as db
from services.categorizer import categorize_transaction
from services.formatter import build_transaction_confirm, fmt_currency
from bot.handlers.commands import RECAT_KEYBOARD, parse_amount, maybe_send_budget_alert

_AMOUNT_RE = re.compile(r"\b(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\b", re.IGNORECASE)


def detect_natural_transaction(text: str):
    """
    Try to parse a plain message as a transaction.
    Supports: 'beli makan 15000', '15k kopi', 'ojek 7rb', '1.5jt bayar utang'.
    Returns (amount, note) or (None, None).
    """
    if text.startswith("/") or len(text) < 4:
        return None, None

    for match in _AMOUNT_RE.finditer(text):
        num_str = match.group(1).replace(",", "").replace(".", "")
        suffix = (match.group(2) or "").lower()

        try:
            raw = float(num_str)
            if suffix in ("k", "rb"):
                amount = raw * 1_000
            elif suffix == "ribu":
                amount = raw * 1_000
            elif suffix in ("jt", "juta"):
                amount = raw * 1_000_000
            else:
                amount = raw

            if amount < 100:
                continue

            note = (text[: match.start()] + text[match.end() :]).strip()
            note = re.sub(r"\s+", " ", note).strip()

            if not note:
                continue

            return amount, note
        except (ValueError, TypeError):
            continue

    return None, None


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Fallback handler for plain text — parse as natural transaction or show hint."""
    if not update.message or not update.message.text:
        return

    text = update.message.text.strip()
    user_id = update.effective_user.id

    async with AsyncSessionLocal() as session:
        user = await db.get_user(session, user_id)

    if not user:
        await update.message.reply_text(
            "👋 Halo! Ketik /start untuk mendaftar dan mulai menggunakan FinTrack."
        )
        return

    amount, note = detect_natural_transaction(text)

    if amount is None:
        await update.message.reply_text(
            "💬 Tidak mengerti maksudmu.\n\n"
            "Untuk catat transaksi:\n"
            "• `/add 15000 beli kopi`\n"
            "• Atau langsung: `beli kopi 15000`\n\n"
            "Ketik /help untuk panduan lengkap.",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    await context.bot.send_chat_action(update.effective_chat.id, "typing")
    status_msg = await update.message.reply_text(
        f"🔍 Mendeteksi: *{note}* — {fmt_currency(amount)}\nAI sedang menganalisis...",
        parse_mode=ParseMode.MARKDOWN,
    )

    result = categorize_transaction(note)

    async with AsyncSessionLocal() as session:
        tx_id = await db.insert_transaction(
            session=session,
            user_id=user_id,
            amount=amount,
            tx_type=result["type"],
            category=result["category"],
            subcategory=result["subcategory"],
            note=note,
            confidence=result["confidence"],
        )

    context.user_data["last_tx_id"] = tx_id

    msg = build_transaction_confirm(amount, note, result)

    try:
        await status_msg.delete()
    except Exception:
        pass

    if result["confidence"] == "low":
        await update.message.reply_text(
            msg + "\n\n⚠️ _Confidence rendah. Pilih kategori yang tepat:_",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=RECAT_KEYBOARD,
        )
    else:
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("🗑️ Hapus Transaksi Ini", callback_data="delete:last"),
        ]])
        await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)

    if result["type"] == "expense":
        await maybe_send_budget_alert(update, user_id, result["category"])
