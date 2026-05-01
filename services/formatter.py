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
        "*📁 Pengeluaran per Kategori:*"
    ]

    for row in by_category:
        icon = category_icon(row.category)
        lines.append(f"  {icon} {row.category}: {fmt_currency(row.total, currency)}")

    if budget_rows:
        lines.append("\n─" * 28)
        lines.append("*🎯 Budget vs Aktual:*")
        for b in budget_rows:
            pct = (b.actual / b.budget * 100) if b.budget > 0 else 0
            bar = progress_bar(pct)
            status = "🔴" if pct > 100 else ("🟡" if pct > 80 else "🟢")
            lines.append(
                f"  {status} {b.category}\n"
                f"     {bar} {pct:.0f}%\n"
                f"     {fmt_currency(b.actual)} / {fmt_currency(b.budget)}"
            )

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

    lines = ["📋 *Riwayat Transaksi Terakhir:*\n"]
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
