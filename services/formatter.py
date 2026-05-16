# services/formatter.py
# Utility functions for formatting Telegram messages

from datetime import date
import calendar


def fmt_currency(amount: float, currency: str = "IDR") -> str:
    if currency == "IDR":
        return f"Rp {int(amount):,}".replace(",", ".")
    return f"{currency} {amount:,.2f}"


def fmt_date(d: date) -> str:
    return d.strftime("%d %b %Y")


def confidence_badge(confidence: str) -> str:
    return {"high": "✅", "medium": "⚠️", "low": "❓"}.get(confidence, "✅")


def category_icon(category: str) -> str:
    icons = {
        "Food & Dining": "🍜",
        "Groceries": "🛒",
        "Transport": "🚗",
        "Shopping": "🛍️",
        "Health": "💊",
        "Entertainment": "🎮",
        "Bills & Utilities": "📱",
        "Education": "📚",
        "Personal Care": "💆",
        "Dining Out": "🍽️",
        "Salary": "💼",
        "Freelance": "💻",
        "Investment Return": "📈",
        "Other Income": "💰",
        "Savings": "🏦",
        "Investment": "📊",
        "Other": "📁",
    }
    return icons.get(category, "📁")


def build_summary_message(
    user_name: str,
    month: int,
    year: int,
    total_income: float,
    total_expense: float,
    by_category: list,
    budget_rows: list = None,
    currency: str = "IDR"
) -> str:
    month_name = calendar.month_name[month]
    net = total_income - total_expense

    lines = [
        f"📊 *Ringkasan {month_name} {year}*",
        f"Halo, {user_name}! Berikut laporan keuanganmu.\n",
        f"💚 Pemasukan   : {fmt_currency(total_income, currency)}",
        f"🔴 Pengeluaran : {fmt_currency(total_expense, currency)}",
        f"{'💰' if net >= 0 else '⚠️'} Saldo Bersih  : {fmt_currency(net, currency)}\n",
        "─" * 28,
        "*📁 Pengeluaran per Kategori:*",
    ]

    for row in by_category:
        icon = category_icon(row.category)
        lines.append(f"  {icon} {row.category}: {fmt_currency(row.total, currency)}")

    if budget_rows:
        lines.append("─" * 28)
        lines.append("*🎯 Budget vs Aktual:*")
        for b in budget_rows:
            pct = (b.actual / b.budget * 100) if b.budget > 0 else 0
            bar = progress_bar(pct)
            status = "🔴" if pct > 100 else ("🟡" if pct > 80 else "🟢")
            lines.append(f"  {status} *{b.category}*")
            lines.append(f"     {bar} {pct:.0f}%")
            lines.append(f"     {fmt_currency(b.actual)} / {fmt_currency(b.budget)}")

    return "\n".join(lines)


def build_daily_summary_message(
    user_name: str,
    target_date: date,
    total_income: float,
    total_expense: float,
    by_category: list,
    currency: str = "IDR"
) -> str:
    net = total_income - total_expense
    date_label = target_date.strftime("%d %B %Y")

    lines = [
        f"📊 *Ringkasan Harian — {date_label}*",
        f"Halo, {user_name}!\n",
        f"💚 Pemasukan   : {fmt_currency(total_income, currency)}",
        f"🔴 Pengeluaran : {fmt_currency(total_expense, currency)}",
        f"{'💰' if net >= 0 else '⚠️'} Saldo Bersih  : {fmt_currency(net, currency)}\n",
    ]

    if by_category:
        lines.append("─" * 28)
        lines.append("*📁 Pengeluaran per Kategori:*")
        for row in by_category:
            icon = category_icon(row.category)
            lines.append(f"  {icon} {row.category}: {fmt_currency(row.total, currency)}")
    else:
        lines.append("_Tidak ada transaksi pada tanggal ini._")

    return "\n".join(lines)


def build_transaction_confirm(
    amount: float,
    note: str,
    result: dict,
    currency: str = "IDR"
) -> str:
    badge = confidence_badge(result["confidence"])
    icon = category_icon(result["category"])
    tx_type = "Pengeluaran" if result["type"] == "expense" else "Pemasukan"

    return (
        f"{badge} *Transaksi Dicatat!*\n\n"
        f"💸 Nominal     : {fmt_currency(amount, currency)}\n"
        f"📋 Jenis       : {tx_type}\n"
        f"{icon} Kategori    : {result['category']}\n"
        f"🏷️ Sub-Kategori: {result['subcategory']}\n"
        f"📝 Catatan     : {note}\n"
        f"💡 Alasan AI   : _{result['reason']}_"
    )


def build_history_message(transactions: list, currency: str = "IDR") -> str:
    if not transactions:
        return "📭 Belum ada transaksi."

    lines = ["📋 *Riwayat Transaksi:*\n"]
    for i, tx in enumerate(transactions, 1):
        icon = "🔴" if tx.type == "expense" else "💚"
        cat_icon = category_icon(tx.category)
        lines.append(
            f"*{i}.* {icon} {fmt_currency(float(tx.amount), currency)}\n"
            f"   {cat_icon} {tx.category}  •  📅 {fmt_date(tx.date)}\n"
            f"   📝 {tx.note or '-'}"
        )
    return "\n".join(lines)


def progress_bar(pct: float, length: int = 10) -> str:
    filled = min(int(pct / 100 * length), length)
    empty = length - filled
    return "█" * filled + "░" * empty


def fmt_transaction_added(amount: float, category: str, currency: str = "IDR") -> str:
    icon = category_icon(category)
    return (
        f"✅ Catat! Pengeluaran {fmt_currency(amount, currency)} "
        f"untuk {icon} {category} udah masuk ya."
    )


def fmt_income_added(amount: float, category: str, currency: str = "IDR") -> str:
    return (
        f"💚 Mantap! Pemasukan {fmt_currency(amount, currency)} "
        f"dari {category} berhasil dicatat."
    )


def fmt_invalid_amount() -> str:
    return (
        "Hmm, nominalnya gak kebaca nih 😅 Coba ketik ulang ya.\n"
        "Contoh: /add 25000 makan siang"
    )


def fmt_no_transactions() -> str:
    return "Belum ada catatan bulan ini. Yuk mulai catat pengeluaran pertamamu!"


def fmt_budget_warning(category: str, pct: float) -> str:
    return (
        f"⚠️ Ups! Budget {category}-mu udah mepet nih "
        f"({pct:.0f}% terpakai). Saatnya rem dikit?"
    )


def fmt_budget_over(category: str, pct: float) -> str:
    return (
        f"🔴 Aduh! Budget {category} udah kelewat nih "
        f"({pct:.0f}% terpakai). Hati-hati ya pengeluarannya!"
    )


def fmt_payday_reminder() -> str:
    return (
        "💰 Hei! Hari ini hari gajian kan? Jangan lupa catat income-mu "
        "biar keuangan makin terpantau!\n\n"
        "Ketik: /income [jumlah] gaji [bulan ini]\n"
        "Contoh: /income 5000000 gaji bulan ini"
    )


def fmt_wallet_list(wallets: list, currency: str = "IDR") -> str:
    if not wallets:
        return (
            "Kamu belum punya wallet nih. "
            "Ketik /wallet setup untuk tambah wallet pertamamu!"
        )
    lines = ["👜 *Daftar Wallet kamu:*\n"]
    for w in wallets:
        primary = " ⭐" if w.get('is_primary') else ""
        balance = fmt_currency(w.get('balance', 0), currency)
        lines.append(f"  • *{w['name']}*{primary} — {balance}")
    return "\n".join(lines)


def fmt_splitbill_result(session_name: str, participants: list, share_url: str, currency: str = "IDR") -> str:
    lines = [f"🍽️ *Split Bill: {session_name}*\n"]
    for p in participants:
        lines.append(f"  • {p['name']}: {fmt_currency(p['amount'], currency)}")
    lines.append(f"\n🔗 Link share: {share_url}")
    return "\n".join(lines)


def fmt_goal_reminder(goal_name: str, per_day: float, deadline: str, currency: str = "IDR") -> str:
    return (
        f"🎯 Update goal *{goal_name}*: kamu butuh nabung "
        f"{fmt_currency(per_day, currency)}/hari biar bisa tercapai sebelum {deadline}!"
    )


def fmt_weekly_summary(user_name: str, total_expense: float, currency: str = "IDR") -> str:
    return (
        f"📊 Rekap Mingguan kamu udah siap, {user_name}! "
        f"Minggu ini kamu habis {fmt_currency(total_expense, currency)} total."
    )
