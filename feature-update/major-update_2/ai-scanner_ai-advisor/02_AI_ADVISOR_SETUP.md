# 02 · AI Advisor — Setup Baru (Claude Haiku Primary + Sonnet Fallback)

## Ringkasan

| | Detail |
|---|---|
| **Primary model** | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — 1 kredit/pesan |
| **Fallback model** | Claude Sonnet 4.6 (`claude-sonnet-4-6`) — 3 kredit/pesan |
| **Trigger Sonnet** | Keyword kompleks: proyeksi, KPR, investasi, dana darurat, dll |
| **API Key** | `ANTHROPIC_API_KEY` — sudah ada, tidak perlu key baru |
| **Context strategy** | Data transaksi + budget + goals user di-inject ke system prompt |

Karena data keuangan sudah tersedia sebagai context terstruktur,
Haiku 4.5 sudah cukup untuk 85–90% pertanyaan. Sonnet hanya untuk
query yang butuh reasoning mendalam.

---

## 1. Environment Variables

### Python Backend — `.env`
```env
# Sudah ada — tidak perlu tambahan apapun
ANTHROPIC_API_KEY=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
```

### React Frontend — `frontend/.env`
```env
# BARU — diperlukan oleh Vercel serverless (server-side, tidak expose ke client)
ANTHROPIC_API_KEY=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
SUPABASE_SERVICE_ROLE_KEY=...    ← ambil dari Supabase → Project Settings → API → service_role
SUPABASE_URL=...                 ← sama dengan VITE_SUPABASE_URL tapi tanpa prefix VITE_
```

> **Vercel:** Settings → Environment Variables → tambahkan ketiga key di atas
> `SUPABASE_SERVICE_ROLE_KEY` diperlukan agar endpoint server-side bisa bypass RLS

---

## 2. Database — Schema Tambahan

Jalankan di **Supabase SQL Editor**:

```sql
-- Tambah kolom credits ke users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 350;

-- Tabel conversation history AI Advisor
CREATE TABLE IF NOT EXISTS advisor_conversations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      BIGINT      REFERENCES users(user_id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT        NOT NULL,
  model_used   TEXT,                        -- 'haiku' | 'sonnet'
  credits_used INTEGER     DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query history per user
CREATE INDEX IF NOT EXISTS idx_advisor_conv_user
  ON advisor_conversations(user_id, created_at DESC);
```

---

## 3. File Baru yang Dibuat

```
services/
└── advisor.py                          ← BUAT FILE BARU

frontend/api/
└── advisor.js                          ← BUAT FILE BARU (Vercel serverless)

frontend/src/app/pages/
└── AIAdvisor.tsx                       ← BUAT FILE BARU (React page)
```

### Integrasi ke file yang sudah ada:
```
frontend/src/app/App.tsx                ← tambah route /advisor
frontend/src/app/components/Layout.tsx  ← tambah menu item
```

---

## 4. `services/advisor.py` — Full File

```python
# services/advisor.py
# ─────────────────────────────────────────────────────────────────────────────
# AI Advisor — Claude Haiku 4.5 (primary) · Claude Sonnet 4.6 (fallback)
# Context: data transaksi + budget + goals user di-inject ke setiap request
# ─────────────────────────────────────────────────────────────────────────────

import anthropic
import os
from datetime import datetime

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_MAP      = {
    "haiku":  "claude-haiku-4-5-20251001",
    "sonnet": "claude-sonnet-4-6",
}
MAX_TOKENS_MAP = {"haiku": 500, "sonnet": 800}
CREDITS_MAP    = {"haiku": 1,   "sonnet": 3}

# Keyword yang trigger Sonnet (estimasi ~15% request)
COMPLEX_KEYWORDS = [
    "proyeksi", "simulasi", "investasi", "cicilan", "kpr",
    "dana darurat", "rencana", "pensiun", "inflasi",
    "portofolio", "alokasi", "5 tahun", "10 tahun",
    "compound", "return", "saham", "reksa dana", "obligasi",
]

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah AI Advisor keuangan pribadi dari Gajian Aman — \
aplikasi finance tracker untuk profesional urban Indonesia.

== KARAKTER ==
- Friendly, jujur, kadang sedikit "roast" tapi selalu supportif dan membangun
- Paham konteks keuangan Indonesia: GoFood, GrabFood, Tokopedia, Shopee,
  Indomaret, Alfamart, GoPay, OVO, Dana, ShopeePay, KRL, Transjakarta, dll
- Bahasa Indonesia natural — seperti teman yang paham finance, bukan robot
- Jawaban konkret dan actionable — maksimal 3 paragraf pendek
- Format rupiah: Rp50.000 (titik pemisah ribuan, tanpa spasi setelah Rp)
- JANGAN sebut bahwa kamu Claude, dibuat Anthropic, atau model AI apapun

== CARA MENJAWAB ==
Roasting pengeluaran  → Jujur tapi semangati, sebutkan kategori + nominal spesifik
Bisa beli X?          → Hitung dari sisa + saving rate, beri angka konkret
Analisa keuangan      → 1 insight utama + 1 rekomendasi actionable
Tips hemat            → Spesifik dari data user, bukan saran generik
Pertanyaan umum       → Singkat, tambah konteks data jika relevan

== FORMAT ==
- Gunakan data keuangan user — sebutkan angka dan kategori yang nyata
- Tutup dengan 1 kalimat semangat atau call-to-action yang relevan
- Jika ada budget yang over → sebutkan secara eksplisit dengan nominalnya"""


# ── Context builder ───────────────────────────────────────────────────────────

def build_financial_context(
    user_name:    str,
    transactions: list[dict],
    budgets:      list[dict],
    goals:        list[dict],
    month:        int,
    year:         int,
) -> str:
    """
    Membangun context keuangan user sebagai string terstruktur.
    Di-inject ke system prompt setiap request → jawaban AI jadi personal.
    """
    income_total  = sum(t["amount"] for t in transactions if t["type"] == "income")
    expense_total = sum(t["amount"] for t in transactions if t["type"] == "expense")
    net           = income_total - expense_total
    saving_rate   = (net / income_total * 100) if income_total > 0 else 0

    # Breakdown per kategori (expense only)
    cat_map: dict[str, float] = {}
    for t in transactions:
        if t["type"] == "expense":
            cat = t.get("category", "Other")
            cat_map[cat] = cat_map.get(cat, 0) + t["amount"]
    top_cats = sorted(cat_map.items(), key=lambda x: x[1], reverse=True)[:6]

    # Status budget
    budget_lines = []
    for b in budgets:
        spent = cat_map.get(b["category"], 0)
        pct   = (spent / b["amount"] * 100) if b["amount"] > 0 else 0
        flag  = "OVER ⚠️" if spent > b["amount"] else "OK ✓"
        budget_lines.append(
            f"  {b['category']}: Rp{spent:,.0f} / Rp{b['amount']:,.0f} ({pct:.0f}%) [{flag}]"
        )

    # Goals
    goal_lines = [
        f"  {g['name']}: Rp{g['saved_amount']:,.0f} / Rp{g['target_amount']:,.0f} "
        f"({g['saved_amount'] / g['target_amount'] * 100:.0f}%)"
        for g in goals
    ] if goals else ["  Belum ada goals aktif"]

    # 8 transaksi terakhir
    recent = sorted(transactions, key=lambda x: x.get("date", ""), reverse=True)[:8]
    tx_lines = [
        f"  {t.get('date','?')} | {t['type']:7} | Rp{t['amount']:>12,.0f} "
        f"| {t.get('category','?'):20} | {t.get('note','')}"
        for t in recent
    ]

    period = datetime(year, month, 1).strftime("%B %Y")

    return f"""
=== DATA KEUANGAN {user_name.upper()} — {period} ===

RINGKASAN:
  Pemasukan    : Rp{income_total:,.0f}
  Pengeluaran  : Rp{expense_total:,.0f}
  Sisa / Net   : Rp{net:,.0f}
  Saving Rate  : {saving_rate:.1f}%

TOP PENGELUARAN:
{chr(10).join(f"  {c}: Rp{a:,.0f}" for c, a in top_cats) or "  Belum ada data"}

STATUS BUDGET:
{chr(10).join(budget_lines) or "  Belum ada budget yang di-set"}

GOALS AKTIF:
{chr(10).join(goal_lines)}

8 TRANSAKSI TERAKHIR:
{chr(10).join(tx_lines) or "  Belum ada transaksi"}
=== END DATA ==="""


# ── Complexity classifier ─────────────────────────────────────────────────────

def classify_complexity(message: str) -> str:
    """Routing sederhana. Returns 'haiku' (default) atau 'sonnet'."""
    msg_lower = message.lower()
    if any(kw in msg_lower for kw in COMPLEX_KEYWORDS):
        return "sonnet"
    return "haiku"


# ── Main chat function ────────────────────────────────────────────────────────

def chat_with_advisor(
    user_message:         str,
    conversation_history: list[dict],
    financial_context:    str,
) -> dict:
    """
    Main entry point AI Advisor.

    Args:
        user_message         : Pesan terbaru dari user
        conversation_history : [{"role": "user"|"assistant", "content": "..."}]
                               Kirim maksimal 20 pesan terakhir untuk hemat token
        financial_context    : Output dari build_financial_context()

    Returns:
        {
            "reply"       : str,   # Jawaban AI
            "model_used"  : str,   # "haiku" | "sonnet"
            "credits_used": int,   # 1 atau 3
        }
    """
    tier    = classify_complexity(user_message)
    model   = MODEL_MAP[tier]
    credits = CREDITS_MAP[tier]

    messages = conversation_history[-20:] + [
        {"role": "user", "content": user_message}
    ]

    response = client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS_MAP[tier],
        system=SYSTEM_PROMPT + "\n\n" + financial_context,
        messages=messages,
    )

    return {
        "reply":        response.content[0].text,
        "model_used":   tier,
        "credits_used": credits,
    }
```

---

## 5. `frontend/api/advisor.js` — Full File

```javascript
// frontend/api/advisor.js
// ─────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Function — AI Advisor endpoint
// Primary  : Claude Haiku 4.5   (1 kredit)
// Fallback : Claude Sonnet 4.6  (3 kredit, keyword kompleks saja)
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Service role → bypass RLS, aman karena ini server-side only
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const MODELS      = { haiku: "claude-haiku-4-5-20251001", sonnet: "claude-sonnet-4-6" };
const CREDITS_MAP = { haiku: 1, sonnet: 3 };
const MAX_TOKENS  = { haiku: 500, sonnet: 800 };

const COMPLEX_KEYWORDS = [
  "proyeksi","simulasi","investasi","cicilan","kpr",
  "dana darurat","rencana","pensiun","inflasi",
  "portofolio","alokasi","5 tahun","10 tahun",
  "compound","return","saham","reksa dana",
];

function classifyComplexity(msg) {
  return COMPLEX_KEYWORDS.some(k => msg.toLowerCase().includes(k))
    ? "sonnet" : "haiku";
}

const SYSTEM_PROMPT = `Kamu adalah AI Advisor keuangan pribadi dari Gajian Aman.
Friendly, jujur, kadang roast tapi selalu supportif.
Bahasa Indonesia natural. Jawaban konkret, maks 3 paragraf.
Format rupiah: Rp50.000. JANGAN sebut Claude atau Anthropic.
Gunakan data keuangan user untuk jawaban yang spesifik dan personal.`;

function buildContext(name, txs, budgets, goals, month, year) {
  const fmt  = n => n.toLocaleString("id-ID");
  const income  = txs.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0);
  const expense = txs.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0);
  const net     = income - expense;
  const rate    = income > 0 ? ((net/income)*100).toFixed(1) : "0.0";

  const catMap = {};
  txs.filter(t => t.type === "expense")
     .forEach(t => { const c = t.category||"Other"; catMap[c]=(catMap[c]||0)+t.amount; });
  const topCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([c,a]) => `  ${c}: Rp${fmt(a)}`).join("\n");

  const budgetLines = budgets.map(b => {
    const s   = catMap[b.category]||0;
    const pct = b.amount>0 ? ((s/b.amount)*100).toFixed(0) : 0;
    return `  ${b.category}: Rp${fmt(s)} / Rp${fmt(b.amount)} (${pct}%) [${s>b.amount?"OVER ⚠️":"OK ✓"}]`;
  }).join("\n") || "  Belum ada budget";

  const goalLines = goals.map(g => {
    const pct = g.target_amount>0 ? ((g.saved_amount/g.target_amount)*100).toFixed(0) : 0;
    return `  ${g.name}: Rp${fmt(g.saved_amount)} / Rp${fmt(g.target_amount)} (${pct}%)`;
  }).join("\n") || "  Belum ada goals";

  const recentTx = [...txs]
    .sort((a,b) => (b.date||"").localeCompare(a.date||"")).slice(0,8)
    .map(t => `  ${t.date||"?"} | ${t.type} | Rp${fmt(t.amount)} | ${t.category||"?"} | ${t.note||""}`)
    .join("\n") || "  Belum ada transaksi";

  const monthName = new Date(year, month-1, 1)
    .toLocaleDateString("id-ID", { month:"long", year:"numeric" });

  return `
=== DATA KEUANGAN ${name.toUpperCase()} — ${monthName} ===
Pemasukan  : Rp${fmt(income)}
Pengeluaran: Rp${fmt(expense)}
Sisa/Net   : Rp${fmt(net)}
Saving Rate: ${rate}%

TOP PENGELUARAN:
${topCats || "  Belum ada data"}

STATUS BUDGET:
${budgetLines}

GOALS:
${goalLines}

8 TRANSAKSI TERAKHIR:
${recentTx}
=== END DATA ===`;
}


export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, message, history = [], month, year } = req.body;
  if (!userId || !message)
    return res.status(400).json({ error: "userId dan message wajib ada" });

  const m       = month || new Date().getMonth() + 1;
  const y       = year  || new Date().getFullYear();
  const monthPad = String(m).padStart(2,"0");

  // Fetch semua data user secara paralel
  const [txRes, budgetRes, goalRes, userRes, creditRes] = await Promise.all([
    supabase.from("transactions").select("*")
      .eq("user_id", userId)
      .gte("date", `${y}-${monthPad}-01`)
      .lte("date", `${y}-${monthPad}-31`),
    supabase.from("budgets").select("*")
      .eq("user_id", userId).eq("month", m).eq("year", y),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("users").select("name").eq("user_id", userId).single(),
    supabase.from("users").select("credits").eq("user_id", userId).single(),
  ]);

  const tier           = classifyComplexity(message);
  const credits        = CREDITS_MAP[tier];
  const currentCredits = creditRes.data?.credits ?? 0;

  if (currentCredits < credits) {
    return res.status(402).json({
      error:             "Kredit tidak cukup",
      credits_available: currentCredits,
      credits_needed:    credits,
    });
  }

  const context = buildContext(
    userRes.data?.name || "User",
    txRes.data    || [],
    budgetRes.data || [],
    goalRes.data   || [],
    m, y,
  );

  const response = await anthropic.messages.create({
    model:      MODELS[tier],
    max_tokens: MAX_TOKENS[tier],
    system:     SYSTEM_PROMPT + "\n\n" + context,
    messages:   [...(history.slice(-20)), { role:"user", content:message }],
  });

  const reply = response.content[0].text;

  // Deduct credits + simpan conversation (paralel)
  await Promise.all([
    supabase.from("users")
      .update({ credits: currentCredits - credits })
      .eq("user_id", userId),
    supabase.from("advisor_conversations").insert([
      { user_id:userId, role:"user",      content:message },
      { user_id:userId, role:"assistant", content:reply, model_used:tier, credits_used:credits },
    ]),
  ]);

  return res.status(200).json({
    reply,
    tier,
    credits_used:      credits,
    credits_remaining: currentCredits - credits,
  });
}
```

---

## 6. `frontend/src/app/pages/AIAdvisor.tsx` — Full File

```tsx
// frontend/src/app/pages/AIAdvisor.tsx
import { useState, useRef, useEffect } from "react";
import { useAuth }        from "@/hooks/useAuth";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { supabase }       from "@/lib/supabase";
import { cn }             from "@/lib/utils";

interface Message {
  role:         "user" | "assistant";
  content:      string;
  model?:       "haiku" | "sonnet";
  credits_used?: number;
}

const QUICK_PROMPTS = [
  { label: "Roasting pengeluaranku 🔥",
    prompt: "Roasting pengeluaranku bulan ini dong, jujur aja!" },
  { label: "Bisa beli HP baru? 📱",
    prompt: "Mau beli HP baru sekitar Rp3 juta, kira-kira aman gak dari kondisi keuanganku?" },
  { label: "Analisa keuanganku 📊",
    prompt: "Analisa kondisi keuanganku bulan ini. Mana yang perlu diperbaiki?" },
  { label: "Tips hemat bulan ini 💡",
    prompt: "Kasih tips hemat yang spesifik berdasarkan pengeluaranku bulan ini." },
];

export default function AIAdvisor() {
  const { user }          = useAuth();
  const { month, year }   = useMonthFilter();
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [credits, setCredits]     = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch credit balance
  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("credits")
      .eq("user_id", user.user_id).single()
      .then(({ data }) => setCredits(data?.credits ?? 0));
  }, [user]);

  // Load conversation history
  useEffect(() => {
    if (!user) return;
    supabase.from("advisor_conversations")
      .select("role, content, model_used, credits_used")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: true })
      .limit(30)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data.map(d => ({
            role:        d.role as "user" | "assistant",
            content:     d.content,
            model:       d.model_used as "haiku" | "sonnet" | undefined,
            credits_used: d.credits_used,
          })));
        } else {
          setMessages([{
            role:    "assistant",
            content: `Halo ${user.name?.split(" ")[0] || ""}! Aku AI Advisor kamu. `
                   + `Ada yang bisa dibantu soal keuangan hari ini? 🚀`,
          }]);
        }
      });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !user) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          userId:  user.user_id,
          message: text,
          history: next.slice(-20).map(m => ({ role: m.role, content: m.content })),
          month,
          year,
        }),
      });

      if (res.status === 402) {
        setMessages(prev => [...prev, {
          role:    "assistant",
          content: "Kredit kamu tidak cukup untuk pesan ini. Topup dulu ya! 💳",
        }]);
        return;
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role:        "assistant",
        content:     data.reply,
        model:       data.tier,
        credits_used: data.credits_used,
      }]);
      setCredits(data.credits_remaining);

    } catch {
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: "Waduh, ada error nih. Coba lagi sebentar ya. 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    await supabase.from("advisor_conversations").delete().eq("user_id", user.user_id);
    setMessages([{
      role:    "assistant",
      content: "Chat baru dimulai! Ada yang mau ditanyain? 🚀",
    }]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">

      {/* Sidebar */}
      <aside className="w-60 border-r border-border p-4 flex flex-col gap-3 shrink-0">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600]
                     text-black font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
        >
          <span className="text-base font-bold">+</span> Chat Baru
        </button>

        {credits !== null && (
          <div className="rounded-xl border border-border p-3 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Kredit tersisa</p>
            <p className="font-mono font-semibold text-lg">
              🪙 {credits.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              Haiku = 1 kredit<br/>Sonnet = 3 kredit (analisis kompleks)
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1.5">Contoh pertanyaan</p>
          <ul className="space-y-1 leading-relaxed">
            <li>· Bisa beli motor bulan ini?</li>
            <li>· Mana pengeluaran terbesar?</li>
            <li>· Gimana saving rate-ku?</li>
            <li>· Tips hemat GoFood-ku</li>
          </ul>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center
                                justify-center shrink-0 mt-0.5 text-white text-[11px] font-bold">
                  AI
                </div>
              )}
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-[#CCFF00] text-black font-medium rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              )}>
                <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                {msg.model && (
                  <p className="text-[10px] opacity-40 mt-1.5">
                    {msg.model} · {msg.credits_used} kredit
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center
                              justify-center text-white text-[11px] font-bold">
                AI
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  {[0,1,2].map(i => (
                    <span key={i}
                      className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts — hanya tampil di awal chat */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex gap-2 flex-wrap">
            {QUICK_PROMPTS.map(q => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.prompt)}
                disabled={loading}
                className="text-xs border border-border rounded-full px-3 py-1.5
                           hover:bg-secondary transition-colors text-muted-foreground
                           hover:text-foreground disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Tanya apa saja tentang keuangan..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-secondary rounded-xl px-4 py-3 text-sm
                         outline-none focus:ring-1 focus:ring-teal-500 transition-all
                         disabled:opacity-50"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Kirim pesan"
              className="w-10 h-10 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600]
                         disabled:opacity-40 flex items-center justify-center
                         transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"
                   stroke="black" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Saran AI hanya untuk tujuan informasi · 1 kredit/pesan
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Integrasi ke App.tsx & Layout.tsx

### `App.tsx` — tambah route
```tsx
import AIAdvisor from "@/app/pages/AIAdvisor";

// Di dalam <Routes>:
<Route path="/advisor" element={<RequireAuth><AIAdvisor /></RequireAuth>} />
```

### `Layout.tsx` — tambah menu item
```tsx
// Di array navigasi sidebar:
{ path: "/advisor", label: "AI Advisor", icon: <SparklesIcon className="w-4 h-4" /> }
```

---

## 8. Deployment Checklist

```
Supabase
□ Jalankan SQL schema tambahan (credits + advisor_conversations)
□ Pastikan index idx_advisor_conv_user terbuat

Vercel
□ Tambah ANTHROPIC_API_KEY ke Environment Variables
□ Tambah SUPABASE_URL ke Environment Variables
□ Tambah SUPABASE_SERVICE_ROLE_KEY ke Environment Variables
□ Buat frontend/api/advisor.js
□ Redeploy Vercel

React Frontend
□ Buat frontend/src/app/pages/AIAdvisor.tsx
□ Tambah route /advisor di App.tsx
□ Tambah menu item di Layout.tsx

Railway (Python Bot)
□ Buat services/advisor.py (opsional, jika advisor juga diakses dari bot)

Testing
□ Buka /advisor → welcome message muncul
□ Kirim quick prompt "Roasting pengeluaranku"
□ Cek kredit berkurang 1 di Supabase users table
□ Kirim pesan dengan keyword "investasi" → cek log model=sonnet, kredit=3
□ Cek advisor_conversations table terisi dengan benar
```
