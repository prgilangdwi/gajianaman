# scheduler/weekly_report.py
# Weekly summaries + 5x daily reminder push notifications

import os
import random
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

# ─────────────────────────────────────────
# Reminder message pools (casual, time-specific)
# ─────────────────────────────────────────
REMINDER_MESSAGES = {
    "morning": [
        "☕ Pagi produktif! Udah beli kopi belum? Jangan lupa langsung catat begitu bayar ya~ 📝",
        "🌅 Good morning! Sarapan dulu dong, dan jangan lupa catat pengeluarannya supaya nggak bocor 😄",
        "🏃 Heyy! Sebelum hari makin sibuk, sempatin catat transaksi pagi ini — transport, sarapan, kopi, semua masuk ya!",
        "☀️ Mulai hari yang baik dengan catatan keuangan yang rapi! Ayo catat pengeluaran pagi ini 💪",
        "🍳 Selamat pagi! Apapun yang udah kamu beli tadi pagi, langsung dicatat biar nggak lupa. Sedikit-sedikit lama-lama jadi bukit~ 😊",
    ],
    "lunch": [
        "🍜 Waktunya makan siang! Abis bayar, langsung /add ya biar laporan bulannya akurat 🤌",
        "🥘 Lunch time! Mau makan di mana nih? Apapun pilihannya, jangan lupa catat ya hehe 😄",
        "🍱 Eh udah lapar? Sebelum makan, inget dulu — catat terus setiap transaksi biar kamu tau perginya uang ke mana!",
        "🫕 Makan siang dulu yuk! Dan jangan lupa, nasi kotak atau warteg sekalipun tetap wajib dicatat 📊",
        "🍛 Saatnya istirahat dan makan siang! PS: kalau ada yang belum tercatat dari tadi pagi, sekarang saatnya update ya~ 📝",
    ],
    "afternoon": [
        "☕ Mulai ngantuk? Waktunya ngopi sore! Dan jangan lupa catat itu juga ya hehe 🫖",
        "🧋 Jajan sore nih! Bubble tea, kopi, atau snack? Apapun, langsung /add biar catatan tetap up-to-date 😊",
        "🍩 Sore-sore enaknya ngemil! Catat dulu ya sebelum lupa. Lama-lama ngemil bisa jadi pengeluaran terbesar loh 👀",
        "🥤 Reminder sore: cek lagi dong transaksi hari ini. Ada yang ketinggalan belum masuk? Sekarang saatnya catat!",
        "🌤️ Sore nih! Sebelum keasyikan santai, luangin 30 detik buat catat pengeluaran yang belum masuk ya~ 💚",
    ],
    "evening": [
        "🌆 Udah mau pulang? Jangan lupa catat ongkos transport dan makan malam ya! Jangan sampai bocor tanpa sadar 💸",
        "🚌 Jam pulang kerja! Ongkos + makan malam wajib tercatat. Yuk /add sekarang sebelum capek dan lupa 😄",
        "🍽️ Dinner time is coming! Mau masak atau makan di luar? Apapun pilihannya, catat terus ya biar report bulannya akurat~",
        "🌇 Sore menjelang malam, saatnya recap! Udah catat pengeluaran hari ini belum? Jangan sampai ada yang kelewat 👀",
        "🏠 On the way home? Inget ya, ongkos pulang juga pengeluaran yang harus dicatat! Kecil-kecil tapi nyata 💪",
    ],
    "night": [
        "🌙 Malam dah! Sebelum tidur, coba deh review transaksi hari ini. Ada yang ketinggalan belum dicatat? 📝",
        "⭐ Good evening! Ayo recap dulu pengeluaran hari ini. Kalau ada yang belum masuk, sekarang saatnya catat biar besok fresh start!",
        "📊 Mau tidur? Tunggu dulu! Cek dulu sudah catat semua transaksi hari ini belum? Let's keep that record clean ✨",
        "🌠 Sebelum mata terpejam, cek sekali lagi catatan keuangan hari ini ya. Konsisten mencatat = financial goals makin dekat! 🎯",
        "💤 Recap malam: berapa total pengeluaran hari ini? Kalau belum tau, artinya ada yang belum dicatat nih~ Yuk /summary buat cek! 😄",
    ],
}


# ─────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────
def get_all_users():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT user_id, name FROM users"))
        return result.fetchall()


def get_weekly_summary(user_id: int):
    today = date.today()
    week_ago = today - timedelta(days=7)

    with engine.connect() as conn:
        total = conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions
            WHERE user_id = :uid AND type = 'expense'
              AND date BETWEEN :start AND :end
        """), {"uid": user_id, "start": week_ago, "end": today}).scalar()

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


# ─────────────────────────────────────────
# Message builders
# ─────────────────────────────────────────
def format_weekly_message(name: str, total: float, top_cats: list) -> str:
    today = date.today()
    week_ago = today - timedelta(days=7)

    lines = [
        f"📅 *Laporan Mingguan Gajian Aman*",
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


def format_reminder(slot: str, name: str) -> str:
    msg = random.choice(REMINDER_MESSAGES[slot])
    # Personalise every other message
    if random.random() < 0.4:
        msg = f"Hey {name}! " + msg[msg.index(" ") + 1:] if " " in msg else msg
    return msg


# ─────────────────────────────────────────
# Telegram sender
# ─────────────────────────────────────────
async def send_telegram_message(user_id: int, text: str):
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(TELEGRAM_API, json={
            "chat_id": user_id,
            "text": text,
            "parse_mode": "Markdown",
        })


# ─────────────────────────────────────────
# Broadcast jobs
# ─────────────────────────────────────────
async def _broadcast(slot: str):
    users = get_all_users()
    print(f"[Scheduler] Sending '{slot}' reminders to {len(users)} users...")
    for user in users:
        try:
            msg = format_reminder(slot, user.name)
            await send_telegram_message(user.user_id, msg)
            print(f"[Scheduler] ✅ {slot} → {user.user_id}")
        except Exception as e:
            print(f"[Scheduler] ❌ {slot} failed for {user.user_id}: {e}")


async def send_weekly_reports():
    users = get_all_users()
    print(f"[Scheduler] Sending weekly reports to {len(users)} users...")
    for user in users:
        try:
            total, top_cats = get_weekly_summary(user.user_id)
            msg = format_weekly_message(user.name, total, top_cats)
            await send_telegram_message(user.user_id, msg)
            print(f"[Scheduler] ✅ Weekly → {user.user_id}")
        except Exception as e:
            print(f"[Scheduler] ❌ Weekly failed for {user.user_id}: {e}")


def run_weekly():       asyncio.run(send_weekly_reports())
def run_morning():      asyncio.run(_broadcast("morning"))
def run_lunch():        asyncio.run(_broadcast("lunch"))
def run_afternoon():    asyncio.run(_broadcast("afternoon"))
def run_evening():      asyncio.run(_broadcast("evening"))
def run_night():        asyncio.run(_broadcast("night"))


# ─────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────
if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Asia/Jakarta")

    # Weekly summary — every Sunday 09:00 WIB
    scheduler.add_job(run_weekly,    "cron", day_of_week="sun", hour=9,  minute=0)

    # Daily reminders — every day at these times WIB
    scheduler.add_job(run_morning,   "cron", hour=9,  minute=0)   # 09:00 — coffee / breakfast
    scheduler.add_job(run_lunch,     "cron", hour=12, minute=0)   # 12:00 — lunch
    scheduler.add_job(run_afternoon, "cron", hour=15, minute=0)   # 15:00 — afternoon snack
    scheduler.add_job(run_evening,   "cron", hour=18, minute=0)   # 18:00 — dinner / commute
    scheduler.add_job(run_night,     "cron", hour=21, minute=0)   # 21:00 — evening recap

    print("⏰ Scheduler started:")
    print("   📅 Weekly summary   → every Sunday 09:00 WIB")
    print("   ☀️  Morning reminder → daily 09:00 WIB")
    print("   🍜 Lunch reminder   → daily 12:00 WIB")
    print("   ☕ Afternoon nudge  → daily 15:00 WIB")
    print("   🌆 Evening reminder → daily 18:00 WIB")
    print("   🌙 Night recap      → daily 21:00 WIB")
    scheduler.start()
