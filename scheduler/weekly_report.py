# scheduler/weekly_report.py
# Sends weekly summary to all users every Monday 08:00 WIB

import os
import asyncio
import httpx
from datetime import date, timedelta
from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
DB_URL = os.getenv("DATABASE_URL_SYNC")

engine = create_engine(DB_URL)

TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"


def get_all_users():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT user_id, name FROM users"))
        return result.fetchall()


def get_weekly_summary(user_id: int):
    today = date.today()
    week_ago = today - timedelta(days=7)

    with engine.connect() as conn:
        # Total expense last 7 days
        total = conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions
            WHERE user_id = :uid AND type = 'expense'
              AND date BETWEEN :start AND :end
        """), {"uid": user_id, "start": week_ago, "end": today}).scalar()

        # Top 3 categories
        top_cats = conn.execute(text("""
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE user_id = :uid AND type = 'expense'
              AND date BETWEEN :start AND :end
            GROUP BY category
            ORDER BY total DESC
            LIMIT 3
        """), {"uid": user_id, "start": week_ago, "end": today}).fetchall()

    return float(total), top_cats


def format_weekly_message(name: str, total: float, top_cats: list) -> str:
    today = date.today()
    week_ago = today - timedelta(days=7)

    lines = [
        f"📅 *Laporan Mingguan FinTrack*",
        f"_{week_ago.strftime('%d %b')} – {today.strftime('%d %b %Y')}_\n",
        f"Halo, *{name}*! Ini ringkasan pengeluaranmu minggu ini:\n",
        f"💸 Total Pengeluaran: *Rp {int(total):,}*\n".replace(",", "."),
    ]

    if top_cats:
        lines.append("🏆 *Top Kategori:*")
        medals = ["🥇", "🥈", "🥉"]
        for i, cat in enumerate(top_cats):
            medal = medals[i] if i < len(medals) else "  "
            lines.append(f"  {medal} {cat.category}: Rp {int(cat.total):,}".replace(",", "."))

    lines.append("\nGunakan /summary untuk detail lengkap. 💪")
    return "\n".join(lines)


async def send_telegram_message(user_id: int, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(TELEGRAM_API, json={
            "chat_id": user_id,
            "text": text,
            "parse_mode": "Markdown"
        })


async def send_weekly_reports():
    users = get_all_users()
    print(f"[Scheduler] Sending weekly reports to {len(users)} users...")

    for user in users:
        try:
            total, top_cats = get_weekly_summary(user.user_id)
            msg = format_weekly_message(user.name, total, top_cats)
            await send_telegram_message(user.user_id, msg)
            print(f"[Scheduler] ✅ Sent to {user.user_id}")
        except Exception as e:
            print(f"[Scheduler] ❌ Failed for {user.user_id}: {e}")


def run_weekly():
    asyncio.run(send_weekly_reports())


if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Asia/Jakarta")
    # Every Sunday at 09:00 WIB
    scheduler.add_job(run_weekly, "cron", day_of_week="sun", hour=9, minute=0)
    print("⏰ Scheduler started — weekly reports every Sunday 09:00 WIB")
    scheduler.start()
