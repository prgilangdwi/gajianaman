# 🚀 Gajian Aman — Claude Code Master Prompt
> Copy-paste ke Claude Code. Jalankan fitur per fitur atau sekaligus.

---

## KONTEKS PROYEK

Proyek: **Gajian Aman** — personal finance tracker untuk pengguna Indonesia.
Stack:
- Python backend (Telegram bot, Railway) — `python-telegram-bot v20`, Claude Haiku, SQLAlchemy async + asyncpg
- React frontend (Vercel) — Vite 6 + React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui + Recharts
- Database: Supabase PostgreSQL via PgBouncer (Transaction Pooler)
- Auth: Supabase Auth (Google OAuth) + Telegram ID login
- AI: Claude Haiku (`claude-haiku-4-5-20251001`)

**CRITICAL DB RULES (JANGAN DIUBAH):**
- Semua DB queries HANYA di `db/operations.py`
- Engine pakai `NullPool` + `prepared_statement_cache_size=0` + `statement_cache_size=0` — JANGAN revert
- Dua URL: `DATABASE_URL` (asyncpg untuk bot), `DATABASE_URL_SYNC` (psycopg2 untuk scheduler)
- Frontend: types di `frontend/src/lib/supabase.ts`, data fetching di `hooks/`, path alias `@` → `frontend/src/`

---

## FITUR 1 — SPLIT BILL (Web App + Telegram Bot)

### Spec
Buat fitur Split Bill yang AI-powered dengan kemampuan share hasil ke orang lain.

### Web App: `frontend/src/app/pages/SplitBill.tsx`

```
Implementasi:
1. Form input grup:
   - Nama sesi (e.g., "Makan Malam Tim 17 Mei")
   - Upload struk/foto → kirim ke `/api/parse-image.js` → auto-parse total amount
   - Input manual amount sebagai alternatif
   - Tambah peserta (nama + opsional nominal personal)
   
2. Mode split:
   - Equal split (bagi rata)
   - Custom split (input manual per orang)
   - Percentage split
   - Item-based split: input per item siapa yang pesan (AI bantu parse dari struk)

3. AI assist:
   - Gunakan Claude Haiku via Vercel serverless untuk:
     a. Parse struk foto → extract items + harga
     b. Suggest siapa bayar apa berdasarkan item

4. Hasil split:
   - Tampilkan ringkasan per orang: nama, jumlah yang harus dibayar
   - Tombol "Share" → generate public URL: `/split/{unique_id}`
   - Halaman publik `/split/[id].tsx` — bisa diakses tanpa login
   - Copy link ke clipboard
   - Share via WhatsApp (deep link wa.me)
   - QR Code sederhana (pakai library qrcode.react)

5. Simpan history split bill di tabel `split_bills` Supabase

6. Opsi "Catat ke Transaksi" → auto-create transaction entry untuk bagian user sendiri
```

### Database: tambah di `db/schema.sql`
```sql
CREATE TABLE split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id),
  session_name TEXT NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  participants JSONB NOT NULL,  -- [{name, amount, paid: bool}]
  items JSONB,                  -- [{name, price, assignee}] nullable
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Vercel serverless: `frontend/api/split-bill-ai.js`
```
POST endpoint:
- Input: { image_base64, items_text, participants }
- Proses: kirim ke Claude Haiku dengan prompt untuk:
  1. Extract semua item + harga dari struk
  2. Saran pembagian jika ada nama peserta
- Output: { items: [{name, price}], suggestions: [{person, items, subtotal}] }

Gunakan model: claude-haiku-4-5-20251001
Prompt harus ringan dan spesifik agar hemat token.
```

### Telegram Bot: tambah command `/splitbill`
```
File: bot/handlers/commands.py

/splitbill — mulai sesi split bill
Flow:
1. Bot tanya: "Berapa total tagihan?"
2. Bot tanya: "Siapa saja yang ikut? (pisah dengan koma)"
3. Bot tanya: "Mode split? (1) Rata (2) Custom"
4. Kalau custom: tanya nominal per orang
5. Bot kirim hasil split dalam format teks rapi
6. Tombol inline: [📋 Salin Link] [✅ Catat ke Transaksi Saya]
7. Link share → deep link ke web app /split/{token}

State management pakai ConversationHandler.
```

---

## FITUR 2 — FIX GOOGLE LOGIN

### Problem
User sudah link Google account ke Telegram ID di tabel `users`, tapi login Google tidak berfungsi — hanya login via Telegram ID yang jalan.

### Fix: `frontend/src/hooks/useAuth.tsx`

```
Yang perlu diperbaiki:

1. Setelah Google OAuth callback di /auth/callback:
   - Dapatkan Supabase session (user.email)
   - Query tabel users: SELECT user_id WHERE email = auth.email OR google_id = auth.id
   - Kalau ketemu → set gajian_aman_user di localStorage (sama persis format login Telegram)
   - Kalau tidak ketemu → redirect ke /link-telegram

2. Di AuthCallback.tsx:
   - Setelah supabase.auth.getSession() berhasil
   - Panggil fungsi checkUserByEmail(email) dari db/operations melalui Supabase client
   - Set user state dari hasil query

3. Tambah kolom ke tabel users jika belum ada:
   ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

4. Di LinkTelegram.tsx:
   - Setelah user input Telegram ID dan berhasil link
   - Update tabel users SET email = auth.email, google_id = auth.id WHERE user_id = input_telegram_id
   - Simpan ke localStorage
   - Redirect ke /

5. Pastikan RequireAuth.tsx cek KEDUA sumber: localStorage dan Supabase session aktif
```

### Python bot side (tidak perlu diubah, hanya validasi):
```
Pastikan /start handler menyimpan user dengan kolom email jika tersedia di future.
Tidak ada perubahan critical di bot untuk fitur ini.
```

---

## FITUR 3 — FIX BUDGET TABLE (belum dibuat = hide realized + label fix)

### File: `frontend/src/app/pages/Budget.tsx`

```
Perubahan logic:

1. Di komponen BudgetTable / BudgetRow:
   - Tambah kondisi: if (!budget || budget.amount === 0 || budget.amount === null)
     → jangan tampilkan kolom "Realisasi" / "Terpakai"
     → tampilkan label badge: "Belum Dibuat" (warna neutral/abu)
     → sembunyikan progress bar
     → tampilkan tombol "+ Buat Budget" di kolom status

2. Kalau budget sudah ada tapi 0 realisasi:
   → tetap tampilkan progress bar kosong (0%)
   → label: "Aman" (warna hijau)

3. Kalau realisasi > budget:
   → label: "Melebihi" (warna merah)

4. Kalau realisasi < budget:
   → label: "Aman" (warna hijau)

5. Logika label: HAPUS label "Aman" untuk kategori yang belum punya budget entry sama sekali
   Cara cek: join antara daftar kategori dengan tabel budgets WHERE month=X AND year=Y
   Kalau kategori tidak ada di hasil join → status = "Belum Dibuat"
```

---

## FITUR 4 — GOALS: TAMBAH KOLOM "HARUS NABUNG PER HARI"

### File: `frontend/src/app/pages/Goals.tsx`

```
Tambah computed field di bawah setiap goal card:

Formula:
  gap = target_amount - saved_amount
  hari_tersisa = Math.max(0, daysBetween(today, deadline))
  harus_per_hari = hari_tersisa > 0 ? Math.ceil(gap / hari_tersisa) : null

Tampilkan sebagai info row di bawah progress bar:
  📅 X hari lagi  |  💰 Nabung Rp Y/hari

Style:
- Kalau hari_tersisa = 0 atau deadline sudah lewat → tampilkan "⚠️ Deadline terlewat"
- Kalau gap ≤ 0 → tampilkan "✅ Target tercapai!"
- Kalau per_hari > 500.000 → warna merah (berat)
- Kalau per_hari ≤ 50.000 → warna hijau (santai)

Tidak perlu perubahan DB. Pure frontend calculation dari data goals yang sudah ada.
```

---

## FITUR 5 — FITUR GAJIAN (Tanggal Gajian + Risk Profile + AI Budget Rekomendasi)

### Database additions
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS payday_date INTEGER; -- 1-31
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_profile JSONB;  
-- {"type": "konservatif|moderat|agresif", "income": X, "dependents": N, "answers": {...}}
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_budget_recommendation JSONB;
-- {"categories": [{name, percentage, amount, rationale}], "generated_at": ISO}
```

### Web App: `frontend/src/app/pages/Gajian.tsx`
```
Sections:

1. ATUR TANGGAL GAJIAN
   - Input: pilih tanggal (1-31) atau "Akhir bulan"
   - Simpan ke users.payday_date via Supabase
   - Info: "Kamu akan dapat reminder di Telegram setiap tanggal X"

2. MINI FORM RISK PROFILE (tampil sekali, bisa diulang)
   Pertanyaan (5 step progress bar):
   Q1: "Berapa perkiraan pengeluaran wajibmu per bulan?" (Bills, cicilan, dll)
       → slider Rp 500rb - Rp 10jt
   Q2: "Kamu punya tanggungan?" → 0 / 1-2 / 3+
   Q3: "Kalau ada pengeluaran darurat Rp 2jt, kamu..." 
       → A) Bisa langsung bayar  B) Perlu pinjam dulu  C) Susah banget
   Q4: "Target finansial 1 tahun ke depan?"
       → A) Punya dana darurat  B) Beli sesuatu besar  C) Investasi  D) Bebas utang
   Q5: "Seberapa ketat kamu mau budgeting?"
       → A) Super ketat  B) Seimbang  C) Santai aja dulu

   Hasil profil: Konservatif / Moderat / Agresif
   Simpan ke users.risk_profile

3. AI BUDGET RECOMMENDATION (setelah form selesai)
   - Kirim ke Vercel serverless `/api/budget-recommendation.js`
   - Model: claude-haiku-4-5-20251001 (RINGAN, hemat cost)
   - Input: {risk_profile, monthly_income (dari transaksi income bulan ini), answers}
   - Output: rekomendasi alokasi per kategori dalam % dan Rp
   - Tampilkan sebagai tabel interaktif yang bisa diedit user
   - Tombol "Terapkan ke Budget" → auto-create budget entries untuk bulan ini

4. Serverless: `frontend/api/budget-recommendation.js`
   Prompt Claude Haiku yang HEMAT TOKEN:
   System: "Kamu advisor keuangan Indonesia. Return JSON only."
   User: "Income: {X}/bulan. Profil: {risk}. Tanggungan: {N}. 
          Buat alokasi budget bulanan 8 kategori utama. 
          Format: [{category, percentage, amount, tip_singkat}]"
   max_tokens: 500 (cukup untuk JSON 8 kategori)
```

### Telegram Bot: Scheduler payday reminder
```
File: scheduler/weekly_report.py (tambah job baru)

Tambah APScheduler job:
- Trigger: setiap hari jam 08:00 WIB
- Logic: query SELECT user_id, payday_date WHERE payday_date = hari_ini
- Kirim pesan ke setiap user yang cocok:
  "💰 Hei! Hari ini hari gajianmu. Jangan lupa catat income-mu ya!
   Ketik: /income [jumlah] gaji [bulan ini]
   Contoh: /income 5000000 gaji mei"
```

---

## FITUR 6 — WALLET / SUMBER DANA

### Database additions
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id),
  name TEXT NOT NULL,           -- "BCA", "OVO", "Cash", dll
  type TEXT NOT NULL,           -- 'bank' | 'ewallet' | 'cash'
  icon TEXT,                    -- emoji atau kode ikon
  is_primary BOOLEAN DEFAULT false,
  initial_balance NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id);
```

### Web App changes
```
1. Onboarding modal (muncul pertama kali, atau dari settings):
   "Dari mana uangmu berasal?"
   Pilihan cepat: BCA | Mandiri | BRI | BNI | GoPay | OVO | Dana | ShopeePay | Cash | Lainnya
   → Buat wallet entry, set is_primary = true

2. Filter bar di semua halaman transaksi:
   Sekarang: [Filter Bulan]
   Update ke: [Filter Bulan] [Filter Wallet: Semua | BCA | OVO | ...]
   
   Implementasi di useMonthFilter.tsx → extend jadi useFilters.tsx dengan:
   { month, year, walletId: 'all' | uuid }

3. Di TransactionModal.tsx:
   Tambah dropdown "Dari wallet mana?" sebelum simpan transaksi

4. Di Overview.tsx:
   Kalau wallet dipilih → aggregate hanya transaksi wallet tsb
   Tampilkan "Saldo estimasi wallet" = initial_balance + income - expense

5. Di db/operations.py:
   Tambah fungsi:
   - get_wallets(user_id)
   - create_wallet(user_id, name, type, is_primary, initial_balance)
   - get_transactions_by_wallet(user_id, wallet_id, month, year)
```

### Telegram Bot changes
```
bot/handlers/commands.py:
- Tambah parameter opsional ke /add dan /income:
  /add 25000 makan siang [wallet=gopay]
  → parse keyword "wallet=" atau "dari=" di akhir pesan
  → match ke wallets user, simpan wallet_id ke transaction
  
- Kalau user belum punya wallet → bot suggest: 
  "Kamu belum setup wallet. Ketik /wallet setup untuk mulai"

- /wallet command baru:
  /wallet → list semua wallet + saldo estimasi
  /wallet setup → guided setup wallet pertama
```

---

## FITUR 7 — KALENDER BULANAN + MINI SPENDING PER TANGGAL

### Web App: `frontend/src/app/pages/Kalender.tsx` (halaman baru)
```
Implementasi calendar view:

1. Grid kalender bulan (7 kolom x 5-6 baris)
   - Header: [Filter Bulan sama seperti halaman lain]
   
2. Setiap cell tanggal menampilkan:
   - Nomor tanggal (kiri atas)
   - Mini bar atau angka total pengeluaran (kalau ada)
   - Warna background intensitas berdasarkan spending amount (heatmap)
     → Tidak ada transaksi: putih
     → Rp 0-100rb: hijau muda
     → Rp 100-500rb: kuning
     → Rp 500rb+: merah muda
   
3. Klik tanggal → side panel / modal list transaksi di tanggal itu

4. Data source: useTransactions() yang sudah ada
   Group by date di frontend dengan reduce()
   Tidak perlu DB query baru

5. Di bawah kalender: summary row
   "Total bulan ini: Rp X | Hari termahal: Tgl Y (Rp Z)"

Tambah route di App.tsx: /kalender
Tambah ke sidebar Layout.tsx: icon ti-calendar, label "Kalender"
```

---

## FITUR 8 — IMPROVE PRICING MODEL (COST-EFFICIENT vs BUDGGT)

### Analisis kompetitor Budggt (dari screenshot):
```
Budggt: Rp 99.000/tahun (Starter) | Rp 149.000/tahun (Pro)
Mereka punya: AI credits system (350 credits gratis di Pro)

Gajian Aman improvement:
```

### Pricing model baru yang lebih cost-efficient

```
Model: AI usage dikendalikan dengan "Gajian Credits" system

Setiap operasi AI menghabiskan credits:
- Parse struk foto: 5 credits
- AI Budget Recommendation: 3 credits  
- AI Financial Advisor chat: 2 credits/pesan
- AI Report Analyzer: 4 credits

Ini lebih transparan dan cost-efficient daripada unlimited AI.
```

### Database
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_total_used INTEGER DEFAULT 0;

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id),
  amount INTEGER NOT NULL,       -- positif = topup, negatif = deduct
  reason TEXT NOT NULL,          -- 'subscription_starter' | 'scan_receipt' | dll
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Services: `services/credit_manager.py`
```python
async def check_and_deduct_credits(session, user_id: int, cost: int, reason: str) -> bool:
    """Return True jika credits cukup dan berhasil dikurangi"""
    # Query balance
    # Kalau cukup: kurangi + log
    # Kalau tidak: return False → trigger upgrade prompt
```

### Implementasi di bot
```
Sebelum setiap AI call di bot handlers:
  has_credits = await check_and_deduct_credits(session, user_id, cost=5, reason="scan_receipt")
  if not has_credits:
    await update.message.reply_text("Kamu kehabisan Gajian Credits 😅 Top up atau upgrade plan ya!")
    return
```

---

## FITUR 9 — DOWNLOAD LAPORAN KEUANGAN

### Vercel serverless: `frontend/api/generate-report.js`
```
POST endpoint:
Input: { user_id, month, year, wallet_id: 'all' | uuid, format: 'pdf' | 'csv' }

Process:
1. Query Supabase: ambil semua transaksi sesuai filter
2. Generate laporan sederhana

Untuk CSV (HEMAT, tanpa AI):
- Pakai simple string builder
- Format: Date, Category, Type, Amount, Note, Wallet
- Kembalikan sebagai file download

Untuk PDF summary (pakai Claude Haiku, HEMAT TOKEN):
- Hitung agregat: total income, total expense, top 3 kategori
- Kirim ke Claude Haiku dengan prompt singkat:
  "Buat ringkasan keuangan 3 paragraf berdasarkan data ini: {agregat}"
  max_tokens: 300
- Render HTML template sederhana dengan data + AI summary
- Convert ke PDF pakai puppeteer atau html-pdf (sudah tersedia di Vercel)

JANGAN generate PDF dengan AI row-by-row → sangat mahal.
AI hanya untuk NARRATIVE summary (1x call per download).
```

### Web App: tombol di halaman Riwayat.tsx
```
Tambah di header Riwayat:
[📥 Download] dropdown:
  - CSV bulan ini
  - PDF summary bulan ini
  - CSV semua waktu

Dialog download:
  Pilih bulan: [dropdown]
  Pilih wallet: [Semua] [BCA] [OVO] ...
  Format: [CSV] [PDF]
  [Download]
```

---

## FITUR 10 — SISTEM SUBSCRIPTION

### Database
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id),
  plan TEXT NOT NULL,           -- 'gratis' | 'starter' | 'komit'
  period TEXT NOT NULL,         -- 'monthly' | '3month' | '6month' | 'yearly'
  price_paid NUMERIC(10,2),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_ref TEXT,             -- referensi payment manual / Midtrans
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'gratis';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
```

### Plan definition
```
SI COBA-COBA (Gratis):
- Catat transaksi (unlimited manual)
- Dashboard dasar: Overview, Riwayat
- Budget 3 kategori saja
- 0 Gajian Credits (AI tidak tersedia)
- Tidak ada laporan download
- Tidak ada wallet tracking
- Tidak ada split bill

SI KOMIT NYATAT — Starter (Rp 9.900/bulan | Rp 27.000/3bln | Rp 49.000/6bln | Rp 89.000/tahun):
- Semua fitur dasar
- Wallet tracking (maks 3 wallet)
- Budget semua kategori
- Kalender heatmap
- Download CSV
- 20 Gajian Credits/bulan (reset tiap bulan)
- Split bill (maks 5 sesi/bulan)
- Laporan PDF

SI KOMIT NYATAT — Pro (Rp 19.900/bulan | Rp 54.000/3bln | Rp 99.000/6bln | Rp 169.000/tahun):
- Semua fitur Starter
- Wallet unlimited
- Split bill unlimited
- 60 Gajian Credits/bulan
- AI Budget Recommendation
- AI Financial Advisor
- Priority support
```

### Middleware: `services/subscription.py`
```python
PLAN_FEATURES = {
    'gratis': {'credits_monthly': 0, 'max_wallets': 0, 'split_bill_monthly': 0, ...},
    'starter': {'credits_monthly': 20, 'max_wallets': 3, 'split_bill_monthly': 5, ...},
    'pro': {'credits_monthly': 60, 'max_wallets': -1, 'split_bill_monthly': -1, ...},
}

async def check_feature_access(session, user_id: int, feature: str) -> bool:
    """Cek apakah user boleh akses fitur ini berdasarkan plan aktif"""
```

### Web App: `frontend/src/app/pages/Langganan.tsx`
```
Halaman subscription management:
- Tampilkan plan aktif + sisa hari
- Pilihan upgrade
- Gajian Credits balance + usage history
- Tombol upgrade → redirect ke payment (Midtrans atau manual transfer)

Payment method awal (MVP): Manual transfer
- User pilih plan → sistem buat payment instruction
- Admin konfirmasi → update subscription via Supabase dashboard
- Midtrans bisa diintegrasikan di fase berikutnya
```

---

## FITUR 11 — PRIVACY MODE (Hide Angka)

### Implementation: Global state + CSS

```
1. Buat context: frontend/src/hooks/usePrivacy.tsx
   State: { isHidden: boolean, toggle: () => void }
   Persist ke localStorage: 'gajian_aman_privacy'

2. Wrap di App.tsx dengan PrivacyProvider

3. Custom CSS class:
   .privacy-hidden {
     filter: blur(8px);
     user-select: none;
     pointer-events: none;
   }
   .privacy-hidden:hover { filter: blur(4px); } /* sedikit hint */

4. Komponen helper:
   // frontend/src/components/PrivacyAmount.tsx
   export function PrivacyAmount({ value, className }: { value: string, className?: string }) {
     const { isHidden } = usePrivacy()
     return (
       <span className={cn(isHidden && 'privacy-hidden', className)}>
         {value}
       </span>
     )
   }

5. Tombol di header/navbar (Layout.tsx):
   - Icon: mata terbuka (ti-eye) atau mata tertutup (ti-eye-off)
   - Toggle onClick={() => privacy.toggle()}
   - Tooltip: "Sembunyikan angka"

6. Apply PrivacyAmount ke SEMUA tampilan angka:
   - Overview.tsx: total income, total expense, saldo
   - Budget.tsx: amount, realisasi
   - Goals.tsx: saved, target
   - Riwayat.tsx: amount per transaksi
   - Wallet balance
```

---

## FITUR 12 — LANDING PAGE

### File: `frontend/src/app/pages/Landing.tsx` (atau `index.html` terpisah)

```
Design direction: 
- Dark/light dual tone — hitam dan teal-green sebagai aksen
- Tone: santai tapi profesional, bahasa Indonesia gaul tapi rapi
- Referensi visual: InvestCO screenshot (dark mode finance dashboard aesthetic)

Sections:

1. HERO
   Headline: "Udah gajian, tapi duit ke mana?"
   Subheadline: "Catat, pantau, dan kelola keuanganmu dari Telegram & Web. Simple banget."
   CTA: [Coba Gratis] [Lihat Demo]
   Visual: mockup dashboard di kanan (screenshot or animated)

2. HOW IT WORKS (3 steps)
   Step 1: Kirim pesan ke bot Telegram
   Step 2: AI langsung kategoriin otomatis
   Step 3: Buka dashboard, lihat laporan lengkap
   → Animated step progression

3. FITUR UNGGULAN (card grid)
   - 📸 Scan Struk → langsung tercatat
   - 🤖 AI Kategorisasi otomatis
   - 💰 Split Bill bareng temen
   - 📊 Laporan bulanan instan
   - 🎯 Goals & Budget tracker
   - 👜 Multi-wallet support

4. COMPARISON SECTION
   Style mirip Budggt "Yuk bandingin" tapi versi Gajian Aman:
   vs Spreadsheet | vs Catatan HP | vs Buku Tulis
   Gajian Aman: lebih rapi, otomatis, ada AI

5. PRICING
   3 kolom: Gratis | Starter | Pro
   Dengan toggle bulanan/tahunan
   CTA per tier

6. SOCIAL PROOF
   Testimoni (placeholder untuk MVP), rating bintang

7. FAQ (accordion)

8. CTA FOOTER
   "Mulai gratis sekarang. Gak perlu kartu kredit."
   [Mulai Sekarang]

Route: / (homepage, sebelum login)
Setelah login → redirect ke /overview
```

---

## FITUR 13 — REVAMP COPYWRITING (Tone: Gojek/Grab Indonesia Style)

### Tone guidelines
```
- Sapaan: "kamu" bukan "Anda"
- Casual tapi informatif: "Hei!", "Yuk", "Udah", "Gak", "Banget"
- Angka selalu pakai format Rupiah: "Rp 150.000" bukan "150000"
- Error messages: jangan kaku, kasih solusi langsung
- Empty states: encouraging, bukan bland
```

### Bot messages (`services/formatter.py` + semua handler)
```
SEBELUM → SESUDAH:

"Transaksi berhasil ditambahkan" 
→ "✅ Catat! Pengeluaran Rp {amount} untuk {category} udah masuk ya."

"Error: Invalid amount"
→ "Hmm, nominalnya gak kebaca nih 😅 Coba ketik ulang ya. Contoh: /add 25000 makan siang"

"Weekly summary"
→ "📊 Rekap Mingguan kamu udah siap! Minggu ini kamu habis {X} total."

"Budget exceeded"
→ "⚠️ Ups! Budget {kategori}-mu udah mepet nih ({persen}% terpakai). Saatnya rem dikit?"

"Goal reminder"
→ "🎯 Update goal {nama}: kamu butuh nabung Rp {perhari}/hari biar bisa tercapai sebelum {deadline}!"

"Payday reminder"
→ "💰 Hei! Hari ini hari gajian kan? Jangan lupa catat income-mu biar keuangan makin terpantau!"

"No transactions found"
→ "Belum ada catatan bulan ini. Yuk mulai catat pengeluaran pertamamu!"
```

### Web App UI strings (buat file `frontend/src/lib/copy.ts`)
```typescript
export const COPY = {
  emptyStates: {
    transactions: "Belum ada transaksi. Yuk catat yang pertama!",
    budget: "Budget belum dibuat. Atur sekarang biar keuangan lebih terarah.",
    goals: "Belum ada goals. Mulai tentukan target finansialmu!",
    wallets: "Belum ada wallet. Tambah sumber dana kamu dulu ya.",
  },
  success: {
    transactionAdded: "✅ Transaksi berhasil dicatat!",
    budgetSaved: "Budget disimpan. Semangat nabung!",
    goalCreated: "Goal baru dibuat. You got this! 💪",
  },
  errors: {
    generic: "Ups, ada yang error nih. Coba lagi ya.",
    noConnection: "Koneksi terputus. Cek internet kamu dulu.",
    sessionExpired: "Sesimu habis. Login lagi yuk.",
  },
  labels: {
    income: "Pemasukan",
    expense: "Pengeluaran",
    savings: "Tabungan",
    budget: "Anggaran",
    remaining: "Sisa",
    spent: "Terpakai",
    overview: "Ringkasan",
    history: "Riwayat",
    trends: "Tren",
    goals: "Tujuan",
    calendar: "Kalender",
    splitBill: "Split Bill",
    payday: "Gajian",
    wallet: "Dompet",
  }
}
```

---

## URUTAN PENGERJAAN YANG DISARANKAN

```
PRIORITAS TINGGI (bug fix + quick win):
1. Fitur 2 — Fix Google Login (bug, harus fix dulu)
2. Fitur 3 — Fix Budget label "Belum Dibuat"
3. Fitur 4 — Goals: tambah kolom nabung/hari
4. Fitur 11 — Privacy mode (1-2 jam, high impact)
5. Fitur 13 — Revamp copywriting (no code, just strings)

PRIORITAS MENENGAH (fitur baru ringan):
6. Fitur 7 — Kalender heatmap
7. Fitur 9 — Download laporan CSV dulu (PDF belakangan)
8. Fitur 6 — Wallet (DB + UI)

PRIORITAS TINGGI BISNIS:
9. Fitur 12 — Landing page (mulai jualan)
10. Fitur 10 — Sistem subscription + plan gating
11. Fitur 8 — Credits system

FITUR KOMPLEKS (kerjakan terakhir):
12. Fitur 5 — Gajian + Risk Profile + AI Budget
13. Fitur 1 — Split Bill (paling kompleks)
```

---

## NOTES PENTING UNTUK CLAUDE CODE

```
1. JANGAN ubah NullPool dan PgBouncer settings di db/database.py

2. Setiap fungsi DB baru → tambah ke db/operations.py saja

3. Setiap type baru → tambah ke frontend/src/lib/supabase.ts

4. Semua API call ke Claude Haiku di frontend → via Vercel serverless (/api/*.js)
   JANGAN expose ANTHROPIC_API_KEY ke client-side code

5. Cost optimization untuk AI calls:
   - Selalu set max_tokens serendah mungkin yang masih cukup
   - Gunakan claude-haiku-4-5-20251001 (BUKAN Sonnet atau Opus)
   - Batch request kalau memungkinkan
   - Cache hasil AI recommendation (simpan ke DB, jangan generate ulang tiap load)

6. Fitur yang butuh subscription check → gunakan services/subscription.py
   Jangan hardcode plan check di handler langsung

7. Semua string user-facing → dari COPY object di frontend/src/lib/copy.ts
   Bot messages → dari fungsi di services/formatter.py
```
