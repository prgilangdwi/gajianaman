# bot/handlers/messages.py
# Handles natural language messages like "beli makan 15000" without a command.

import re
import calendar
from typing import Optional, Tuple
from datetime import date, timedelta, datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode

from db.database import AsyncSessionLocal
from db import operations as db
from services.categorizer import categorize_transaction, parse_batch_transactions, summarize_batch_transactions
from services.categorizer_v2 import categorize_transaction as categorize_transaction_v2
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

_AMOUNT_RE = re.compile(r"\b(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|mio)?\b", re.IGNORECASE)


def _parse_amount_value(text: str) -> Optional[float]:
    """Extract first amount from text. Returns float or None."""
    match = _AMOUNT_RE.search(text)
    if not match:
        return None

    num_str = match.group(1).replace(",", "").replace(".", "")
    suffix = (match.group(2) or "").lower()

    try:
        raw = float(num_str)
        if suffix in ("k", "rb", "ribu"):
            amount = raw * 1_000
        elif suffix in ("jt", "juta", "mio"):
            amount = raw * 1_000_000
        else:
            amount = raw

        return amount if amount >= 100 else None
    except (ValueError, TypeError):
        return None


def _detect_transaction_type(text: str) -> str:
    """Detect transaction type: expense, income, or transfer."""
    text_lower = text.lower()

    # Transfer keywords
    if any(kw in text_lower for kw in ["transfer", "pindah", "kirim", "dari", "ke", "masuk ke", "menuju"]):
        if "dari" in text_lower and ("ke" in text_lower or "masuk" in text_lower):
            return "transfer"

    # Income keywords
    if any(kw in text_lower for kw in ["masuk", "dapat", "terima", "gaji", "income", "pemasukan", "uang masuk", "dapat transfer"]):
        return "income"

    # Expense is default
    return "expense"


def _extract_wallets(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract source and destination wallet from text. Returns (source, destination)."""
    text_lower = text.lower()
    wallets = ["gopay", "ovo", "dana", "shopeepay", "linkaja", "bca", "bni", "mandiri", "bri", "cimb",
               "cash", "tunai", "ewallet", "bank", "tabungan", "rekening"]

    found_wallets = []
    for wallet in wallets:
        if wallet in text_lower:
            found_wallets.append(wallet)

    if len(found_wallets) >= 2:
        # Find order: check for "dari" or prepositions
        if "dari" in text_lower:
            dari_idx = text_lower.find("dari")
            source = None
            dest = None
            for w in found_wallets:
                w_idx = text_lower.find(w)
                if w_idx < dari_idx:
                    source = w
                elif w_idx > dari_idx:
                    dest = w
            return source, dest
        # Return in order found
        return found_wallets[0], found_wallets[1]
    elif len(found_wallets) == 1:
        # Single wallet: could be source or destination depending on transaction type
        return found_wallets[0], None

    return None, None


def detect_natural_transaction(text: str) -> Tuple[Optional[float], Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Parse a plain message as a transaction.
    Supports: 'beli makan 15000', '15k kopi', 'ojek 7rb', '1.5jt bayar utang',
              'uang masuk 200k', 'gaji masuk 5 juta',
              'transfer 100k dari bca ke bni', 'pindah saldo 500k ke ewallet'.
    Returns (amount, note, tx_type, source_wallet, dest_wallet) or (None, ...).
    """
    if text.startswith("/") or len(text) < 4:
        return None, None, None, None, None

    amount = _parse_amount_value(text)
    if amount is None:
        return None, None, None, None, None

    tx_type = _detect_transaction_type(text)
    source_wallet, dest_wallet = _extract_wallets(text)

    # Remove amount from text to get note
    note = re.sub(_AMOUNT_RE, "", text).strip()
    note = re.sub(r"\s+", " ", note).strip()

    # Remove wallet mentions from note for cleaner display
    for wallet in ["gopay", "ovo", "dana", "shopeepay", "linkaja", "bca", "bni", "mandiri", "bri", "cimb", "cash", "tunai", "bank", "tabungan", "rekening"]:
        note = re.sub(rf"\b{wallet}\b", "", note, flags=re.IGNORECASE)

    note = re.sub(r"\s+", " ", note).strip()
    note = re.sub(r"^(dari|ke|pakai|dengan|via|lewat)\s+", "", note, flags=re.IGNORECASE).strip()

    if not note:
        note = "Transaksi"

    return amount, note, tx_type, source_wallet, dest_wallet


def is_multi_transaction(text: str) -> bool:
    """
    Detect if text contains multiple transactions.
    Checks for: 2+ amount patterns, comma separators, or newlines.
    """
    if text.startswith("/"):
        return False

    # Count amount patterns (k, rb, jt, mio, or raw numbers)
    amount_matches = _AMOUNT_RE.findall(text)
    if len(amount_matches) >= 2:
        return True

    # Check for comma or newline separators with at least one amount in each part
    if "," in text or "\n" in text:
        separator = "\n" if "\n" in text else ","
        parts = text.split(separator)
        count_with_amount = sum(1 for part in parts if _parse_amount_value(part) is not None)
        if count_with_amount >= 2:
            return True

    return False


async def _show_batch_preview(update: Update, context: ContextTypes.DEFAULT_TYPE, txs: list):
    """Show preview of parsed batch transactions with AI summary and confirm/cancel buttons."""
    if not txs:
        await update.message.reply_text("❌ Tidak dapat menganalisis transaksi. Coba lagi.")
        return

    # Generate AI summary
    summary = summarize_batch_transactions(txs)

    # Build preview message
    lines = [f"🗒 Saya temukan {len(txs)} transaksi:\n"]
    if summary:
        lines.append(f"📊 *Ringkasan:* {summary}")

    for i, tx in enumerate(txs, 1):
        icon_map = {
            "Food & Dining": "🍜",
            "Groceries": "🛒",
            "Transport": "🚗",
            "Shopping": "🛍️",
            "Health": "💊",
            "Entertainment": "🎮",
            "Bills & Utilities": "📱",
            "Education": "🎓",
            "Personal Care": "💆",
            "Dining Out": "🍽️",
            "Salary": "💼",
            "Freelance": "💻",
            "Investment Return": "📈",
            "Other Income": "💚",
            "Savings": "🏦",
            "Investment": "📊",
        }
        icon = icon_map.get(tx.get("category"), "💵")
        type_label = {"expense": "Pengeluaran", "income": "Pemasukan", "savings": "Tabungan"}.get(tx.get("type"), "Transaksi")

        date_val = tx.get("date", "today")
        if date_val == "today":
            date_str = "Hari ini"
        elif date_val == "yesterday":
            date_str = "Kemarin"
        elif date_val == "tomorrow":
            date_str = "Besok"
        else:
            # Parse ISO date for display
            try:
                dt = datetime.strptime(date_val, "%Y-%m-%d").strftime("%d %B %Y")
                date_str = dt
            except:
                date_str = date_val

        lines.append(f"\n{i}️⃣ {icon} {tx.get('note', 'Transaksi')} • {type_label}")
        lines.append(f"   {fmt_currency(tx.get('amount', 0))} • 📅 {date_str}")

    msg = "\n".join(lines)

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Simpan Semua", callback_data="multi_confirm_all"),
            InlineKeyboardButton("❌ Batal", callback_data="multi_cancel"),
        ]
    ])

    await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)

    # Store parsed batch in context
    context.user_data["pending_multi_txs"] = txs


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

    if awaiting == "photo_edit_amount":
        from bot.handlers.commands import parse_amount as _parse_amount
        try:
            new_amount = _parse_amount(text)
            context.user_data["pending_photo_tx"]["amount"] = new_amount
            context.user_data.pop("awaiting", None)
            pending = context.user_data["pending_photo_tx"]
            from bot.handlers.photos import _build_confirm_text, _CONFIRM_KEYBOARD
            await update.message.reply_text(
                _build_confirm_text(pending),
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=_CONFIRM_KEYBOARD,
            )
        except Exception:
            await update.message.reply_text(
                "❌ Format tidak dikenali.\n\nContoh: `25000` · `25k` · `1.5jt`",
                parse_mode=ParseMode.MARKDOWN,
            )
        return

    if awaiting in ("summary_date", "recat_date"):
        _, parsed_date = parse_backdate(text)
        if parsed_date is None:
            await update.message.reply_text(
                "❌ Format tidak dikenali.\n\n"
                "Gunakan salah satu format:\n"
                "• Numerik: `@15/04` atau `@15/04/2025`\n"
                "• Nama bulan: `@5mei` · `@5 may` · `@may 5` · `@5 mei 2025`",
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

    # Check for multi-transaction input
    is_multi = is_multi_transaction(text)
    print(f"[Multi-TX Debug] Text: {text[:50]}... | is_multi: {is_multi}")
    if is_multi:
        status_msg = await update.message.reply_text("🔍 AI sedang menganalisis transaksi...")
        parsed_txs = parse_batch_transactions(text)
        print(f"[Multi-TX Debug] Parsed {len(parsed_txs) if parsed_txs else 0} transactions")

        try:
            await status_msg.delete()
        except Exception:
            pass

        if parsed_txs:
            await _show_batch_preview(update, context, parsed_txs)
        else:
            await update.message.reply_text("❌ Tidak dapat menganalisis transaksi. Coba lagi dengan format yang lebih jelas.")
        return

    amount, note, tx_type, source_wallet, dest_wallet = detect_natural_transaction(text)

    if amount is None:
        await update.message.reply_text(
            "💬 Tidak mengerti maksudmu.\n\n"
            "Untuk catat transaksi:\n"
            "• *Pengeluaran:* `beli kopi 15000` atau `/add 15000 beli kopi`\n"
            "• *Pemasukan:* `uang masuk 200k` atau `/income 200k gaji`\n"
            "• *Transfer:* `transfer 100k dari bca ke bni`\n\n"
            "Ketik /help untuk panduan lengkap.",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    await context.bot.send_chat_action(update.effective_chat.id, "typing")
    wallet_str = ""
    if source_wallet and dest_wallet:
        wallet_str = f" dari {source_wallet.upper()} ke {dest_wallet.upper()}"
    elif source_wallet:
        wallet_str = f" ({source_wallet.upper()})"

    status_msg = await update.message.reply_text(
        f"🔍 Mendeteksi: *{note}* — {fmt_currency(amount)}{wallet_str}\nAI sedang menganalisis...",
        parse_mode=ParseMode.MARKDOWN,
    )

    # For expense and income, categorize. For transfer, skip categorization
    if tx_type in ("expense", "income"):
        profile = context.application.bot_data.get("profile")
        if profile:
            result = categorize_transaction_v2(note, profile)
        else:
            result = categorize_transaction(note)
        result["type"] = tx_type  # Override with detected type
    else:  # transfer
        result = {
            "type": "transfer",
            "category": "Transfer",
            "subcategory": None,
            "confidence": "high",
            "reason": "Transfer between wallets"
        }

    async with AsyncSessionLocal() as session:
        if tx_type == "transfer" and source_wallet and dest_wallet:
            # For transfers, we need wallet IDs. For now, store wallet names in note
            full_note = f"{note} [{source_wallet} → {dest_wallet}]"
            tx_id = await db.insert_transaction(
                session=session,
                user_id=user_id,
                amount=amount,
                tx_type="transfer",
                category="Transfer",
                subcategory=None,
                note=full_note,
                confidence="high",
            )
        else:
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

    # Build confirmation message
    type_icon = {"expense": "🔴", "income": "💚", "transfer": "🔄"}[result["type"]]
    type_label = {"expense": "Pengeluaran", "income": "Pemasukan", "transfer": "Transfer"}[result["type"]]

    if result["type"] == "transfer":
        msg = (
            f"📋 *Konfirmasi Transaksi*\n\n"
            f"{type_icon} *Jenis:* {type_label}\n"
            f"💰 *Jumlah:* {fmt_currency(amount)}\n"
            f"📤 *Dari:* {source_wallet.upper() if source_wallet else 'Cash'}\n"
            f"📥 *Ke:* {dest_wallet.upper() if dest_wallet else '?'}\n"
            f"📝 *Catatan:* {note}\n\n"
            f"_Apakah data ini benar?_"
        )
    else:
        msg = build_transaction_confirm(amount, note, result)

    try:
        await status_msg.delete()
    except Exception:
        pass

    if result["confidence"] == "low" and result["type"] != "transfer":
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
