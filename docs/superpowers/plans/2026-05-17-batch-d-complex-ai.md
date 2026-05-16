# Batch D — Complex AI Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Gajian page (payday date + risk profile quiz + AI budget recommendation), payday reminder scheduler, and Split Bill (web app + Vercel serverless + Telegram bot ConversationHandler).

**Architecture:** Gajian page has 3 sequential sections that unlock progressively. AI budget recommendation is cached in `users.ai_budget_recommendation` — never regenerated on every load. Split bill saves to DB with a `share_token` so the public `/split/:token` page works without auth. Bot `/splitbill` uses `ConversationHandler` with 4 states. All Claude Haiku calls are server-side (Vercel serverless or Python bot) — API key never exposed to client.

**Prerequisites:** Batches A, B, C complete (DB migration run, useWallets available, subscription.py available).

**Tech Stack:** React 18 + TypeScript, Supabase JS, Tailwind CSS v4, shadcn/ui, Claude Haiku (`claude-haiku-4-5-20251001`), Vercel serverless (Node.js), python-telegram-bot v20 ConversationHandler, APScheduler, `qrcode.react`

---

## File Map

| Action | File |
|---|---|
| MODIFY | `db/operations.py` |
| CREATE | `frontend/api/budget-recommendation.js` |
| CREATE | `frontend/api/split-bill-ai.js` |
| CREATE | `frontend/src/app/pages/Gajian.tsx` |
| CREATE | `frontend/src/app/pages/SplitBill.tsx` |
| CREATE | `frontend/src/app/pages/SplitBillShare.tsx` |
| MODIFY | `frontend/src/app/App.tsx` |
| MODIFY | `scheduler/weekly_report.py` |
| MODIFY | `bot/handlers/commands.py` |
| MODIFY | `bot/main.py` |

---

## Task 1: Gajian + Split Bill DB Operations

**Files:**
- Modify: `db/operations.py`

- [ ] **Step 1: Add Gajian and Split Bill operations to db/operations.py**

At the bottom of `db/operations.py`, add:

```python
# ── Gajian / Risk Profile operations ─────────────────────────────────────────

async def save_payday_date(session: AsyncSession, user_id: int, payday_date: int) -> None:
    await session.execute(
        text("UPDATE users SET payday_date = :day WHERE user_id = :uid"),
        {"day": payday_date, "uid": user_id}
    )
    await session.commit()


async def save_risk_profile(session: AsyncSession, user_id: int, profile: dict) -> None:
    import json
    await session.execute(
        text("UPDATE users SET risk_profile = :profile::jsonb WHERE user_id = :uid"),
        {"profile": json.dumps(profile), "uid": user_id}
    )
    await session.commit()


async def save_ai_budget_recommendation(session: AsyncSession, user_id: int, recommendation: dict) -> None:
    import json
    from datetime import datetime, timezone
    recommendation['generated_at'] = datetime.now(timezone.utc).isoformat()
    await session.execute(
        text("UPDATE users SET ai_budget_recommendation = :rec::jsonb WHERE user_id = :uid"),
        {"rec": json.dumps(recommendation), "uid": user_id}
    )
    await session.commit()


async def get_payday_users(session: AsyncSession, day: int) -> list:
    """Returns users whose payday_date matches today's day of month."""
    result = await session.execute(
        text("SELECT user_id, name FROM users WHERE payday_date = :day"),
        {"day": day}
    )
    return [dict(row._mapping) for row in result.fetchall()]


# ── Split Bill operations ─────────────────────────────────────────────────────

async def create_split_bill(
    session: AsyncSession,
    user_id: int,
    session_name: str,
    total_amount: float,
    participants: list,
    items: list | None = None
) -> dict:
    import json
    result = await session.execute(
        text("""
            INSERT INTO split_bills (user_id, session_name, total_amount, participants, items)
            VALUES (:uid, :name, :total, :participants::jsonb, :items::jsonb)
            RETURNING id, share_token, session_name, total_amount, participants, items, created_at
        """),
        {
            "uid": user_id,
            "name": session_name,
            "total": total_amount,
            "participants": json.dumps(participants),
            "items": json.dumps(items) if items else "null",
        }
    )
    await session.commit()
    return dict(result.fetchone()._mapping)


async def get_split_bill_by_token(session: AsyncSession, token: str) -> dict | None:
    result = await session.execute(
        text("""
            SELECT id, session_name, total_amount, participants, items, share_token, created_at
            FROM split_bills WHERE share_token = :token
        """),
        {"token": token}
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def get_split_bill_history(session: AsyncSession, user_id: int, limit: int = 10) -> list:
    result = await session.execute(
        text("""
            SELECT id, session_name, total_amount, share_token, created_at
            FROM split_bills WHERE user_id = :uid
            ORDER BY created_at DESC LIMIT :limit
        """),
        {"uid": user_id, "limit": limit}
    )
    return [dict(row._mapping) for row in result.fetchall()]
```

- [ ] **Step 2: Verify**

```bash
python -c "from db.operations import get_payday_users, create_split_bill, get_split_bill_by_token; print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add db/operations.py
git commit -m "feat(db): add Gajian, risk profile, and split bill DB operations"
```

---

## Task 2: Budget Recommendation Serverless

**Files:**
- Create: `frontend/api/budget-recommendation.js`

- [ ] **Step 1: Create `budget-recommendation.js`**

Create `frontend/api/budget-recommendation.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Groceries', 'Bills & Utilities',
  'Health', 'Entertainment', 'Shopping', 'Savings',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { risk_profile, monthly_income, answers } = req.body;

  if (!risk_profile || !monthly_income) {
    return res.status(400).json({ error: 'risk_profile and monthly_income required' });
  }

  const profileType = risk_profile?.type ?? 'moderat';
  const dependents = risk_profile?.dependents ?? 0;
  const incomeFormatted = Number(monthly_income).toLocaleString('id-ID');

  try {
    const { content } = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: 'Kamu financial advisor Indonesia. Return ONLY valid JSON array, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Buat rekomendasi alokasi budget bulanan untuk:
- Income: Rp ${incomeFormatted}/bulan
- Profil risiko: ${profileType}
- Tanggungan: ${dependents} orang

Return JSON array dengan TEPAT 8 item (kategori: ${CATEGORIES.join(', ')}):
[{"category": "Food & Dining", "percentage": 25, "amount": 1250000, "tip": "satu kalimat tips singkat"}]

Jumlah percentage harus = 100. Amount = income × percentage / 100.`
      }]
    });

    const raw = content[0]?.text ?? '[]';

    // Extract JSON array from response (in case model adds any wrapping text)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    const categories = JSON.parse(jsonMatch[0]);

    // Validate: ensure 8 categories, recalculate amounts from actual income
    const validated = categories.slice(0, 8).map((c) => ({
      category: c.category,
      percentage: Math.round(c.percentage),
      amount: Math.round(Number(monthly_income) * c.percentage / 100),
      tip: c.tip ?? '',
    }));

    return res.status(200).json({ categories: validated, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Budget recommendation error:', err);
    return res.status(500).json({ error: 'AI service error. Coba lagi ya.' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/api/budget-recommendation.js
git commit -m "feat(api): add budget-recommendation.js — Haiku risk-profile to budget allocation"
```

---

## Task 3: Split Bill AI Serverless

**Files:**
- Create: `frontend/api/split-bill-ai.js`

- [ ] **Step 1: Create `split-bill-ai.js`**

Create `frontend/api/split-bill-ai.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image_base64, items_text, participants = [] } = req.body;

  if (!image_base64 && !items_text) {
    return res.status(400).json({ error: 'image_base64 or items_text required' });
  }

  try {
    const participantList = participants.join(', ') || 'tidak ada peserta';

    let messages;

    if (image_base64) {
      messages = [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image_base64,
            },
          },
          {
            type: 'text',
            text: `Extract semua item dan harga dari struk ini. Peserta: ${participantList}.
Return ONLY JSON:
{
  "items": [{"name": "...", "price": 12000}],
  "suggestions": [{"person": "...", "items": ["item1"], "subtotal": 12000}]
}
Jika struk tidak jelas, buat estimasi terbaik. No markdown.`,
          },
        ],
      }];
    } else {
      messages = [{
        role: 'user',
        content: `Items dari struk: ${items_text}
Peserta: ${participantList}

Bagi item-item ini ke peserta secara adil. Return ONLY JSON:
{
  "items": [{"name": "...", "price": 12000}],
  "suggestions": [{"person": "...", "items": ["item1"], "subtotal": 12000}]
}
No markdown.`,
      }];
    }

    const { content } = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages,
    });

    const raw = content[0]?.text ?? '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Split bill AI error:', err);
    return res.status(500).json({ error: 'AI service error. Coba lagi ya.' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/api/split-bill-ai.js
git commit -m "feat(api): add split-bill-ai.js — Haiku item extraction and split suggestion"
```

---

## Task 4: Gajian Page

**Files:**
- Create: `frontend/src/app/pages/Gajian.tsx`
- Modify: `frontend/src/app/App.tsx`

- [ ] **Step 1: Create `Gajian.tsx`**

Create `frontend/src/app/pages/Gajian.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Loader2, Check, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { formatRupiah } from '@/lib/utils';
import { upsertBudget } from '@/hooks/useBudgets';

// ── Risk profile quiz ─────────────────────────────────────────────────────────

interface Answer { q: number; value: string | number }

const QUESTIONS = [
  {
    id: 1,
    text: 'Berapa perkiraan pengeluaran wajibmu per bulan? (cicilan, sewa, dll)',
    type: 'slider' as const,
    min: 500_000,
    max: 10_000_000,
    step: 100_000,
  },
  {
    id: 2,
    text: 'Kamu punya tanggungan?',
    type: 'choice' as const,
    options: [
      { label: 'Tidak ada', value: '0' },
      { label: '1–2 orang', value: '1-2' },
      { label: '3 orang atau lebih', value: '3+' },
    ],
  },
  {
    id: 3,
    text: 'Kalau ada pengeluaran darurat Rp 2jt, kamu...',
    type: 'choice' as const,
    options: [
      { label: 'Bisa langsung bayar', value: 'A' },
      { label: 'Perlu pinjam dulu', value: 'B' },
      { label: 'Susah banget', value: 'C' },
    ],
  },
  {
    id: 4,
    text: 'Target finansial 1 tahun ke depan?',
    type: 'choice' as const,
    options: [
      { label: 'Punya dana darurat', value: 'A' },
      { label: 'Beli sesuatu besar', value: 'B' },
      { label: 'Investasi', value: 'C' },
      { label: 'Bebas utang', value: 'D' },
    ],
  },
  {
    id: 5,
    text: 'Seberapa ketat kamu mau budgeting?',
    type: 'choice' as const,
    options: [
      { label: 'Super ketat', value: 'A' },
      { label: 'Seimbang', value: 'B' },
      { label: 'Santai aja dulu', value: 'C' },
    ],
  },
];

function computeProfile(answers: Answer[]): 'konservatif' | 'moderat' | 'agresif' {
  let score = 0;
  answers.forEach((a) => {
    if (a.q === 1) {
      const v = Number(a.value);
      if (v < 2_000_000) score += 2;
      else if (v < 5_000_000) score += 1;
    }
    if (a.q === 2) {
      if (a.value === '3+') score += 2;
      else if (a.value === '1-2') score += 1;
    }
    if (a.q === 3) {
      if (a.value === 'C') score += 2;
      else if (a.value === 'B') score += 1;
    }
    if (a.q === 5) {
      if (a.value === 'A') score -= 1; // ketat = less risky / more conservative
    }
  });
  if (score <= 2) return 'agresif';
  if (score <= 4) return 'moderat';
  return 'konservatif';
}

interface BudgetCategory {
  category: string;
  percentage: number;
  amount: number;
  tip: string;
}

export default function Gajian() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { transactions } = useTransactions(month, year);

  // Section 1: Payday
  const [paydayDate, setPaydayDate] = useState<number | null>(null);
  const [paydaySaved, setPaydaySaved] = useState(false);
  const [savingPayday, setSavingPayday] = useState(false);

  // Section 2: Risk Profile
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [sliderValue, setSliderValue] = useState(2_000_000);
  const [profileResult, setProfileResult] = useState<'konservatif' | 'moderat' | 'agresif' | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Section 3: AI Budget
  const [recommendation, setRecommendation] = useState<BudgetCategory[] | null>(null);
  const [editedRec, setEditedRec] = useState<BudgetCategory[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [applyingBudget, setApplyingBudget] = useState(false);

  // Load existing data
  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('payday_date, risk_profile, ai_budget_recommendation')
      .eq('user_id', user.userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.payday_date) {
          setPaydayDate(data.payday_date);
          setPaydaySaved(true);
        }
        if (data.risk_profile?.type) {
          setProfileResult(data.risk_profile.type);
          setCurrentQ(QUESTIONS.length); // mark as complete
        }
        if (data.ai_budget_recommendation?.categories) {
          setRecommendation(data.ai_budget_recommendation.categories);
          setEditedRec(data.ai_budget_recommendation.categories);
        }
      });
  }, [user]);

  const monthlyIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);

  // ── Section 1 handlers ─────────────────────────────────────────────────────
  const handleSavePayday = async () => {
    if (!user || !paydayDate) return;
    setSavingPayday(true);
    await supabase.from('users').update({ payday_date: paydayDate }).eq('user_id', user.userId);
    setSavingPayday(false);
    setPaydaySaved(true);
    toast.success(`Tanggal gajian ${paydayDate} berhasil disimpan!`);
  };

  // ── Section 2 handlers ─────────────────────────────────────────────────────
  const handleAnswer = async (value: string | number) => {
    const q = QUESTIONS[currentQ];
    const newAnswers = [...answers, { q: q.id, value }];
    setAnswers(newAnswers);

    if (currentQ + 1 < QUESTIONS.length) {
      setCurrentQ((prev) => prev + 1);
      setSliderValue(2_000_000);
    } else {
      // All answered — compute and save
      const profile = computeProfile(newAnswers);
      setProfileResult(profile);
      setSavingProfile(true);
      if (user) {
        const profileData = {
          type: profile,
          income: monthlyIncome,
          dependents: newAnswers.find((a) => a.q === 2)?.value ?? '0',
          answers: Object.fromEntries(newAnswers.map((a) => [a.q, a.value])),
        };
        await supabase.from('users').update({ risk_profile: profileData }).eq('user_id', user.userId);
      }
      setSavingProfile(false);
      toast.success(`Profil risiko kamu: ${profile.charAt(0).toUpperCase() + profile.slice(1)}!`);
    }
  };

  // ── Section 3 handlers ─────────────────────────────────────────────────────
  const handleGenerateRecommendation = async () => {
    if (!user || !profileResult) return;
    setLoadingRec(true);
    try {
      const res = await fetch('/api/budget-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_profile: { type: profileResult },
          monthly_income: monthlyIncome || 5_000_000,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      setRecommendation(data.categories);
      setEditedRec(data.categories);

      // Cache to DB
      await supabase.from('users')
        .update({ ai_budget_recommendation: data })
        .eq('user_id', user.userId);

      toast.success('Rekomendasi budget siap!');
    } catch {
      toast.error('Gagal generate rekomendasi. Coba lagi ya.');
    } finally {
      setLoadingRec(false);
    }
  };

  const handleEditPercentage = (idx: number, pct: number) => {
    setEditedRec((prev) => prev.map((c, i) =>
      i === idx
        ? { ...c, percentage: pct, amount: Math.round((monthlyIncome || 5_000_000) * pct / 100) }
        : c
    ));
  };

  const handleApplyBudget = async () => {
    if (!user) return;
    setApplyingBudget(true);
    let errors = 0;
    for (const cat of editedRec) {
      const { error } = await upsertBudget(user.userId, cat.category, cat.amount, month, year);
      if (error) errors++;
    }
    setApplyingBudget(false);
    if (errors > 0) {
      toast.error(`${errors} kategori gagal disimpan.`);
    } else {
      toast.success('Budget bulan ini berhasil diterapkan! 🎉');
    }
  };

  const profileColors = {
    konservatif: 'bg-blue-100 text-blue-700',
    moderat: 'bg-yellow-100 text-yellow-700',
    agresif: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gajian</h1>
        <p className="text-sm text-muted-foreground">Atur tanggal gajian, kenali profil risiko, dan dapat rekomendasi budget dari AI</p>
      </div>

      {/* ── Section 1: Payday Date ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              💰 Tanggal Gajian
            </CardTitle>
            {paydaySaved && <Check className="w-5 h-5 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Tiap bulan tanggal berapa kamu biasa gajian?</p>
          <div className="flex flex-wrap gap-2">
            {[...Array(28)].map((_, i) => {
              const d = i + 1;
              return (
                <button
                  key={d}
                  onClick={() => setPaydayDate(d)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium border-2 transition-all ${
                    paydayDate === d
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {d}
                </button>
              );
            })}
            <button
              onClick={() => setPaydayDate(31)}
              className={`px-3 h-10 rounded-lg text-sm font-medium border-2 transition-all ${
                paydayDate === 31
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Akhir Bulan
            </button>
          </div>

          {paydaySaved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              ✅ Kamu akan dapat reminder di Telegram setiap tanggal {paydayDate === 31 ? 'akhir bulan' : paydayDate}
            </div>
          )}

          <Button
            onClick={handleSavePayday}
            disabled={!paydayDate || savingPayday}
            className="w-full"
          >
            {savingPayday ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan Tanggal Gajian'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Section 2: Risk Profile Quiz ──────────────────────────────────── */}
      <Card className={!paydaySaved ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🎯 Profil Risiko
            </CardTitle>
            {profileResult && (
              <Badge className={profileColors[profileResult]}>
                {profileResult.charAt(0).toUpperCase() + profileResult.slice(1)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileResult ? (
            <div className="space-y-3">
              <p className="text-sm">
                Profil kamu: <span className="font-bold capitalize">{profileResult}</span>.
                {profileResult === 'konservatif' && ' Kamu cenderung hati-hati dengan keuangan — bagus!'}
                {profileResult === 'moderat' && ' Kamu seimbang antara hemat dan menikmati hidup.'}
                {profileResult === 'agresif' && ' Kamu berani ambil risiko untuk tumbuh lebih cepat.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setProfileResult(null); setCurrentQ(0); setAnswers([]); }}
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Ulangi Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Progress value={((currentQ) / QUESTIONS.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">Pertanyaan {currentQ + 1} dari {QUESTIONS.length}</p>

              {currentQ < QUESTIONS.length && (() => {
                const q = QUESTIONS[currentQ];
                return (
                  <div className="space-y-4">
                    <p className="font-medium">{q.text}</p>
                    {q.type === 'slider' && (
                      <div className="space-y-3">
                        <p className="text-2xl font-bold text-primary">{formatRupiah(sliderValue)}</p>
                        <input
                          type="range"
                          min={q.min}
                          max={q.max}
                          step={q.step}
                          value={sliderValue}
                          onChange={(e) => setSliderValue(Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatRupiah(q.min)}</span>
                          <span>{formatRupiah(q.max)}</span>
                        </div>
                        <Button className="w-full" onClick={() => handleAnswer(sliderValue)}>
                          Lanjut <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                    {q.type === 'choice' && (
                      <div className="space-y-2">
                        {q.options!.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleAnswer(opt.value)}
                            className="w-full text-left p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-medium"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {savingProfile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan profil...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: AI Budget Recommendation ──────────────────────────── */}
      <Card className={!profileResult ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 Rekomendasi Budget AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!recommendation ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Berdasarkan profil risikomu dan income bulan ini ({formatRupiah(monthlyIncome || 5_000_000)}),
                AI akan merekomendasikan alokasi budget optimal.
              </p>
              <Button
                onClick={handleGenerateRecommendation}
                disabled={loadingRec}
                className="w-full"
              >
                {loadingRec
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : '✨ Generate Rekomendasi'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Kamu bisa edit persentase sebelum menerapkan ke budget bulan ini.
              </p>

              <div className="space-y-2">
                {editedRec.map((cat, idx) => (
                  <div key={cat.category} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center p-3 rounded-xl border bg-card">
                    <div>
                      <p className="text-sm font-medium">{cat.category}</p>
                      {cat.tip && <p className="text-xs text-muted-foreground">{cat.tip}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={cat.percentage}
                        onChange={(e) => handleEditPercentage(idx, Number(e.target.value))}
                        className="w-14 text-center border rounded-lg px-2 py-1 text-sm font-mono"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <p className="text-sm font-mono font-semibold text-right w-28">
                      {formatRupiah(cat.amount)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground text-right">
                Total: {editedRec.reduce((s, c) => s + c.percentage, 0)}%
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleGenerateRecommendation}
                  disabled={loadingRec}
                  className="flex-1"
                >
                  {loadingRec ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Ulang
                </Button>
                <Button
                  onClick={handleApplyBudget}
                  disabled={applyingBudget}
                  className="flex-1"
                >
                  {applyingBudget
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menerapkan...</>
                    : '✅ Terapkan ke Budget'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Add /gajian route to App.tsx**

In `frontend/src/app/App.tsx`:
```typescript
import Gajian from './pages/Gajian';
// Inside protected routes:
<Route path="/gajian" element={<Gajian />} />
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/Gajian.tsx frontend/src/app/App.tsx
git commit -m "feat(gajian): add Gajian page with payday date, risk profile quiz, and AI budget recommendation"
```

---

## Task 5: Payday Reminder Scheduler

**Files:**
- Modify: `scheduler/weekly_report.py`

- [ ] **Step 1: Read the existing scheduler file**

First read `scheduler/weekly_report.py` to understand existing job structure, then add the payday job.

- [ ] **Step 2: Add payday reminder job**

In `scheduler/weekly_report.py`, add after the existing imports:

```python
from services.formatter import fmt_payday_reminder
from db.operations import get_payday_users
from datetime import datetime
import pytz

WIB = pytz.timezone('Asia/Jakarta')
```

Add the new payday job function (before or after the existing weekly job):

```python
async def send_payday_reminders(bot) -> None:
    """Daily job: send payday reminder to users whose payday_date = today."""
    today_wib = datetime.now(WIB)
    today_day = today_wib.day

    async with get_async_session() as session:
        users = await get_payday_users(session, today_day)

    for user in users:
        try:
            await bot.send_message(
                chat_id=user['user_id'],
                text=fmt_payday_reminder(),
                parse_mode='Markdown'
            )
        except Exception as e:
            # User may have blocked the bot — log and continue
            print(f"[payday_reminder] Failed to send to {user['user_id']}: {e}")
```

In the scheduler setup function (where `scheduler.add_job(...)` is called), add:

```python
from apscheduler.triggers.cron import CronTrigger

# Add after existing weekly job:
scheduler.add_job(
    lambda: asyncio.create_task(send_payday_reminders(bot)),
    trigger=CronTrigger(hour=8, minute=0, timezone=WIB),
    id='payday_reminder',
    replace_existing=True,
    name='Daily payday reminder',
)
```

- [ ] **Step 3: Verify scheduler compiles**

```bash
python -c "import scheduler.weekly_report; print('OK')"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add scheduler/weekly_report.py
git commit -m "feat(scheduler): add daily payday reminder job at 08:00 WIB"
```

---

## Task 6: SplitBill Page

**Files:**
- Create: `frontend/src/app/pages/SplitBill.tsx`
- Modify: `frontend/src/app/App.tsx`

- [ ] **Step 1: Install qrcode.react**

```bash
cd frontend && npm install qrcode.react
```

- [ ] **Step 2: Create `SplitBill.tsx`**

Create `frontend/src/app/pages/SplitBill.tsx`:

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Loader2, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import { COPY } from '@/lib/copy';

type SplitMode = 'equal' | 'custom' | 'percentage';

interface Participant {
  name: string;
  amount: number;
}

interface ParsedResult {
  shareToken: string;
  shareUrl: string;
  participants: Participant[];
  sessionName: string;
  totalAmount: number;
}

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;

export default function SplitBill() {
  const { user } = useAuth();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [sessionName, setSessionName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Step 2
  const [participants, setParticipants] = useState<string[]>(['', '']);

  // Step 3
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Step 4 result
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recordingTx, setRecordingTx] = useState(false);

  const totalNum = parseInt(totalAmount.replace(/\D/g, ''), 10) || 0;
  const validParticipants = participants.filter((p) => p.trim());

  // Computed split amounts
  const splitAmounts = (): Participant[] => {
    if (splitMode === 'equal') {
      const share = validParticipants.length > 0 ? Math.ceil(totalNum / validParticipants.length) : 0;
      return validParticipants.map((name) => ({ name, amount: share }));
    }
    if (splitMode === 'custom') {
      return validParticipants.map((name) => ({
        name,
        amount: parseInt((customAmounts[name] ?? '0').replace(/\D/g, ''), 10) || 0,
      }));
    }
    // percentage - default equal until user edits
    const share = validParticipants.length > 0 ? Math.ceil(totalNum / validParticipants.length) : 0;
    return validParticipants.map((name) => ({ name, amount: share }));
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      try {
        const res = await fetch('/api/parse-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        });
        const data = await res.json();
        if (data.amount) setTotalAmount(String(data.amount));
        toast.success('Total berhasil di-parse dari struk!');
      } catch {
        toast.error('Gagal parse struk. Input manual ya.');
      } finally {
        setUploadingReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSplit = async () => {
    if (!user) return;
    const finalParticipants = splitAmounts();

    setSaving(true);
    const { data, error } = await supabase.from('split_bills').insert({
      user_id: user.userId,
      session_name: sessionName,
      total_amount: totalNum,
      participants: finalParticipants,
    }).select('share_token').single();

    setSaving(false);

    if (error || !data) {
      toast.error('Gagal menyimpan split bill');
      return;
    }

    setResult({
      shareToken: data.share_token,
      shareUrl: `${APP_URL}/split/${data.share_token}`,
      participants: finalParticipants,
      sessionName,
      totalAmount: totalNum,
    });
    setStep(4);
    toast.success(COPY.success.splitBillCreated);
  };

  const handleCopyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link disalin!');
  };

  const handleShareWhatsApp = () => {
    if (!result) return;
    const text = encodeURIComponent(
      `Split bill "${result.sessionName}" 🍽️\nTotal: ${formatRupiah(result.totalAmount)}\nLihat detail: ${result.shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRecordMyShare = async () => {
    if (!user || !result) return;
    const myShare = result.participants.find(() => true); // first participant = user
    if (!myShare) return;
    setRecordingTx(true);
    await supabase.from('transactions').insert({
      user_id: user.userId,
      amount: myShare.amount,
      type: 'expense',
      category: 'Food & Dining',
      note: `Split bill: ${result.sessionName}`,
      date: new Date().toISOString().split('T')[0],
    });
    setRecordingTx(false);
    toast.success(COPY.success.transactionAdded);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Split Bill</h1>
        <p className="text-sm text-muted-foreground">Bagi tagihan bareng teman, share linknya langsung</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {/* Step 1: Tagihan */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>📋 Info Tagihan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nama Sesi</Label>
              <Input
                placeholder="Makan Malam Tim, Arisan, dll..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Total Tagihan</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                <Input
                  className="pl-10"
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">atau</div>

            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                {uploadingReceipt ? (
                  <><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /><p className="text-sm">Parsing struk...</p></>
                ) : (
                  <><p className="text-2xl mb-1">📸</p><p className="text-sm font-medium">Upload struk / bukti bayar</p><p className="text-xs text-muted-foreground">AI akan parse total otomatis</p></>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
            </label>

            <Button
              className="w-full"
              disabled={!sessionName || !totalNum}
              onClick={() => setStep(2)}
            >
              Lanjut — Tambah Peserta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Participants */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>👥 Siapa Saja?</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {participants.map((p, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder={`Peserta ${idx + 1}`}
                  value={p}
                  onChange={(e) => {
                    const next = [...participants];
                    next[idx] = e.target.value;
                    setParticipants(next);
                  }}
                />
                {participants.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setParticipants(participants.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setParticipants([...participants, ''])}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Peserta
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Kembali</Button>
              <Button
                className="flex-1"
                disabled={validParticipants.length < 2}
                onClick={() => setStep(3)}
              >
                Lanjut
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Split mode */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>⚖️ Cara Bagi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {(['equal', 'custom'] as SplitMode[]).map((m) => (
                <Button
                  key={m}
                  variant={splitMode === m ? 'default' : 'outline'}
                  onClick={() => setSplitMode(m)}
                  className="flex-1"
                >
                  {m === 'equal' ? 'Rata' : 'Custom'}
                </Button>
              ))}
            </div>

            {splitMode === 'custom' && (
              <div className="space-y-2">
                {validParticipants.map((name) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24 truncate">{name}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                      <Input
                        className="pl-8"
                        placeholder="0"
                        value={customAmounts[name] ?? ''}
                        onChange={(e) => setCustomAmounts({ ...customAmounts, [name]: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Preview Pembagian:</p>
              {splitAmounts().map((p) => (
                <div key={p.name} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-mono font-semibold">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Kembali</Button>
              <Button
                className="flex-1"
                disabled={saving}
                onClick={handleSaveSplit}
              >
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Buat Split Bill'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Result + Share */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ Split Bill Siap!
              <Badge className="bg-green-100 text-green-700">Tersimpan</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary */}
            <div className="space-y-2">
              <p className="font-semibold">{result.sessionName}</p>
              <p className="text-sm text-muted-foreground">Total: {formatRupiah(result.totalAmount)}</p>
              {result.participants.map((p) => (
                <div key={p.name} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{p.name}</span>
                  <span className="font-mono font-semibold">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-3 py-4">
              <QRCodeSVG value={result.shareUrl} size={140} />
              <p className="text-xs text-muted-foreground break-all text-center">{result.shareUrl}</p>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Salin Link
              </Button>
              <Button onClick={handleShareWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
                <Share2 className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleRecordMyShare}
              disabled={recordingTx}
            >
              {recordingTx ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              📋 Catat ke Transaksi Saya
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => {
              setStep(1); setResult(null); setSessionName(''); setTotalAmount('');
              setParticipants(['', '']); setCustomAmounts({});
            }}>
              Buat Split Bill Baru
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add /split route to App.tsx**

In `frontend/src/app/App.tsx`:
```typescript
import SplitBill from './pages/SplitBill';
// Inside protected routes:
<Route path="/split" element={<SplitBill />} />
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors. If `qrcode.react` types are missing, install: `npm install --save-dev @types/qrcode.react`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/SplitBill.tsx frontend/src/app/App.tsx
git commit -m "feat(splitbill): add SplitBill page with receipt upload, equal/custom split, QR, and WhatsApp share"
```

---

## Task 7: SplitBillShare Public Page

**Files:**
- Create: `frontend/src/app/pages/SplitBillShare.tsx`
- Modify: `frontend/src/app/App.tsx`

- [ ] **Step 1: Create `SplitBillShare.tsx`**

Create `frontend/src/app/pages/SplitBillShare.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';

interface SplitBillData {
  session_name: string;
  total_amount: number;
  participants: Array<{ name: string; amount: number; paid: boolean }>;
  created_at: string;
}

export default function SplitBillShare() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SplitBillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    supabase
      .from('split_bills')
      .select('session_name, total_amount, participants, created_at')
      .eq('share_token', token)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!row) setNotFound(true);
        else setData(row as SplitBillData);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-4xl">🤔</p>
        <p className="text-xl font-bold">Split bill tidak ditemukan</p>
        <p className="text-sm text-muted-foreground text-center">Link mungkin salah atau sudah kedaluwarsa.</p>
        <Link to="/">
          <Button>Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  const totalParticipants = data!.participants.length;
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(data!.created_at));

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/light-logo.png" alt="Gajian Aman" className="w-10 h-10 mx-auto" />
          <p className="text-xs text-muted-foreground">Split Bill via Gajian Aman</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-3">
            <div className="text-3xl mb-2">🍽️</div>
            <CardTitle className="text-xl">{data!.session_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{dateStr} · {totalParticipants} orang</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Tagihan</p>
              <p className="text-3xl font-extrabold text-primary">{formatRupiah(data!.total_amount)}</p>
            </div>

            {/* Per person */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Pembagian:</p>
              {data!.participants.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 px-4 rounded-xl border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold text-lg">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="border-t pt-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Mau lacak keuanganmu juga?
              </p>
              <Link to="/login">
                <Button className="w-full">Coba Gajian Aman Gratis</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Dibuat dengan Gajian Aman · Personal Finance untuk Indonesia
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add /split/:token public route to App.tsx**

In `frontend/src/app/App.tsx`, add BEFORE the protected routes block (this must be outside `RequireAuth`):

```typescript
import SplitBillShare from './pages/SplitBillShare';

// In the Routes, as a public route (same level as /login, NOT inside RequireAuth):
<Route path="/split/:token" element={<SplitBillShare />} />
```

- [ ] **Step 3: Type-check and build**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/SplitBillShare.tsx frontend/src/app/App.tsx
git commit -m "feat(splitbill): add public SplitBillShare page at /split/:token"
```

---

## Task 8: /splitbill Bot ConversationHandler

**Files:**
- Modify: `bot/handlers/commands.py`
- Modify: `bot/main.py`

- [ ] **Step 1: Add /splitbill ConversationHandler to commands.py**

In `bot/handlers/commands.py`, add imports at top if not present:

```python
from telegram.ext import ConversationHandler, MessageHandler, filters
from db.operations import create_split_bill
from services.formatter import fmt_splitbill_result
import os
```

Add ConversationHandler states and handler functions:

```python
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
        "Contoh: `Andi, Budi, Sari`".replace(',', '.'),
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
        # Equal split — save immediately
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

    async with get_async_session() as session:
        record = await create_split_bill(session, user_id, session_name, total, parts)

    share_url = f"{APP_URL}/split/{record['share_token']}"
    msg = fmt_splitbill_result(session_name, parts, share_url)

    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📋 Salin Link", callback_data=f"copy_split_{record['share_token']}")],
        [InlineKeyboardButton("✅ Catat ke Transaksi Saya", callback_data=f"record_split_{record['share_token']}")],
    ])

    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=keyboard)

    # Clear user_data
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
```

- [ ] **Step 2: Register ConversationHandler in main.py**

In `bot/main.py`, add:

```python
from bot.handlers.commands import get_splitbill_handler

# In the application setup, BEFORE adding other handlers:
application.add_handler(get_splitbill_handler())
```

Also add the `APP_URL` environment variable to Railway:
- Variable name: `APP_URL`
- Value: your Vercel deployment URL (e.g. `https://gajian-aman.vercel.app`)

Also add `VITE_APP_URL` to Vercel environment variables with the same value.

- [ ] **Step 3: Handle split bill callbacks in callbacks.py**

In `bot/handlers/callbacks.py`, add handling for `copy_split_` and `record_split_` callback data:

```python
async def handle_split_callbacks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    data = query.data

    if data.startswith('copy_split_'):
        token = data.replace('copy_split_', '')
        import os
        app_url = os.getenv('APP_URL', 'https://gajianam.com')
        url = f"{app_url}/split/{token}"
        await query.message.reply_text(f"🔗 Link split bill:\n{url}")

    elif data.startswith('record_split_'):
        token = data.replace('record_split_', '')
        user_id = update.effective_user.id
        async with get_async_session() as session:
            from db.operations import get_split_bill_by_token
            record = await get_split_bill_by_token(session, token)
        if record:
            parts = record['participants']
            # Find first participant (assume it's the user who created the split)
            if parts:
                my_amount = parts[0]['amount'] if isinstance(parts[0], dict) else 0
                from db.operations import add_transaction
                async with get_async_session() as session:
                    await add_transaction(
                        session, user_id, my_amount, 'expense',
                        'Food & Dining', f"Split bill: {record['session_name']}"
                    )
                await query.message.reply_text(
                    f"✅ Pengeluaran Rp {int(my_amount):,} untuk split bill berhasil dicatat!"
                )
```

Register this in the callback handler dispatch logic (find where other callback prefixes are handled in `callbacks.py`).

- [ ] **Step 4: Verify bot code**

```bash
python -c "from bot.handlers.commands import get_splitbill_handler; print('OK')"
```
Expected: `OK`

- [ ] **Step 5: Full build check**

```bash
cd frontend && npm run build
```
Expected: Successful build.

- [ ] **Step 6: Commit**

```bash
git add bot/handlers/commands.py bot/handlers/callbacks.py bot/main.py
git commit -m "feat(bot): add /splitbill ConversationHandler with equal/custom split and share link"
```

---

## Batch D Complete ✅

Final verification:
```bash
cd frontend && npm run build
python -c "from bot.handlers.commands import get_splitbill_handler, wallet_command; from services.subscription import check_feature_access; print('All imports OK')"
```

All complex AI features delivered:
- ✅ Budget recommendation API (Haiku, cached in DB)
- ✅ Split bill AI (Haiku, receipt parsing)
- ✅ Gajian page (payday date + 5-step risk quiz + AI budget)
- ✅ Payday reminder scheduler (daily 08:00 WIB)
- ✅ SplitBill web page (4-step flow, QR, WhatsApp share)
- ✅ SplitBillShare public page (no auth required)
- ✅ /splitbill bot ConversationHandler (4 states)
