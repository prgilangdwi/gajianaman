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
      if (a.value === 'A') score -= 1;
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
          setCurrentQ(QUESTIONS.length);
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
