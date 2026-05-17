# bot/handlers/commands.py

import re
import calendar
from functools import wraps
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, CommandHandler, ConversationHandler, MessageHandler, filters
from telegram.constants import ParseMode
from datetime import date

import os
from db.database import AsyncSessionLocal
from db import operations as db
from services.categorizer import categorize_transaction
from services.formatter import (
    build_transaction_confirm,
    fmt_currency,
    fmt_wallet_list,
    fmt_splitbill_result,
)
from db.operations import get_wallets, create_wallet, get_wallet_by_name, create_split_bill

MONTH_MAP = {
    'jan': 1, 'january': 1, 'januari': 1,
    'feb': 2, 'february': 2, 'februari': 2,
    'mar': 3, 'march': 3, 'maret': 3,
    'apr': 4, 'april': 4,
    'may': 5, 'mei': 5,
    'jun': 6, 'june': 6, 'juni': 6,
    'jul': 7, 'july': 7, 'juli': 7,
    'agu': 8, 'aug': 8, 'august': 8, 'agustus': 8,
    'sep': 9, 'september': 9,
    'okt': 10, 'oct': 10, 'october': 10, 'oktober': 10,
    'nov': 11, 'november': 11,
    'des': 12, 'dec': 12, 'december': 12, 'desember': 12,
}

CATEGORY_MAP = {
    "food": "Food & Dining",
    "groceries": "Groceries",
    "transport": "Transport",
    "shopping": "Shopping",
    "health": "Health",
    "entertainment": "Entertainment",
    "bills": "Bills & Utilities",
    "education": "Education",
    "personal": "Personal Care",
    "dining": "Dining Out",
    "savings": "Savings",
    "other": "Other",
}

RECAT_KEYBOARD = InlineKeyboardMarkup([
    [
        InlineKeyboardButton("🍜 Food & Dining", callback_data="recat:Food & Dining"),
        InlineKeyboardButton("🛒 Groceries", callback_data="recat:Groceries"),
    ],
    [
        InlineKeyboardButton("🚗 Transport", callback_data="recat:Transport"),
        InlineKeyboardButton("🛍️ Shopping", callback_data="recat:Shopping"),
    ],
    [
        InlineKeyboardButton("💊 Health", callback_data="recat:Health"),
        InlineKeyboardButton("🎮 Entertainment", callback_data="recat:Entertainment"),
    ],
    [
        InlineKeyboardButton("📱 Bills", callback_data="recat:Bills & Utilities"),
        InlineKeyboardButton("🏦 Savings", callback_data="recat:Savings"),
    ],
    [
        InlineKeyboardButton("📁 Other", callback_data="recat:Other"),
        InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main"),
    ],
])

MAIN_MENU_KEYBOARD = InlineKeyboardMarkup([
    [
        InlineKeyboardButton("➕ Catat Pengeluaran", callback_data="quick:add"),
        InlineKeyboardButton("💚 Catat Pemasukan", callback_data="quick:income"),
    ],
    [
        InlineKeyboardButton("📊 Summary", callback_data="summary:picker"),
        InlineKeyboardButton("📋 Riwayat Transaksi", callback_data="history:picker"),
    ],
    [
        InlineKeyboardButton("💰 Budget", callback_data="tutorial:try_qb"),
        InlineKeyboardButton("🎯 Goals & Tabungan", callback_data="quick:goals"),
    ],
    [
        InlineKeyboardButton("🌐 Live Dashboard", callback_data="menu:dashboard"),
        InlineKeyboardButton("📜 List Commands", callback_data="menu:commands"),
    ],
    [
        InlineKeyboardButton("🔄 Ubah Kategori", callback_data="recat_flow:start"),
        InlineKeyboardButton("🗑️ Hapus Transaksi", callback_data="hapus:list"),
    ],
    [
        InlineKeyboardButton("💬 Helpdesk", callback_data="menu:helpdesk"),
    ],
])


def parse_amount(raw: str) -> float:
    """Parse Indonesian amount strings: 15000, 15k, 15rb, 15ribu, 1.5jt, 2juta, 10mio.

    Spaces between the number and suffix are stripped before matching,
    so "10 ribu", "10 jt", "10 mio" all work identically to "10ribu" etc.
    """
    raw = raw.strip().lower().replace(" ", "")
    if raw.endswith("juta") or raw.endswith("jt") or raw.endswith("mio"):
        num = re.sub(r"(juta|jt|mio)$", "", raw).replace(",", ".")
        return float(num) * 1_000_000
    if raw.endswith("ribu") or raw.endswith("rb") or raw.endswith("k"):
        num = re.sub(r"(ribu|rb|k)$", "", raw).replace(",", ".")
        return float(num) * 1_000
    return float(raw.replace(",", "").replace(".", ""))


def parse_wallet_suffix(text: str) -> tuple[str, str | None]:
    """Returns (cleaned_text, wallet_name_fragment). Removes wallet= or dari= from end of text."""
    pattern = r'\s+(?:wallet|dari)=(\S+)\s*$'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        wallet_frag = match.group(1)
        cleaned = text[:match.start()].strip()
        return cleaned, wallet_frag
    return text, None


def parse_backdate(note: str):
    """Extract optional date suffix from end of note.

    Supported formats:
    - @DD/MM or @DD/MM/YYYY      → @15/04 or @15/04/2025
    - @DD-MM or @DD-MM-YYYY      → @15-04
    - @5mei / @5 mei / @5may     → day then month name
    - @mei5 / @mei 5 / @may5     → month name then day
    - @5 mei 2025 / @may 5 2025  → with optional year
    - @5-mei / @5-may-2025       → hyphen separators

    Returns (cleaned_note, date_or_None).
    """
    # Try numeric: @DD/MM or @DD/MM/YYYY
    m = re.search(r'\s*@(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?\s*$', note)
    if m:
        day, month, year_raw = int(m.group(1)), int(m.group(2)), m.group(3)
        year = date.today().year
        if year_raw:
            year = int(year_raw)
            if year < 100:
                year += 2000
        try:
            tx_date = datetime(year, month, day).date()
            return note[:m.start()].strip(), tx_date
        except ValueError:
            return note.strip(), None

    # Try named month formats
    month_keys = sorted(MONTH_MAP.keys(), key=len, reverse=True)
    month_pat = '(' + '|'.join(month_keys) + ')'

    # Pattern 1: @<day><sep?><monthname><sep?><year?>  e.g. @5mei / @5 mei / @5-mei 2025
    p1 = re.search(
        rf'\s*@(\d{{1,2}})\s*[/\-]?\s*{month_pat}(?:\s*[/\-]?\s*(\d{{2,4}}))?\s*$',
        note, re.IGNORECASE
    )
    if p1:
        day, month_name, year_raw = int(p1.group(1)), p1.group(2).lower(), p1.group(3)
        month_num = MONTH_MAP.get(month_name)
        if month_num:
            year = date.today().year
            if year_raw:
                y = int(year_raw)
                year = y + 2000 if y < 100 else y
            try:
                return note[:p1.start()].strip(), datetime(year, month_num, day).date()
            except ValueError:
                return note.strip(), None

    # Pattern 2: @<monthname><sep?><day><sep?><year?>  e.g. @mei5 / @may 5 / @mei 5 2025
    p2 = re.search(
        rf'\s*@{month_pat}\s*[/\-]?\s*(\d{{1,2}})(?:\s*[/\-]?\s*(\d{{2,4}}))?\s*$',
        note, re.IGNORECASE
    )
    if p2:
        month_name, day, year_raw = p2.group(1).lower(), int(p2.group(2)), p2.group(3)
        month_num = MONTH_MAP.get(month_name)
        if month_num:
            year = date.today().year
            if year_raw:
                y = int(year_raw)
                year = y + 2000 if y < 100 else y
            try:
                return note[:p2.start()].strip(), datetime(year, month_num, day).date()
            except ValueError:
                return note.strip(), None

    return note.strip(), None


# ─────────────────────────────────────────
# Registration guard decorator
# ─────────────────────────────────────────
def require_start(func):
    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not update.effective_user or not update.message:
            return
        async with AsyncSessionLocal() as session:
            user = await db.get_user(session, update.effective_user.id)
        if not user:
            await update.message.reply_text(
                "👋 Halo! Kamu belum terdaftar di Gajian Aman.\n\n"
                "Ketik /start untuk mendaftar dan mulai mencatat keuanganmu! 💰"
            )
            return
        return await func(update, context)
    return wrapper


# ─────────────────────────────────────────
# Budget alert helper
# ─────────────────────────────────────────
async def maybe_send_budget_alert(update: Update, user_id: int, category: str):
    try:
        today = date.today()
        async with AsyncSessionLocal() as session:
            budget = await db.check_budget_alert(session, user_id, category, today.month, today.year)

        if not budget or float(budget.budget) <= 0:
            return

        pct = (float(budget.actual) / float(budget.budget)) * 100
        if pct < 80:
            return

        remaining = float(budget.budget) - float(budget.actual)
        icon = "🔴" if pct > 100 else "🟡"
        status = "Budget Terlampaui!" if pct > 100 else "Mendekati Batas Budget!"
        label = "Melebihi" if pct > 100 else "Sisa"

        await update.message.reply_text(
            f"{icon} *{status}*\n\n"
            f"Kategori  : *{category}*\n"
            f"Budget    : {fmt_currency(float(budget.budget))}\n"
            f"Terpakai  : {fmt_currency(float(budget.actual))} ({pct:.0f}%)\n"
            f"{label}    : {fmt_currency(abs(remaining))}",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception:
        pass


# ─────────────────────────────────────────
# Gamification: streak check
# ─────────────────────────────────────────
async def maybe_send_streak(update: Update, user_id: int):
    try:
        async with AsyncSessionLocal() as session:
            count = await db.get_hourly_transaction_count(session, user_id)

        streaks = {
            2: "🎯 *Double Kill!* Dua transaksi dalam sejam — rajin banget! 💪",
            3: "⚡ *Triple Kill!* Tiga transaksi dalam sejam — lo serius nih! 🔥",
            4: "💥 *Ultra Kill!* Empat transaksi dalam sejam — gila produktif! 😤",
            5: "🏆 *RAMPAGE!!!* Lima transaksi dalam sejam — PENCATAT KEUANGAN SEJATI! 🎮🔥",
        }
        msg = streaks.get(count) or (
            "🏆 *BEYOND GODLIKE!* Lebih dari 5 transaksi dalam sejam — lo sudah transcend! 🌌"
            if count > 5 else None
        )
        if msg:
            await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)
    except Exception:
        pass


# ─────────────────────────────────────────
# /start
# ─────────────────────────────────────────
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user

    async with AsyncSessionLocal() as session:
        existing = await db.get_user(session, user.id)

    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")

    if existing:
        async with AsyncSessionLocal() as session:
            stats = await db.get_today_stats(session, user.id)
    else:
        stats = None

    if existing:
        expense = float(stats.expense) if stats else 0
        income = float(stats.income) if stats else 0
        tx_count = stats.tx_count if stats else 0

        await update.message.reply_text(
            f"👋 *Halo kembali, {user.first_name}!*\n\n"
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
    else:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("📖 Cara Pakai", callback_data="help:main")],
            [
                InlineKeyboardButton("➕ Catat Pengeluaran", callback_data="quick:add"),
                InlineKeyboardButton("💚 Catat Pemasukan", callback_data="quick:income"),
            ],
        ])

        await update.message.reply_text(
            f"🎉 *Selamat datang di Gajian Aman, {user.first_name}!*\n\n"
            "Saya adalah asisten keuangan pribadi yang didukung *AI Claude* 🤖\n\n"
            "✅ Catat pengeluaran & pemasukan\n"
            "🧠 AI otomatis kategorikan transaksi\n"
            "🎯 Set & monitor budget per kategori\n"
            "🏆 Track savings goals kamu\n"
            "📊 Laporan keuangan bulanan\n\n"
            "Kamu sudah terdaftar! Yuk mulai 👇",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=keyboard,
        )

        tutorial_keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🎓 Mulai Tutorial Interaktif", callback_data="tutorial:2")],
            [InlineKeyboardButton("🎯 Set Budget Sekarang", callback_data="tutorial:try_qb")],
        ])
        await update.message.reply_text(
            "📌 *Panduan Cepat:*\n\n"
            "🤖 *Cara termudah — Natural Language:*\n"
            "   Langsung ketik aja, AI yang urus sisanya!\n"
            "   `beli makan siang 25000`\n"
            "   `gaji april 5jt`\n"
            "   `grab ke kantor 25rb kemarin`\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "⌨️ *Atau pakai command:*\n\n"
            "1️⃣ *Catat pengeluaran:*\n"
            "   `/add 15000 beli kopi`\n"
            "   Format: `15k` · `15rb` · `1.5jt` · `2juta`\n"
            "   Tanggal: `@15/04` · `@5mei` · `@may 5`\n\n"
            "2️⃣ *Catat pemasukan:*\n"
            "   `/income 5jt gaji bulan ini`\n\n"
            "3️⃣ *Cek ringkasan:*\n"
            "   `/summary` → pilih bulanan atau harian\n\n"
            "4️⃣ *Set budget mudah:*\n"
            "   Ketuk 💰 Budget di menu utama\n\n"
            "Mau dipandu lebih detail? 👇",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tutorial_keyboard,
        )


# ─────────────────────────────────────────
# /add — Log expense
# ─────────────────────────────────────────
@require_start
async def cmd_add(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    parts = update.message.text.strip().split(" ", 2)

    if len(parts) < 3:
        await update.message.reply_text(
            "💡 *Tahukah kamu?* Kamu tidak perlu pakai command!\n"
            "Cukup ketik langsung, AI yang urusin sisanya:\n"
            "`beli jajan 7500` atau `makan siang 50rb`\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "❌ *Format command salah.*\n\n"
            "Gunakan: `/add <nominal> <keterangan>`\n"
            "Contoh: `/add 7500 beli jajan di warung`\n\n"
            "*Format nominal:*\n"
            "• `15000` → Rp 15.000\n"
            "• `15k` · `15rb` · `15ribu` → Rp 15.000\n"
            "• `1.5jt` · `1juta` · `1jt` → Rp 1.500.000\n\n"
            "*Backdated (opsional):*\n"
            "• `/add 50000 makan @15/04` · `@5mei` · `@may 5`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    try:
        amount = parse_amount(parts[1])
        if amount <= 0:
            raise ValueError
    except (ValueError, AttributeError):
        await update.message.reply_text(
            "❌ Nominal tidak valid.\nContoh: `15000`, `15k`, `15ribu`, `1.5jt`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    note, tx_date = parse_backdate(parts[2])
    note, wallet_frag = parse_wallet_suffix(note)
    wallet_id = None

    if wallet_frag:
        async with AsyncSessionLocal() as session:
            wallet = await get_wallet_by_name(session, user.id, wallet_frag)
        if wallet:
            wallet_id = str(wallet['id'])
        else:
            await update.message.reply_text(
                f"Wallet '{wallet_frag}' gak ketemu nih. "
                "Cek /wallet untuk lihat daftar walletmu."
            )
            return

    await context.bot.send_chat_action(update.effective_chat.id, "typing")
    status_msg = await update.message.reply_text("🔍 AI sedang menganalisis transaksi...")

    result = categorize_transaction(note)

    async with AsyncSessionLocal() as session:
        tx_id = await db.insert_transaction(
            session=session,
            user_id=user.id,
            amount=amount,
            tx_type="expense",
            category=result["category"],
            subcategory=result["subcategory"],
            note=note,
            confidence=result["confidence"],
            tx_date=tx_date,
            wallet_id=wallet_id,
        )

    context.user_data["last_tx_id"] = tx_id
    context.user_data["last_tx_info"] = {
        "amount": amount,
        "category": result["category"],
        "note": note,
        "type": "expense",
    }

    msg = build_transaction_confirm(amount, note, result)
    if tx_date and tx_date != date.today():
        msg += f"\n📅 _Dicatat untuk tanggal: {tx_date.strftime('%d %B %Y')}_"

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
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🗑️ Hapus Transaksi Ini", callback_data="delete:last")],
            [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
        ])
        await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)

    if result["type"] == "expense":
        await maybe_send_budget_alert(update, user.id, result["category"])

    # Savings goal allocation prompt
    if result["category"] == "Savings":
        async with AsyncSessionLocal() as session:
            goals = await db.get_goals(session, user.id)
        if goals:
            buttons = [
                [InlineKeyboardButton(f"🎯 {g.name}", callback_data=f"savings_alloc:{g.id}:{tx_id}:{amount}")]
                for g in goals
            ]
            buttons.append([InlineKeyboardButton("⏭️ Lewati", callback_data="menu:main")])
            await update.message.reply_text(
                "🏦 *Tabungan ini mau dialokasikan ke goal mana?*",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup(buttons),
            )

    await maybe_send_streak(update, user.id)


# ─────────────────────────────────────────
# /income — Log income
# ─────────────────────────────────────────
@require_start
async def cmd_income(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    parts = update.message.text.strip().split(" ", 2)

    if len(parts) < 3:
        await update.message.reply_text(
            "💡 *Tahukah kamu?* Kamu tidak perlu pakai command!\n"
            "Cukup ketik langsung, AI yang urusin sisanya:\n"
            "`gaji april 5jt` atau `freelance desain 500k`\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "❌ *Format command salah.*\n\n"
            "Gunakan: `/income <nominal> <keterangan>`\n"
            "Contoh: `/income 5jt gaji bulan ini`\n\n"
            "*Format nominal:*\n"
            "• `5jt` · `5juta` → Rp 5.000.000\n"
            "• `500k` · `500rb` · `500ribu` → Rp 500.000",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    try:
        amount = parse_amount(parts[1])
        if amount <= 0:
            raise ValueError
    except (ValueError, AttributeError):
        await update.message.reply_text("❌ Nominal tidak valid.", parse_mode=ParseMode.MARKDOWN)
        return

    note = parts[2]
    note, wallet_frag = parse_wallet_suffix(note)
    wallet_id = None

    if wallet_frag:
        async with AsyncSessionLocal() as session:
            wallet = await get_wallet_by_name(session, user.id, wallet_frag)
        if wallet:
            wallet_id = str(wallet['id'])
        else:
            await update.message.reply_text(
                f"Wallet '{wallet_frag}' gak ketemu nih. "
                "Cek /wallet untuk lihat daftar walletmu."
            )
            return

    await context.bot.send_chat_action(update.effective_chat.id, "typing")

    result = categorize_transaction(note)
    result["type"] = "income"

    async with AsyncSessionLocal() as session:
        tx_id = await db.insert_transaction(
            session=session,
            user_id=user.id,
            amount=amount,
            tx_type="income",
            category=result["category"],
            subcategory=result["subcategory"],
            note=note,
            confidence=result["confidence"],
            wallet_id=wallet_id,
        )

    context.user_data["last_tx_id"] = tx_id

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🗑️ Hapus Transaksi Ini", callback_data="delete:last")],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ])
    await update.message.reply_text(
        build_transaction_confirm(amount, note, result),
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )
    await maybe_send_streak(update, user.id)


# ─────────────────────────────────────────
# /summary — Show period picker first
# ─────────────────────────────────────────
@require_start
async def cmd_summary(update: Update, context: ContextTypes.DEFAULT_TYPE):
    today = date.today()
    last_month = (today.replace(day=1) - timedelta(days=1))

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                f"📅 Bulan Ini ({calendar.month_abbr[today.month]} {today.year})",
                callback_data=f"summary:monthly:{today.month}:{today.year}"
            ),
        ],
        [
            InlineKeyboardButton(
                f"📅 Bulan Lalu ({calendar.month_abbr[last_month.month]} {last_month.year})",
                callback_data=f"summary:monthly:{last_month.month}:{last_month.year}"
            ),
        ],
        [
            InlineKeyboardButton("📆 Hari Ini", callback_data="summary:daily:today"),
            InlineKeyboardButton("📆 Kemarin", callback_data="summary:daily:yesterday"),
        ],
        [InlineKeyboardButton("📆 Tanggal Tertentu", callback_data="summary:daily:pick")],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ])
    await update.message.reply_text(
        "📊 *Summary — Pilih Periode*\n\nMau lihat ringkasan untuk kapan?",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /history — Show period picker first
# ─────────────────────────────────────────
@require_start
async def cmd_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    today = date.today()
    last_month = (today.replace(day=1) - timedelta(days=1))

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                f"📅 {calendar.month_name[today.month]} {today.year}",
                callback_data=f"history:month:{today.month}:{today.year}"
            ),
            InlineKeyboardButton(
                f"📅 {calendar.month_name[last_month.month]} {last_month.year}",
                callback_data=f"history:month:{last_month.month}:{last_month.year}"
            ),
        ],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ])
    await update.message.reply_text(
        "📋 *Riwayat Transaksi — Pilih Periode*\n\nPilih bulan:",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /stats — Today's quick stats
# ─────────────────────────────────────────
@require_start
async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    today = date.today()

    async with AsyncSessionLocal() as session:
        stats = await db.get_today_stats(session, user.id)

    expense = float(stats.expense) if stats else 0
    income = float(stats.income) if stats else 0
    tx_count = stats.tx_count if stats else 0
    net = income - expense

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📊 Summary", callback_data="summary:picker"),
            InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main"),
        ]
    ])
    await update.message.reply_text(
        f"📊 *Statistik Hari Ini*\n"
        f"📅 {today.strftime('%d %B %Y')}\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🔴 Pengeluaran : {fmt_currency(expense)}\n"
        f"💚 Pemasukan   : {fmt_currency(income)}\n"
        f"{'💰' if net >= 0 else '⚠️'} Saldo Bersih  : {fmt_currency(net)}\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📝 Transaksi   : {tx_count} transaksi\n\n"
        f"Lihat ringkasan: /summary",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /delete — Delete last transaction
# ─────────────────────────────────────────
@require_start
async def cmd_delete(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user

    async with AsyncSessionLocal() as session:
        tx = await db.get_last_transaction(session, user.id)

    if not tx:
        await update.message.reply_text("📭 Tidak ada transaksi yang bisa dihapus.")
        return

    icon = "🔴" if tx.type == "expense" else "💚"
    tx_type = "Pengeluaran" if tx.type == "expense" else "Pemasukan"

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Ya, Hapus", callback_data=f"confirm_delete:{tx.id}"),
            InlineKeyboardButton("❌ Batal", callback_data="cancel_delete"),
        ],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ])

    await update.message.reply_text(
        f"🗑️ *Hapus Transaksi Terakhir?*\n\n"
        f"{icon} Jenis    : {tx_type}\n"
        f"💸 Nominal  : {fmt_currency(float(tx.amount))}\n"
        f"📁 Kategori : {tx.category}\n"
        f"📝 Catatan  : {tx.note or '-'}\n\n"
        f"_Tindakan ini tidak bisa dibatalkan._",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /budget — Set budget
# ─────────────────────────────────────────
@require_start
async def cmd_budget(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    parts = update.message.text.strip().split(" ", 2)

    if len(parts) < 3:
        cats = "\n".join(f"  • `{k}` → {v}" for k, v in CATEGORY_MAP.items())
        await update.message.reply_text(
            "💡 *Cara lebih mudah:* Gunakan wizard interaktif!\n"
            "Ketuk 💰 *Budget* di menu utama → pilih kategori → masukkan nominal.\n"
            "Tidak perlu hafal nama kategori 🎯\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "❌ *Format command salah.*\n\n"
            "Gunakan: `/budget <kategori> <nominal>`\n"
            "Contoh: `/budget food 500000`\n\n"
            f"*Kategori tersedia:*\n{cats}",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    cat_key = parts[1].lower()
    category = CATEGORY_MAP.get(cat_key, parts[1].title())

    try:
        amount = parse_amount(parts[2])
        if amount <= 0:
            raise ValueError
    except (ValueError, AttributeError):
        await update.message.reply_text("❌ Nominal tidak valid.")
        return

    today = date.today()
    async with AsyncSessionLocal() as session:
        await db.upsert_budget(session, user.id, category, amount, today.month, today.year)

    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main"),
    ]])
    await update.message.reply_text(
        f"✅ *Budget berhasil diset!*\n\n"
        f"📁 Kategori : *{category}*\n"
        f"🎯 Budget   : {fmt_currency(amount)}\n"
        f"📅 Periode  : {today.strftime('%B %Y')}\n\n"
        f"Cek progress budget di /summary",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /goal — View/add savings goals
# ─────────────────────────────────────────
@require_start
async def cmd_goal(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    parts = update.message.text.strip().split()

    if len(parts) >= 3 and parts[1].lower() == "add":
        # Try to parse the last token as amount; everything between "add" and
        # the amount is the goal name (supports multi-word names).
        try:
            if len(parts) < 4:
                raise ValueError("missing target")
            target = parse_amount(parts[-1])
            name = " ".join(parts[2:-1])
            if not name:
                raise ValueError("missing name")
        except (ValueError, IndexError):
            await update.message.reply_text(
                "❌ Format: `/goal add <nama> <target>`\n"
                "Contoh: `/goal add Liburan Bali 5jt`",
                parse_mode=ParseMode.MARKDOWN,
            )
            return

        async with AsyncSessionLocal() as session:
            await db.upsert_goal(session, user.id, name, target)
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main"),
        ]])
        await update.message.reply_text(
            f"🎯 *Goal berhasil ditambahkan!*\n\n"
            f"📌 Nama   : *{name}*\n"
            f"💰 Target : {fmt_currency(target)}\n\n"
            f"Pantau progress di /goal",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=keyboard,
        )
        return

    async with AsyncSessionLocal() as session:
        goals = await db.get_goals(session, user.id)

    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main"),
    ]])

    if not goals:
        await update.message.reply_text(
            "📭 *Belum ada savings goal.*\n\n"
            "Tambahkan dengan:\n"
            "`/goal add <nama> <target>`\n\n"
            "Contoh:\n"
            "`/goal add Liburan Bali 5jt`\n"
            "`/goal add Beli Motor 15jt`",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=keyboard,
        )
        return

    lines = ["🏆 *Savings Goals:*\n"]
    for g in goals:
        pct = min((float(g.saved_amount) / float(g.target_amount) * 100), 100) if g.target_amount > 0 else 0
        bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
        status = "✅" if pct >= 100 else ("🔥" if pct >= 50 else "💪")
        lines.append(
            f"{status} *{g.name}*\n"
            f"   {bar} {pct:.0f}%\n"
            f"   {fmt_currency(float(g.saved_amount))} / {fmt_currency(float(g.target_amount))}\n"
        )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)


# ─────────────────────────────────────────
# /commands — List all available commands
# ─────────────────────────────────────────
async def cmd_commands(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main"),
    ]])
    await update.message.reply_text(
        "📜 *Daftar Semua Command — Gajian Aman*\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "💸 *Transaksi*\n"
        "➕ `/add <nominal> <ket>` — Catat pengeluaran\n"
        "   _Contoh: `/add 15k beli kopi`_\n"
        "💚 `/income <nominal> <ket>` — Catat pemasukan\n"
        "   _Contoh: `/income 5jt gaji april`_\n"
        "🗑️ `/delete` — Hapus transaksi terakhir\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "📊 *Laporan*\n"
        "📊 `/summary` — Ringkasan bulanan / harian\n"
        "📋 `/history` — 20 transaksi terbaru per periode\n"
        "📈 `/stats` — Statistik hari ini\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🎯 *Budget & Goals*\n"
        "💰 `/budget <kat> <nominal>` — Set budget bulanan\n"
        "   _Contoh: `/budget food 1jt`_\n"
        "⚡ `/quickbudget` — Wizard set budget cepat\n"
        "🏆 `/goal` — Lihat semua savings goals\n"
        "🏆 `/goal add <nama> <target>` — Tambah goal\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "ℹ️ *Lainnya*\n"
        "🏠 `/start` — Menu utama & dashboard hari ini\n"
        "📜 `/commands` — Tampilkan daftar ini\n"
        "🎓 `/tutorial` — Tutorial interaktif 5 langkah\n"
        "❓ `/help` — Pusat bantuan\n"
        "❌ `/cancel` — Batalkan operasi yang sedang berjalan\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "💡 *Format Nominal:*\n"
        "`15000` · `15k` · `15rb` · `15ribu` → Rp 15.000\n"
        "`1.5jt` · `1juta` · `1jt` → Rp 1.500.000\n\n"
        "📅 *Backdated:* tambahkan tanggal dengan `@` di akhir keterangan\n"
        "_Format numerik:_  `@15/04` · `@15/04/2025` · `@15-04`\n"
        "_Format nama bulan:_  `@5mei` · `@5 mei` · `@5may` · `@may5` · `@may 5`\n"
        "_Dengan tahun:_  `@5 mei 2025` · `@may 5 2025`\n"
        "_Contoh: `/add 50k makan @15/04` atau `/add 50k kopi @5mei`_",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /help — Interactive help
# ─────────────────────────────────────────
async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🎓 Tutorial Interaktif", callback_data="tutorial:2")],
        [InlineKeyboardButton("📝 Catat Transaksi", callback_data="help:transactions")],
        [InlineKeyboardButton("💰 Budget & Goals", callback_data="help:budget")],
        [InlineKeyboardButton("💡 Tips & Trik", callback_data="help:tips")],
        [InlineKeyboardButton("🌐 Live Dashboard", callback_data="menu:dashboard")],
        [InlineKeyboardButton("🎯 Quick Budget Setup", callback_data="tutorial:try_qb")],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ])
    await update.message.reply_text(
        "📖 *Gajian Aman — Pusat Bantuan*\n\n"
        "Halo! Saya Gajian Aman, asisten keuangan pribadimu 🤖\n\n"
        "Pilih topik yang ingin kamu pelajari 👇",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /tutorial — Step-by-step interactive guide
# ─────────────────────────────────────────
async def cmd_tutorial(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("Mulai Tutorial →", callback_data="tutorial:2")],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ])
    await update.message.reply_text(
        "🎓 *Tutorial Gajian Aman* — Langkah 1/5\n\n"
        "Selamat datang di tutorial interaktif!\n"
        "Saya akan memandu kamu dalam 5 langkah sederhana.\n\n"
        "*Yang akan kamu pelajari:*\n"
        "1️⃣ Cara mencatat pengeluaran\n"
        "2️⃣ Cara mencatat pemasukan\n"
        "3️⃣ Cara set budget bulanan\n"
        "4️⃣ Cara set savings goal\n"
        "5️⃣ Tips & trik\n\n"
        "Siap? Klik tombol di bawah untuk mulai! 👇",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /quickbudget — Easy budget setup wizard
# ─────────────────────────────────────────
@require_start
async def cmd_quickbudget(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🍜 Makanan", callback_data="qb_cat:food"),
            InlineKeyboardButton("🚗 Transport", callback_data="qb_cat:transport"),
        ],
        [
            InlineKeyboardButton("🛍️ Shopping", callback_data="qb_cat:shopping"),
            InlineKeyboardButton("💊 Kesehatan", callback_data="qb_cat:health"),
        ],
        [
            InlineKeyboardButton("🎮 Hiburan", callback_data="qb_cat:entertainment"),
            InlineKeyboardButton("📱 Tagihan", callback_data="qb_cat:bills"),
        ],
        [
            InlineKeyboardButton("📚 Pendidikan", callback_data="qb_cat:education"),
            InlineKeyboardButton("🛒 Groceries", callback_data="qb_cat:groceries"),
        ],
        [InlineKeyboardButton("✅ Selesai", callback_data="qb_done")],
        [InlineKeyboardButton("🏠 Menu Utama", callback_data="menu:main")],
    ])
    await update.message.reply_text(
        "🎯 *Quick Budget Setup*\n\n"
        "Pilih kategori yang ingin kamu set budgetnya.\n"
        "Kamu bisa set beberapa kategori sekaligus!\n\n"
        "👇 Pilih kategori:",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=keyboard,
    )


# ─────────────────────────────────────────
# /cancel
# ─────────────────────────────────────────
async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("✅ Operasi dibatalkan.")


# ─────────────────────────────────────────
# /wallet — View and create wallets
# ─────────────────────────────────────────
@require_start
async def cmd_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    args = context.args or []

    async with AsyncSessionLocal() as session:
        wallets_raw = await get_wallets(session, user_id)

    if args and args[0].lower() == 'buat' and len(args) >= 2:
        wallet_name = args[1]
        initial_balance = float(args[2]) if len(args) >= 3 else 0.0
        wtype = (
            'ewallet' if wallet_name.lower() in ['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja']
            else 'cash' if wallet_name.lower() == 'cash'
            else 'bank'
        )
        async with AsyncSessionLocal() as session:
            await create_wallet(session, user_id, wallet_name, wtype, len(wallets_raw) == 0, initial_balance)
        await update.message.reply_text(
            f"✅ Wallet *{wallet_name}* berhasil ditambahkan!", parse_mode='Markdown'
        )
        return

    if not wallets_raw:
        await update.message.reply_text(
            "Kamu belum punya wallet nih! Tambah dulu:\n"
            "/wallet buat BCA 5000000\n\n"
            "Pilihan: BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, Cash"
        )
        return

    wallets_with_balance = [{**w, 'balance': float(w.get('initial_balance', 0))} for w in wallets_raw]
    await update.message.reply_text(
        fmt_wallet_list(wallets_with_balance),
        parse_mode='Markdown'
    )


async def cmd_insights(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show financial insights: spending patterns, budget recommendations, forecast."""
    user = update.effective_user
    if not user:
        return

    async with AsyncSessionLocal() as session:
        db_user = await db.get_user(session, user.id)
        if not db_user:
            await update.message.reply_text(
                "User belum terdaftar. Ketik /start untuk mulai."
            )
            return

        now = datetime.now()
        current_month = now.month
        current_year = now.year

        # Get transactions from the past 3 months
        txs = await db.list_transactions(
            session,
            user_id=user.id,
            limit=1000,
        )

        # Filter to last 3 months
        three_months_ago = now - timedelta(days=90)
        recent_txs = [t for t in txs if datetime.fromisoformat(t.date) >= three_months_ago]

        if not recent_txs:
            await update.message.reply_text(
                "📊 *Insights*\n\n"
                "Belum ada transaksi untuk dianalisis.\n"
                "Mulai catat transaksi dengan `/add` atau `/income`!",
                parse_mode='Markdown'
            )
            return

        # Calculate spending patterns (3-month comparison)
        monthly_spending = {}
        for i in range(3):
            m = (current_month - i - 1 + 12) % 12 + 1
            y = current_year - (1 if current_month - i - 1 < 0 else 0)
            monthly_spending[f"{y}-{m:02d}"] = {}

        for tx in recent_txs:
            tx_date = datetime.fromisoformat(tx.date)
            tx_month = f"{tx_date.year}-{tx_date.month:02d}"
            if tx_month in monthly_spending and tx.type == "expense":
                cat = tx.category or "Other"
                if cat not in monthly_spending[tx_month]:
                    monthly_spending[tx_month][cat] = 0
                monthly_spending[tx_month][cat] += float(tx.amount)

        # Get top categories
        all_cats = {}
        for month_data in monthly_spending.values():
            for cat, amt in month_data.items():
                if cat not in all_cats:
                    all_cats[cat] = []
                all_cats[cat].append(amt)

        top_cats = sorted(all_cats.items(), key=lambda x: sum(x[1]), reverse=True)[:3]

        # Current month expenses
        current_month_txs = [t for t in txs if datetime.fromisoformat(t.date).month == current_month and t.type == "expense"]
        current_spent = sum(float(t.amount) for t in current_month_txs)
        day_of_month = now.day
        days_in_month = calendar.monthrange(current_year, current_month)[1]
        daily_avg = current_spent / day_of_month if day_of_month > 0 else 0
        projected_month_end = int(daily_avg * days_in_month)

        # Build message
        msg = "📊 *Financial Insights*\n\n"
        msg += f"💰 *Bulan Ini*\n"
        msg += f"  Sudah keluar: {fmt_currency(int(current_spent))}\n"
        msg += f"  Rata-rata/hari: {fmt_currency(int(daily_avg))}\n"
        msg += f"  Proyeksi akhir: {fmt_currency(projected_month_end)}\n"
        msg += f"  Hari sisa: {days_in_month - day_of_month}\n\n"

        if top_cats:
            msg += "🏆 *Top Categories (3 bulan)*\n"
            for cat, amounts in top_cats:
                avg = sum(amounts) / len(amounts)
                msg += f"  • {cat}: {fmt_currency(int(avg))}/bulan\n"
            msg += "\n"

        msg += "📈 *Tips*\n"
        if projected_month_end > 0:
            monthly_avg = sum(float(t.amount) for t in txs if t.type == "expense") / max(1, len([t for t in txs if t.type == "expense"]))
            if projected_month_end > monthly_avg * 1.2:
                msg += "  ⚠️ Proyeksi bulanmu lebih tinggi dari biasanya.\n"
            else:
                msg += "  ✅ Pengeluaran bulanmu sesuai target.\n"

        msg += "\n🌐 Lihat analisis lengkap di Dashboard!\n"
        msg += "[Buka Dashboard](https://gajianam.com)"

        await update.message.reply_text(msg, parse_mode='Markdown', disable_web_page_preview=True)


async def cmd_notify(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check for unusual spending patterns and alert user."""
    user = update.effective_user
    if not user:
        return

    async with AsyncSessionLocal() as session:
        db_user = await db.get_user(session, user.id)
        if not db_user:
            await update.message.reply_text(
                "User belum terdaftar. Ketik /start untuk mulai."
            )
            return

        now = datetime.now()
        current_month = now.month
        current_year = now.year

        # Get recent transactions (last 7 days)
        txs = await db.list_transactions(
            session,
            user_id=user.id,
            limit=500,
        )

        seven_days_ago = now - timedelta(days=7)
        recent_txs = [
            t for t in txs
            if datetime.fromisoformat(t.date) >= seven_days_ago and t.type == "expense"
        ]

        if not recent_txs:
            await update.message.reply_text(
                "✅ Gak ada pengeluaran signifikan dalam 7 hari terakhir."
            )
            return

        # Calculate average by category
        cat_totals = {}
        cat_counts = {}
        for tx in recent_txs:
            cat = tx.category or "Other"
            amt = float(tx.amount)
            if cat not in cat_totals:
                cat_totals[cat] = 0
                cat_counts[cat] = 0
            cat_totals[cat] += amt
            cat_counts[cat] += 1

        alerts = []

        # Alert 1: Large individual transactions
        large_txs = [t for t in recent_txs if float(t.amount) > 500000]
        if large_txs:
            for tx in sorted(large_txs, key=lambda x: float(x.amount), reverse=True)[:2]:
                alerts.append(
                    f"💰 *Pengeluaran besar* ({(now - datetime.fromisoformat(tx.date)).days}d lalu)\n"
                    f"   {tx.note or tx.category}: {fmt_currency(int(float(tx.amount)))}"
                )

        # Alert 2: Categories with unusual activity
        for cat in cat_totals:
            total = cat_totals[cat]
            count = cat_counts[cat]
            daily_avg = total / 7
            if daily_avg > 200000:  # More than 200k/day on average
                alerts.append(
                    f"⚠️ *Pengeluaran tinggi: {cat}*\n"
                    f"   Total 7 hari: {fmt_currency(int(total))} ({count} transaksi)"
                )

        if alerts:
            msg = "🔔 *Spending Alerts*\n\n"
            msg += "\n\n".join(alerts)
            msg += "\n\n💡 Cek dashboard untuk analisis lengkap!"
        else:
            msg = "✅ Pengeluaranmu stabil, gak ada yang aneh nih."

        await update.message.reply_text(msg, parse_mode='Markdown')


async def cmd_csv(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Export transactions as CSV file."""
    user = update.effective_user
    if not user:
        return

    async with AsyncSessionLocal() as session:
        db_user = await db.get_user(session, user.id)
        if not db_user:
            await update.message.reply_text(
                "User belum terdaftar. Ketik /start untuk mulai."
            )
            return

        txs = await db.list_transactions(
            session,
            user_id=user.id,
            limit=10000,
        )

        if not txs:
            await update.message.reply_text(
                "Belum ada transaksi untuk di-export."
            )
            return

        # Build CSV
        csv_lines = ["Tanggal,Type,Kategori,Jumlah,Note,AI Confidence"]
        for tx in sorted(txs, key=lambda x: x.date, reverse=True):
            note = (tx.note or "").replace(",", ";").replace("\n", " ")
            confidence = tx.ai_confidence or ""
            csv_lines.append(
                f'{tx.date},{tx.type},{tx.category},{tx.amount},"{note}",{confidence}'
            )

        csv_content = "\n".join(csv_lines)

        # Send as document
        filename = f"gajian_aman_{datetime.now().strftime('%Y%m%d')}.csv"
        await update.message.reply_document(
            document=csv_content.encode('utf-8'),
            filename=filename,
            caption=f"📊 *{len(txs)} transaksi* di-export ke CSV",
            parse_mode='Markdown',
        )


async def cmd_trends(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show 3-month spending trends by category."""
    user = update.effective_user
    if not user:
        return

    async with AsyncSessionLocal() as session:
        db_user = await db.get_user(session, user.id)
        if not db_user:
            await update.message.reply_text(
                "User belum terdaftar. Ketik /start untuk mulai."
            )
            return

        now = datetime.now()
        current_month = now.month
        current_year = now.year

        # Get transactions from the past 3 months
        txs = await db.list_transactions(
            session,
            user_id=user.id,
            limit=1000,
        )

        # Organize by month
        three_months = {}
        for i in range(3):
            m = (current_month - i - 1 + 12) % 12 + 1
            y = current_year - (1 if current_month - i - 1 < 0 else 0)
            month_key = f"{y}-{m:02d}"
            three_months[month_key] = {}

        for tx in txs:
            if tx.type != "expense":
                continue
            tx_date = datetime.fromisoformat(tx.date)
            month_key = f"{tx_date.year}-{tx_date.month:02d}"
            if month_key in three_months:
                cat = tx.category or "Other"
                if cat not in three_months[month_key]:
                    three_months[month_key][cat] = 0
                three_months[month_key][cat] += float(tx.amount)

        # Calculate trends
        all_categories = set()
        for month_data in three_months.values():
            all_categories.update(month_data.keys())

        if not all_categories:
            await update.message.reply_text(
                "Belum ada pengeluaran dalam 3 bulan terakhir."
            )
            return

        # Build message
        msg = "📈 *Tren Pengeluaran — 3 Bulan Terakhir*\n\n"

        for cat in sorted(all_categories):
            amounts = [
                three_months[mk].get(cat, 0)
                for mk in sorted(three_months.keys(), reverse=True)
            ]
            total = sum(amounts)
            if total == 0:
                continue

            trend_line = " → ".join(
                fmt_currency(int(amt)) if amt > 0 else "—"
                for amt in amounts
            )

            # Determine trend
            if len(amounts) >= 2 and amounts[0] > 0 and amounts[1] > 0:
                change = ((amounts[0] - amounts[1]) / amounts[1]) * 100
                if change > 10:
                    arrow = "📈"
                elif change < -10:
                    arrow = "📉"
                else:
                    arrow = "→"
            else:
                arrow = "→"

            msg += f"{arrow} *{cat}*\n   {trend_line}\n"

        await update.message.reply_text(msg, parse_mode='Markdown')


# ── /splitbill ConversationHandler ───────────────────────────────────────────

SB_TOTAL, SB_PARTICIPANTS, SB_MODE, SB_AMOUNTS = range(10, 14)

APP_URL = os.getenv('APP_URL', 'https://gajianam.com')


async def splitbill_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "🍽️ *Split Bill*\n\nYuk mulai! Berapa total tagihan?\n\n"
        "Contoh: `150000` atau `1500000`\n\n"
        "Ketik /cancel untuk batal.",
        parse_mode='Markdown'
    )
    return SB_TOTAL


async def splitbill_get_total(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip().replace('.', '').replace(',', '')
    try:
        total = float(text)
        if total <= 0:
            raise ValueError
    except ValueError:
        await update.message.reply_text("Hmm, nominalnya gak kebaca nih 😅 Coba ketik lagi ya.")
        return SB_TOTAL

    context.user_data['sb_total'] = total
    await update.message.reply_text(
        f"Total: *Rp {int(total):,}*\n\n"
        "Siapa saja yang ikut? Pisah dengan koma.\n"
        "Contoh: `Andi, Budi, Sari`",
        parse_mode='Markdown'
    )
    return SB_PARTICIPANTS


async def splitbill_get_participants(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    names = [n.strip() for n in update.message.text.split(',') if n.strip()]
    if len(names) < 2:
        await update.message.reply_text("Minimal 2 peserta ya. Pisah nama dengan koma.")
        return SB_PARTICIPANTS

    context.user_data['sb_participants'] = names
    names_text = ', '.join(names)
    await update.message.reply_text(
        f"Peserta: *{names_text}*\n\n"
        "Pilih cara bagi:\n"
        "1️⃣ Rata (semua bayar sama)\n"
        "2️⃣ Custom (tiap orang beda)\n\n"
        "Balas dengan angka 1 atau 2.",
        parse_mode='Markdown'
    )
    return SB_MODE


async def splitbill_get_mode(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip()
    total = context.user_data.get('sb_total', 0)
    participants = context.user_data.get('sb_participants', [])

    if text == '1':
        share = total / len(participants)
        parts = [{'name': n, 'amount': round(share), 'paid': False} for n in participants]
        context.user_data['sb_parts'] = parts
        return await splitbill_save(update, context)

    elif text == '2':
        context.user_data['sb_custom_idx'] = 0
        context.user_data['sb_custom_amounts'] = []
        name = participants[0]
        await update.message.reply_text(
            f"Berapa yang harus dibayar *{name}*? (Rp)",
            parse_mode='Markdown'
        )
        return SB_AMOUNTS
    else:
        await update.message.reply_text("Balas 1 untuk Rata, 2 untuk Custom.")
        return SB_MODE


async def splitbill_get_amounts(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text.strip().replace('.', '').replace(',', '')
    try:
        amount = float(text)
    except ValueError:
        await update.message.reply_text("Ketik nominalnya aja ya.")
        return SB_AMOUNTS

    participants = context.user_data.get('sb_participants', [])
    amounts = context.user_data.get('sb_custom_amounts', [])
    idx = context.user_data.get('sb_custom_idx', 0)

    amounts.append({'name': participants[idx], 'amount': round(amount), 'paid': False})
    context.user_data['sb_custom_amounts'] = amounts
    context.user_data['sb_custom_idx'] = idx + 1

    if idx + 1 < len(participants):
        name = participants[idx + 1]
        await update.message.reply_text(
            f"Berapa yang harus dibayar *{name}*? (Rp)",
            parse_mode='Markdown'
        )
        return SB_AMOUNTS
    else:
        context.user_data['sb_parts'] = amounts
        return await splitbill_save(update, context)


async def splitbill_save(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = update.effective_user.id
    total = context.user_data.get('sb_total', 0)
    parts = context.user_data.get('sb_parts', [])
    session_name = f"Split Bill {update.effective_user.first_name}"

    async with AsyncSessionLocal() as session:
        record = await create_split_bill(session, user_id, session_name, total, parts)

    share_url = f"{APP_URL}/split/{record['share_token']}"
    msg = fmt_splitbill_result(session_name, parts, share_url)

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📋 Salin Link", callback_data=f"copy_split_{record['share_token']}")],
        [InlineKeyboardButton("✅ Catat ke Transaksi Saya", callback_data=f"record_split_{record['share_token']}")],
    ])

    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=keyboard)

    for key in ['sb_total', 'sb_participants', 'sb_mode', 'sb_parts', 'sb_custom_idx', 'sb_custom_amounts']:
        context.user_data.pop(key, None)

    return ConversationHandler.END


async def splitbill_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Split bill dibatalkan. Ketik /splitbill kapan saja untuk mulai lagi.")
    return ConversationHandler.END


def get_splitbill_handler() -> ConversationHandler:
    return ConversationHandler(
        entry_points=[CommandHandler('splitbill', splitbill_start)],
        states={
            SB_TOTAL:        [MessageHandler(filters.TEXT & ~filters.COMMAND, splitbill_get_total)],
            SB_PARTICIPANTS: [MessageHandler(filters.TEXT & ~filters.COMMAND, splitbill_get_participants)],
            SB_MODE:         [MessageHandler(filters.TEXT & ~filters.COMMAND, splitbill_get_mode)],
            SB_AMOUNTS:      [MessageHandler(filters.TEXT & ~filters.COMMAND, splitbill_get_amounts)],
        },
        fallbacks=[CommandHandler('cancel', splitbill_cancel)],
        per_message=False,
    )
