# bot/handlers/commands.py

import re
import calendar
from functools import wraps
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from datetime import date

from db.database import AsyncSessionLocal
from db import operations as db
from services.categorizer import categorize_transaction
from services.formatter import (
    build_transaction_confirm,
    fmt_currency,
)

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
    """Parse Indonesian amount strings: 15000, 15k, 15rb, 15ribu, 1.5jt, 2juta."""
    raw = raw.strip().lower().replace(" ", "")
    if raw.endswith("juta") or raw.endswith("jt"):
        num = re.sub(r"(juta|jt)$", "", raw).replace(",", ".")
        return float(num) * 1_000_000
    if raw.endswith("ribu") or raw.endswith("rb") or raw.endswith("k"):
        num = re.sub(r"(ribu|rb|k)$", "", raw).replace(",", ".")
        return float(num) * 1_000
    return float(raw.replace(",", "").replace(".", ""))


def parse_backdate(note: str):
    """Extract optional @DD/MM or @DD/MM/YYYY from end of note.

    Returns (cleaned_note, date_or_None).
    """
    m = re.search(r'\s*@(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?\s*$', note)
    if not m:
        return note.strip(), None
    day, month, year_raw = int(m.group(1)), int(m.group(2)), m.group(3)
    year = date.today().year
    if year_raw:
        year = int(year_raw)
        if year < 100:
            year += 2000
    try:
        tx_date = datetime(year, month, day).date()
    except ValueError:
        return note.strip(), None
    cleaned = note[:m.start()].strip()
    return cleaned, tx_date


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
        await db.ensure_user(session, user.id, user.full_name, user.username or "")
        stats = await db.get_today_stats(session, user.id) if existing else None

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
            "1️⃣ *Catat pengeluaran:*\n"
            "   `/add 15000 beli kopi`\n"
            "   Format nominal: `15k` · `15rb` · `15ribu` · `1.5jt` · `2juta`\n\n"
            "2️⃣ *Catat pemasukan:*\n"
            "   `/income 5jt gaji bulan ini`\n\n"
            "3️⃣ *Cek ringkasan:*\n"
            "   `/summary` → pilih bulanan atau harian\n\n"
            "4️⃣ *Set budget mudah:*\n"
            "   `/quickbudget` → pilih kategori & nominal\n\n"
            "💡 *Tips:* Bisa juga ketik langsung tanpa command!\n"
            "   Contoh: `beli makan siang 25000`\n\n"
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
            "❌ *Format salah.*\n\n"
            "Gunakan: `/add <nominal> <keterangan>`\n"
            "Contoh: `/add 7500 beli jajan di warung`\n\n"
            "*Format nominal:*\n"
            "• `15000` → Rp 15.000\n"
            "• `15k` atau `15rb` atau `15ribu` → Rp 15.000\n"
            "• `1.5jt` atau `1juta` atau `1jt` → Rp 1.500.000\n\n"
            "*Backdated (opsional):*\n"
            "• `/add 50000 makan siang @15/04` → tanggal 15 April",
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
            "❌ *Format salah.*\n\n"
            "Gunakan: `/income <nominal> <keterangan>`\n"
            "Contoh: `/income 5jt gaji bulan ini`\n\n"
            "*Format nominal:*\n"
            "• `5000000` · `5jt` · `5juta` → Rp 5.000.000\n"
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
            "❌ *Format salah.*\n\n"
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
    parts = update.message.text.strip().split(" ", 3)

    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")

        if len(parts) >= 3 and parts[1].lower() == "add":
            try:
                name = parts[2]
                target = parse_amount(parts[3]) if len(parts) > 3 else 0
            except (ValueError, IndexError):
                await update.message.reply_text(
                    "❌ Format: `/goal add <nama> <target>`\n"
                    "Contoh: `/goal add Liburan Bali 5jt`",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return

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
        "📅 *Backdated:* tambahkan `@DD/MM` di akhir keterangan\n"
        "_Contoh: `/add 50k makan @15/04`_",
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
