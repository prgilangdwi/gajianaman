# bot/handlers/commands.py

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from datetime import date

from db.database import AsyncSessionLocal
from db import operations as db
from services.categorizer import categorize_transaction
from services.formatter import (
    build_transaction_confirm,
    build_summary_message,
    build_history_message,
    fmt_currency
)


# ─────────────────────────────────────────
# /start
# ─────────────────────────────────────────
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")

    await update.message.reply_text(
        f"👋 Halo, *{user.first_name}*! Selamat datang di *FinTrack* 💰\n\n"
        "Aku akan bantu kamu catat dan pantau keuangan harian.\n\n"
        "📌 *Perintah tersedia:*\n"
        "/add — Catat pengeluaran\n"
        "/income — Catat pemasukan\n"
        "/summary — Ringkasan bulan ini\n"
        "/history — 10 transaksi terakhir\n"
        "/budget — Set budget kategori\n"
        "/goal — Lihat/tambah target tabungan\n"
        "/help — Bantuan\n\n"
        "Contoh: `/add 7500 beli jajan di warung`",
        parse_mode=ParseMode.MARKDOWN
    )


# ─────────────────────────────────────────
# /add — Log expense
# ─────────────────────────────────────────
async def cmd_add(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = update.message.text.strip()
    parts = text.split(" ", 2)

    if len(parts) < 3:
        await update.message.reply_text(
            "❌ Format salah.\n"
            "Gunakan: `/add <nominal> <keterangan>`\n"
            "Contoh: `/add 7500 beli jajan di warung`",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    # Parse amount
    try:
        raw_amount = parts[1].replace(",", "").replace(".", "").replace("k", "000")
        amount = float(raw_amount)
    except ValueError:
        await update.message.reply_text("❌ Nominal tidak valid. Contoh: `15000` atau `15k`", parse_mode=ParseMode.MARKDOWN)
        return

    note = parts[2]

    # Typing indicator
    await context.bot.send_chat_action(update.effective_chat.id, "typing")
    await update.message.reply_text("🔍 Menganalisis kategori dengan AI...")

    # Claude Haiku categorization
    result = categorize_transaction(note)

    # Save to DB
    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")
        await db.insert_transaction(
            session=session,
            user_id=user.id,
            amount=amount,
            tx_type=result["type"],
            category=result["category"],
            subcategory=result["subcategory"],
            note=note,
            confidence=result["confidence"]
        )

    # Build confirm message
    msg = build_transaction_confirm(amount, note, result)

    # If low confidence, offer correction keyboard
    keyboard = None
    if result["confidence"] == "low":
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("🍜 Food & Dining", callback_data=f"recat:Food & Dining"),
                InlineKeyboardButton("🛒 Groceries", callback_data=f"recat:Groceries"),
            ],
            [
                InlineKeyboardButton("🚗 Transport", callback_data=f"recat:Transport"),
                InlineKeyboardButton("🛍️ Shopping", callback_data=f"recat:Shopping"),
            ],
            [
                InlineKeyboardButton("💊 Health", callback_data=f"recat:Health"),
                InlineKeyboardButton("🎮 Entertainment", callback_data=f"recat:Entertainment"),
            ],
            [
                InlineKeyboardButton("📱 Bills", callback_data=f"recat:Bills & Utilities"),
                InlineKeyboardButton("📁 Other", callback_data=f"recat:Other"),
            ],
        ])
        msg += "\n\n⚠️ _Confidence rendah. Pilih kategori yang tepat:_"

    await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN, reply_markup=keyboard)


# ─────────────────────────────────────────
# /income — Log income
# ─────────────────────────────────────────
async def cmd_income(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = update.message.text.strip()
    parts = text.split(" ", 2)

    if len(parts) < 3:
        await update.message.reply_text(
            "❌ Format: `/income <nominal> <keterangan>`\n"
            "Contoh: `/income 5000000 gaji bulan ini`",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    try:
        amount = float(parts[1].replace(",", "").replace(".", "").replace("k", "000"))
    except ValueError:
        await update.message.reply_text("❌ Nominal tidak valid.")
        return

    note = parts[2]
    await context.bot.send_chat_action(update.effective_chat.id, "typing")

    result = categorize_transaction(note)
    result["type"] = "income"  # force income type

    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")
        await db.insert_transaction(
            session=session,
            user_id=user.id,
            amount=amount,
            tx_type="income",
            category=result["category"],
            subcategory=result["subcategory"],
            note=note,
            confidence=result["confidence"]
        )

    msg = build_transaction_confirm(amount, note, result)
    await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)


# ─────────────────────────────────────────
# /summary — Monthly summary
# ─────────────────────────────────────────
async def cmd_summary(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    today = date.today()

    await context.bot.send_chat_action(update.effective_chat.id, "typing")

    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")
        by_cat = await db.get_monthly_summary(session, user.id, today.month, today.year)
        total_income = await db.get_monthly_income(session, user.id, today.month, today.year)
        budget_rows = await db.get_budget_vs_actual(session, user.id, today.month, today.year)

    total_expense = sum(row.total for row in by_cat)

    msg = build_summary_message(
        user_name=user.first_name,
        month=today.month,
        year=today.year,
        total_income=float(total_income),
        total_expense=float(total_expense),
        by_category=by_cat,
        budget_rows=budget_rows if budget_rows else None
    )

    await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)


# ─────────────────────────────────────────
# /history — Last 10 transactions
# ─────────────────────────────────────────
async def cmd_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user

    async with AsyncSessionLocal() as session:
        txs = await db.get_last_transactions(session, user.id, 10)

    msg = build_history_message(txs)
    await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN)


# ─────────────────────────────────────────
# /budget — Set budget
# ─────────────────────────────────────────
async def cmd_budget(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = update.message.text.strip()
    parts = text.split(" ", 2)

    if len(parts) < 3:
        await update.message.reply_text(
            "❌ Format: `/budget <kategori> <nominal>`\n"
            "Contoh: `/budget food 500000`\n\n"
            "Kategori tersedia:\n"
            "food, groceries, transport, shopping,\n"
            "health, entertainment, bills, education",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    category_map = {
        "food": "Food & Dining",
        "groceries": "Groceries",
        "transport": "Transport",
        "shopping": "Shopping",
        "health": "Health",
        "entertainment": "Entertainment",
        "bills": "Bills & Utilities",
        "education": "Education",
        "other": "Other"
    }

    cat_key = parts[1].lower()
    category = category_map.get(cat_key, parts[1])

    try:
        amount = float(parts[2].replace(",", "").replace(".", "").replace("k", "000"))
    except ValueError:
        await update.message.reply_text("❌ Nominal tidak valid.")
        return

    today = date.today()
    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")
        await db.upsert_budget(session, user.id, category, amount, today.month, today.year)

    await update.message.reply_text(
        f"✅ Budget *{category}* untuk bulan ini:\n"
        f"🎯 {fmt_currency(amount)}\n\n"
        f"Gunakan /summary untuk melihat progress budget.",
        parse_mode=ParseMode.MARKDOWN
    )


# ─────────────────────────────────────────
# /goal — View/add savings goals
# ─────────────────────────────────────────
async def cmd_goal(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = update.message.text.strip()
    parts = text.split(" ", 3)

    async with AsyncSessionLocal() as session:
        await db.ensure_user(session, user.id, user.full_name, user.username or "")

        # /goal add <name> <target>
        if len(parts) >= 3 and parts[1].lower() == "add":
            try:
                name = parts[2]
                target = float(parts[3].replace(",", "").replace(".", "")) if len(parts) > 3 else 0
            except (ValueError, IndexError):
                await update.message.reply_text("❌ Format: `/goal add <nama> <target>`", parse_mode=ParseMode.MARKDOWN)
                return

            await db.upsert_goal(session, user.id, name, target)
            await update.message.reply_text(
                f"🎯 Goal *{name}* ditambahkan!\nTarget: {fmt_currency(target)}",
                parse_mode=ParseMode.MARKDOWN
            )
            return

        # /goal — view all
        goals = await db.get_goals(session, user.id)

    if not goals:
        await update.message.reply_text(
            "📭 Belum ada savings goal.\n"
            "Tambahkan dengan: `/goal add <nama> <target>`\n"
            "Contoh: `/goal add Liburan Bali 5000000`",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    lines = ["🏆 *Savings Goals:*\n"]
    for g in goals:
        pct = min((float(g.saved_amount) / float(g.target_amount) * 100), 100) if g.target_amount > 0 else 0
        bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
        lines.append(
            f"🎯 *{g.name}*\n"
            f"   {bar} {pct:.0f}%\n"
            f"   {fmt_currency(float(g.saved_amount))} / {fmt_currency(float(g.target_amount))}\n"
        )

    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


# ─────────────────────────────────────────
# /help
# ─────────────────────────────────────────
async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *FinTrack — Panduan Penggunaan*\n\n"
        "*/add <nominal> <catatan>*\n"
        "Catat pengeluaran. AI akan otomatis kategorikan.\n"
        "Contoh: `/add 7500 beli jajan di warung`\n\n"
        "*/income <nominal> <catatan>*\n"
        "Catat pemasukan.\n"
        "Contoh: `/income 5000000 gaji bulan april`\n\n"
        "*/summary*\n"
        "Lihat ringkasan keuangan bulan ini.\n\n"
        "*/history*\n"
        "10 transaksi terakhir.\n\n"
        "*/budget <kategori> <nominal>*\n"
        "Set budget per kategori.\n"
        "Contoh: `/budget food 1000000`\n\n"
        "*/goal*\n"
        "Lihat savings goals.\n\n"
        "*/goal add <nama> <target>*\n"
        "Tambah savings goal.\n"
        "Contoh: `/goal add Liburan 5000000`",
        parse_mode=ParseMode.MARKDOWN
    )
