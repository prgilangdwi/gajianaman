# bot/handlers/messages.py
# Handles natural language messages like "beli makan 15000" without a command.

import re
import calendar
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode

from db.database import AsyncSessionLocal
from db import operations as db
from services.categorizer import categorize_transaction
from services.formatter import build_transaction_confirm, fmt_currency, build_daily_summary_message, build_history_message, build_summary_message
from bot.handlers.commands import RECAT_KEYBOARD, parse_amount, maybe_send_budget_alert, parse_backdate


def _parse_month_year(text: str):
    """Parse MM-YYYY format. Returns (month, year) or (None, None)."""
    m = re.match(r'^(\d{1,2})-(\d{4})$', text.strip())
    if not m:
        return None, None
    month, year = int(m.group(1)), int(m.group(2))
    if not (1 <= month <= 12) or not (2000 <= year <= 2100):
        return None, None
    return month, year

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
            "👋 Halo! Ketik /start untuk mendaftar dan mulai menggunakan Gajian Aman."
        )
        return

    # Handle awaiting date input (from summary/recat date pickers)
    awaiting = context.user_data.get("awaiting")
    if awaiting in ("history_month", "summary_month"):
        month, year = _parse_month_year(text)
        if month is None:
            await update.message.reply_text(
                "❌ Format tidak dikenali.\n\nGunakan: `MM-YYYY`\nContoh: `03-2025`",
                parse_mode=ParseMode.MARKDOWN,
            )
            return
        context.user_data.pop("awaiting", None)
        month_label = f"{calendar.month_name[month]} {year}"
        if awaiting == "history_month":
            async with AsyncSessionLocal() as session:
                txs = await db.get_transactions_by_month(session, user_id, month, year, limit=20)
            if not txs:
                await update.message.reply_text(
                    f"📭 Tidak ada transaksi di *{month_label}*.",
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=InlineKeyboardMarkup([
                        [InlineKeyboardButton("🔙 Pilih Bulan Lain", callback_data="history:picker")],
                        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
                    ]),
                )
            else:
                text_out = f"📋 *Riwayat Transaksi — {month_label}*\n_(20 terbaru)_\n\n"
                text_out += build_history_message(txs).replace("📋 *Riwayat Transaksi:*\n\n", "")
                await update.message.reply_text(
                    text_out,
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=InlineKeyboardMarkup([
                        [
                            InlineKeyboardButton("🗑️ Hapus Transaksi", callback_data="hapus:list"),
                            InlineKeyboardButton("🔙 Pilih Bulan Lain", callback_data="history:picker"),
                        ],
                        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
                    ]),
                )
        else:  # summary_month
            user_name = update.effective_user.first_name
            async with AsyncSessionLocal() as session:
                by_cat = await db.get_monthly_summary(session, user_id, month, year)
                total_income = await db.get_monthly_income(session, user_id, month, year)
                budget_rows = await db.get_budget_vs_actual(session, user_id, month, year)
            total_expense = sum(row.total for row in by_cat)
            msg = build_summary_message(
                user_name=user_name,
                month=month,
                year=year,
                total_income=float(total_income),
                total_expense=float(total_expense),
                by_category=by_cat,
                budget_rows=budget_rows if budget_rows else None,
            )
            await update.message.reply_text(
                msg,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🔙 Pilih Periode Lain", callback_data="summary:picker")],
                    [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
                ]),
            )
        return

    if awaiting in ("summary_date", "recat_date"):
        _, parsed_date = parse_backdate(text)
        if parsed_date is None:
            await update.message.reply_text(
                "❌ Format tidak dikenali.\n\nGunakan: `@DD/MM` atau `@DD/MM/YYYY`\n"
                "Contoh: `@15/04` atau `@15/04/2025`",
                parse_mode=ParseMode.MARKDOWN,
            )
            return
        context.user_data.pop("awaiting", None)
        if awaiting == "summary_date":
            async with AsyncSessionLocal() as session:
                by_cat = await db.get_daily_summary(session, user_id, parsed_date)
                total_income = await db.get_daily_income(session, user_id, parsed_date)
            total_expense = sum(row.total for row in by_cat)
            msg = build_daily_summary_message(
                user_name=update.effective_user.first_name,
                target_date=parsed_date,
                total_income=float(total_income),
                total_expense=float(total_expense),
                by_category=by_cat,
            )
            await update.message.reply_text(
                msg,
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🔙 Pilih Periode Lain", callback_data="summary:picker")],
                    [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
                ]),
            )
        else:  # recat_date
            async with AsyncSessionLocal() as session:
                txs = await db.get_transactions_by_date(session, user_id, parsed_date)
            date_label = parsed_date.strftime("%d %b %Y")
            if not txs:
                await update.message.reply_text(
                    f"📭 Tidak ada transaksi pada *{date_label}*.",
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=InlineKeyboardMarkup([
                        [InlineKeyboardButton("🔙 Kembali", callback_data="recat_flow:start")],
                    ]),
                )
            else:
                lines = [f"🔄 *Transaksi pada {date_label}:*\n"]
                buttons = []
                for i, tx in enumerate(txs, 1):
                    icon = "🔴" if tx.type == "expense" else "💚"
                    note_short = (tx.note or tx.category)[:25]
                    lines.append(f"*{i}.* {icon} {fmt_currency(float(tx.amount))} — {note_short}")
                    buttons.append([InlineKeyboardButton(
                        f"{i}. {note_short[:20]}",
                        callback_data=f"recat_tx:{tx.id}"
                    )])
                buttons.append([InlineKeyboardButton("🔙 Kembali", callback_data="recat_flow:start")])
                await update.message.reply_text(
                    "\n".join(lines) + "\n\n_Pilih transaksi yang ingin diubah kategorinya:_",
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=InlineKeyboardMarkup(buttons),
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
