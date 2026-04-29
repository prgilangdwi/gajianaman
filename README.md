# 💰 FinTrack — Personal Finance Telegram Bot + Dashboard

> Track expenses via Telegram. Visualize with Streamlit. Powered by Claude Haiku AI categorization.

---

## 📁 Project Structure

```
fintrack/
├── bot/
│   ├── handlers/commands.py   ← All Telegram command handlers
│   └── main.py                ← Bot entry point
├── db/
│   ├── schema.sql             ← Run this in Supabase first
│   ├── database.py            ← DB connection (async + sync)
│   └── operations.py          ← All DB queries
├── services/
│   ├── categorizer.py         ← Claude Haiku AI categorizer
│   └── formatter.py           ← Message formatting utilities
├── scheduler/
│   └── weekly_report.py       ← Monday 08:00 push reports
├── dashboard/
│   └── app.py                 ← Streamlit dashboard
├── .env.example               ← Copy to .env and fill in
├── requirements.txt
├── railway.toml               ← Railway deploy config
└── Procfile
```

---

## 🚀 SETUP GUIDE (Step by Step)

### STEP 1 — Create Telegram Bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Follow prompts → you'll get a **BOT_TOKEN**
4. Save it

---

### STEP 2 — Create Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region: **Southeast Asia (Singapore)**
3. Set a strong DB password
4. Once created → go to **SQL Editor**
5. Paste contents of `db/schema.sql` → Run

6. Get your connection strings:
   - Go to **Settings → Database**
   - Copy **Connection String (URI)**
   - You need two formats:
     ```
     # Async (for bot)
     DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.[ref].supabase.co:5432/postgres
     
     # Sync (for dashboard + scheduler)
     DATABASE_URL_SYNC=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
     ```

---

### STEP 3 — Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Save as `ANTHROPIC_API_KEY`

---

### STEP 4 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
BOT_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_key
DATABASE_URL=postgresql+asyncpg://postgres:[pw]@db.[ref].supabase.co:5432/postgres
DATABASE_URL_SYNC=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres
```

---

### STEP 5 — Install Dependencies

```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

---

### STEP 6 — Test Locally

```bash
# Run the bot
python -m bot.main

# Run dashboard (separate terminal)
streamlit run dashboard/app.py

# Run scheduler (separate terminal)
python -m scheduler.weekly_report
```

Test in Telegram:
```
/start
/add 7500 beli jajan di warung
/summary
/budget food 500000
/history
```

---

### STEP 7 — Deploy to Railway (Production)

1. Go to [railway.app](https://railway.app) → New Project
2. Connect your GitHub repo (push this project first)
3. Add environment variables (same as .env)
4. Railway will auto-detect `railway.toml`

**Deploy 3 services:**

| Service | Start Command | Notes |
|---|---|---|
| Bot | `python -m bot.main` | Always-on |
| Dashboard | `streamlit run dashboard/app.py --server.port=$PORT --server.address=0.0.0.0` | Web URL |
| Scheduler | `python -m scheduler.weekly_report` | Cron worker |

**Free tier covers ~500 hours/month** — enough for bot + dashboard.

---

### STEP 8 — Deploy Dashboard to Streamlit Cloud (Alternative)

1. Push to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect repo → set main file: `dashboard/app.py`
4. Add secrets (same as .env) in Streamlit secrets manager
5. Deploy → get public URL

---

## 🤖 Bot Commands Reference

| Command | Format | Example |
|---|---|---|
| `/start` | — | Register + show menu |
| `/add` | `/add <nominal> <catatan>` | `/add 7500 beli jajan di warung` |
| `/income` | `/income <nominal> <catatan>` | `/income 5000000 gaji april` |
| `/summary` | — | Monthly summary |
| `/history` | — | Last 10 transactions |
| `/budget` | `/budget <kategori> <nominal>` | `/budget food 1000000` |
| `/goal` | — | View goals |
| `/goal add` | `/goal add <nama> <target>` | `/goal add Liburan 5000000` |

---

## 🧠 AI Categorization (Claude Haiku)

Input: `beli jajan di warung`

Output:
```json
{
  "category": "Food & Dining",
  "subcategory": "Street Food / Snacks",
  "type": "expense",
  "confidence": "high",
  "reason": "Kata 'jajan di warung' menunjukkan pembelian makanan di warung kecil."
}
```

**Supported categories:**
- Food & Dining, Groceries, Transport, Shopping
- Health, Entertainment, Bills & Utilities, Education
- Personal Care, Dining Out
- Salary, Freelance, Investment Return
- Savings, Investment

---

## 📊 Dashboard Pages

| Page | Content |
|---|---|
| 🏠 Overview | Income vs expense, daily spending bar, category pie |
| 💸 Pengeluaran | Category breakdown, expandable transaction detail |
| 🎯 Budget | Budget vs actual progress bars per category |
| 🏆 Goals | Savings goal progress bars with deadline |
| 📋 Riwayat | Filterable transaction history table |
| 📈 Tren | 3-month income/expense trend, category line chart |

---

## 💰 Monetization (SaaS Roadmap)

| Tier | Price | Features |
|---|---|---|
| Free | Rp 0 | 50 tx/month, basic summary |
| Pro | Rp 29.000/mo | Unlimited tx, dashboard, weekly report |
| Premium | Rp 59.000/mo | Multi-currency, goals, Excel export |
| White-label | Custom | Full rebrand, API access |

**Payment:** Integrate Midtrans for Indonesian payment gateway.

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Bot | python-telegram-bot v20 |
| AI | Claude Haiku (Anthropic) |
| API | FastAPI |
| Database | Supabase (PostgreSQL) |
| Dashboard | Streamlit + Plotly |
| Scheduler | APScheduler |
| Hosting | Railway |

---

## 📞 Support

Built by Gilang — SKINTIFIC Analytics Team
