import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

type Period = 'monthly' | '3month' | '6month' | 'yearly';

const PRICES: Record<string, Record<Period, number>> = {
  starter: { monthly: 9_900, '3month': 27_000, '6month': 49_000, yearly: 89_000 },
  pro:     { monthly: 19_900, '3month': 54_000, '6month': 99_000, yearly: 169_000 },
};

const PERIOD_LABELS: Record<Period, string> = {
  monthly: '1 Bulan',
  '3month': '3 Bulan',
  '6month': '6 Bulan',
  yearly: '1 Tahun',
};

const PERIOD_MONTHS: Record<Period, number> = {
  monthly: 1, '3month': 3, '6month': 6, yearly: 12,
};

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const FEATURES = {
  gratis: [
    'Catat transaksi (unlimited)',
    'Dashboard dasar: Overview, Riwayat',
    'Budget 3 kategori',
    'Tidak ada fitur AI',
  ],
  starter: [
    'Semua fitur Gratis',
    'Wallet tracking (maks 3)',
    'Budget semua kategori',
    'Kalender heatmap',
    'Download CSV',
    'Split bill (maks 5/bulan)',
    'AI: scan struk',
    'Laporan PDF',
  ],
  pro: [
    'Semua fitur Starter',
    'Wallet unlimited',
    'Split bill unlimited',
    'AI Budget Recommendation',
    'Risk Profile + Gajian fitur',
    'Priority support',
  ],
};

interface PaymentModalProps {
  plan: 'starter' | 'pro';
  period: Period;
  userId: number;
  onClose: () => void;
}

function PaymentModal({ plan, period, userId, onClose }: PaymentModalProps) {
  const price = PRICES[plan][period];
  const ref = `GA-${userId}-${plan}-${period}`.toUpperCase();
  const planLabel = plan === 'starter' ? 'Starter' : 'Pro';

  return (
    <DialogContent className="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>Upgrade ke {planLabel}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{planLabel} — {PERIOD_LABELS[period]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-primary text-lg">{formatRp(price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kode Transfer</span>
            <span className="font-mono font-bold">{ref}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Transfer ke:</p>
          <div className="bg-muted rounded-lg p-3 space-y-1 font-mono">
            <p>Bank BCA</p>
            <p>No. Rek: <span className="font-bold">1234567890</span></p>
            <p>a.n. Gajian Aman</p>
          </div>
          <p className="text-muted-foreground text-xs">
            Sertakan kode <span className="font-semibold text-foreground">{ref}</span> di berita transfer.
            Akun akan diaktifkan dalam 1x24 jam setelah konfirmasi.
          </p>
        </div>

        <Button
          className="w-full gap-2"
          onClick={() => {
            const msg = encodeURIComponent(
              `Halo, saya sudah transfer untuk upgrade Gajian Aman.\n` +
              `Plan: ${planLabel} (${PERIOD_LABELS[period]})\n` +
              `Jumlah: ${formatRp(price)}\n` +
              `Kode: ${ref}\n` +
              `User ID: ${userId}`
            );
            window.open(`https://wa.me/628123456789?text=${msg}`, '_blank');
          }}
        >
          {'💬'} Konfirmasi via WhatsApp
        </Button>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </DialogContent>
  );
}

export default function Langganan() {
  const { user } = useAuth();
  const { plan, expiresAt, isLoading } = useSubscription(user?.userId);
  const [period, setPeriod] = useState<Period>('monthly');
  const [upgradeTarget, setUpgradeTarget] = useState<{ plan: 'starter' | 'pro'; period: Period } | null>(null);

  const planLabel: Record<string, string> = { gratis: 'Gratis', starter: 'Starter', pro: 'Pro' };
  const planIcon: Record<string, ReactNode> = {
    gratis: <Zap className="w-4 h-4" />,
    starter: <Star className="w-4 h-4" />,
    pro: <Crown className="w-4 h-4" />,
  };

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000))
    : null;

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Kamu Sekarang</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {planIcon[plan]}
            </div>
            <div>
              <p className="font-bold text-lg">{planLabel[plan]}</p>
              {expiresAt && daysLeft !== null ? (
                <p className="text-sm text-muted-foreground">Aktif sampai {new Date(expiresAt).toLocaleDateString('id-ID')} ({daysLeft} hari lagi)</p>
              ) : (
                <p className="text-sm text-muted-foreground">Tanpa batas waktu</p>
              )}
            </div>
          </div>
          {plan === 'gratis' && <Badge className="bg-gray-100 text-gray-600">Gratis</Badge>}
          {plan === 'starter' && <Badge className="bg-blue-100 text-blue-700">Starter</Badge>}
          {plan === 'pro' && <Badge className="bg-yellow-100 text-yellow-700">Pro {'⭐'}</Badge>}
        </CardContent>
      </Card>

      {/* Period toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Periode:</span>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
              period === p ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Pricing cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gratis */}
        <Card className={plan === 'gratis' ? 'border-primary' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Gratis</CardTitle>
              {plan === 'gratis' && <Badge className="bg-primary/10 text-primary">Aktif</Badge>}
            </div>
            <p className="text-3xl font-bold">Rp 0</p>
            <p className="text-xs text-muted-foreground">Selamanya</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {FEATURES.gratis.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Starter */}
        <Card className={`${plan === 'starter' ? 'border-primary' : ''} relative`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Starter</CardTitle>
              {plan === 'starter' && <Badge className="bg-primary/10 text-primary">Aktif</Badge>}
            </div>
            <p className="text-3xl font-bold">{formatRp(PRICES.starter[period])}</p>
            <p className="text-xs text-muted-foreground">per {PERIOD_MONTHS[period]} bulan</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.starter.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
            {plan !== 'starter' && plan !== 'pro' && (
              <Button className="w-full mt-4" onClick={() => setUpgradeTarget({ plan: 'starter', period })}>
                Upgrade ke Starter
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className={`${plan === 'pro' ? 'border-primary' : 'border-yellow-400'} relative`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-yellow-400 text-yellow-900">Most Popular</Badge>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pro</CardTitle>
              {plan === 'pro' && <Badge className="bg-primary/10 text-primary">Aktif</Badge>}
            </div>
            <p className="text-3xl font-bold">{formatRp(PRICES.pro[period])}</p>
            <p className="text-xs text-muted-foreground">per {PERIOD_MONTHS[period]} bulan</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.pro.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
            {plan !== 'pro' && (
              <Button
                className="w-full mt-4 bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                onClick={() => setUpgradeTarget({ plan: 'pro', period })}
              >
                Upgrade ke Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-bold mb-4">FAQ</h2>
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="1" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Bagaimana cara upgrade?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Pilih plan dan periode, lalu transfer sesuai instruksi dan konfirmasi via WhatsApp. Akun diaktifkan dalam 1x24 jam.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="2" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Bisa ganti plan di tengah jalan?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Bisa. Sisa waktu langganan lama akan diperhitungkan sebagai kredit untuk plan baru. Hubungi kami via WhatsApp.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="3" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Ada refund tidak?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Untuk sekarang belum ada kebijakan refund. Kamu bisa coba fitur Gratis dulu sebelum upgrade.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="4" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Data saya aman?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Ya. Data tersimpan di Supabase (infrastruktur PostgreSQL enterprise). Kami tidak menjual data kamu ke pihak ketiga.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Payment dialog */}
      {upgradeTarget && user && (
        <Dialog open onOpenChange={() => setUpgradeTarget(null)}>
          <PaymentModal
            plan={upgradeTarget.plan}
            period={upgradeTarget.period}
            userId={user.userId}
            onClose={() => setUpgradeTarget(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
