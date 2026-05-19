import { useRef } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { OptimizedImage } from '@/components/OptimizedImage';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { Check, ChevronRight } from 'lucide-react';

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

const FEATURES = [
  { emoji: '📸', title: 'Scan Struk', desc: 'Upload foto struk, AI langsung parse dan catat otomatis.' },
  { emoji: '🤖', title: 'AI Kategorisasi', desc: 'Ketik bebas, AI yang kategoriin pengeluaranmu.' },
  { emoji: '💰', title: 'Split Bill', desc: 'Bagi tagihan bareng teman, share link langsung ke WhatsApp.' },
  { emoji: '📊', title: 'Laporan Bulanan', desc: 'Download laporan CSV atau ringkasan PDF tiap bulan.' },
  { emoji: '🎯', title: 'Goals & Budget', desc: 'Set target menabung dan pantau anggaran per kategori.' },
  { emoji: '👜', title: 'Multi-Wallet', desc: 'Lacak BCA, OVO, GoPay, Cash — semua dalam satu dashboard.' },
];

const STEPS = [
  { step: '1', icon: '📊', title: 'Buka dashboard web', desc: 'Daftar pakai Telegram ID atau Google dalam 30 detik.' },
  { step: '2', icon: '💬', title: 'Catat via Telegram', desc: 'Ketik /add 25000 makan siang ke bot kapan aja, dimana aja.' },
  { step: '3', icon: '📈', title: 'Lihat laporan real-time', desc: 'Dashboard langsung update. Lihat tren, budget, dan goals kamu.' },
];

const COMPARISON = [
  { item: 'Setup', ga: 'Instan, 30 detik', spreadsheet: 'Manual buat tabel', catatan: 'Manual tulis', buku: 'Manual tulis' },
  { item: 'Kategorisasi', ga: 'AI otomatis ✅', spreadsheet: 'Manual ❌', catatan: 'Manual ❌', buku: 'Manual ❌' },
  { item: 'Laporan & Tren', ga: 'Real-time + download ✅', spreadsheet: 'Hitung manual ❌', catatan: 'Tidak ada ❌', buku: 'Tidak ada ❌' },
  { item: 'Akses', ga: 'Web + Telegram ✅', spreadsheet: 'PC saja ⚠️', catatan: 'HP saja ⚠️', buku: 'Fisik saja ❌' },
  { item: 'Split Bill', ga: '✅', spreadsheet: '❌', catatan: '❌', buku: '❌' },
];

const PRICING = [
  {
    name: 'Gratis',
    price: 0,
    period: 'selamanya',
    badge: null as string | null,
    features: ['Catat transaksi unlimited', 'Dashboard basic', 'Budget 3 kategori'],
    cta: 'Mulai Gratis',
    ctaStyle: 'outline' as const,
  },
  {
    name: 'Starter',
    price: 9_900,
    period: '/bulan',
    badge: null as string | null,
    features: ['Semua fitur Gratis', 'Wallet tracking (3)', 'Split bill (5/bulan)', 'AI scan struk', 'Download CSV + PDF'],
    cta: 'Pilih Starter',
    ctaStyle: 'default' as const,
  },
  {
    name: 'Pro',
    price: 19_900,
    period: '/bulan',
    badge: 'Terpopuler' as string | null,
    features: ['Semua fitur Starter', 'Wallet unlimited', 'Split bill unlimited', 'AI Budget Recommendation', 'Risk Profile & Gajian'],
    cta: 'Pilih Pro',
    ctaStyle: 'default' as const,
  },
];

const FAQ = [
  { q: 'Apakah Gajian Aman gratis?', a: 'Ya, ada plan Gratis tanpa batas waktu. Upgrade ke Starter atau Pro untuk fitur lebih lengkap.' },
  { q: 'Bagaimana cara mulai?', a: 'Buka web, daftar pakai Telegram ID atau Google. Atau langsung cari bot di Telegram & kirim /start untuk setup cepat.' },
  { q: 'Data saya aman?', a: 'Ya. Tersimpan di Supabase (PostgreSQL enterprise). Tidak dijual ke pihak ketiga.' },
  { q: 'Apa bedanya web dan bot Telegram?', a: 'Web adalah dashboard utama untuk laporan, budget, & goals. Bot Telegram adalah cara praktis catat transaksi sehari-hari sambil chatting. Dua-duanya terintegrasi penuh.' },
  { q: 'Apa itu Gajian Credits?', a: 'Tidak ada lagi! Fitur AI sekarang berbasis plan langganan, bukan kredit terpisah.' },
];

export default function Landing() {
  const howItWorksRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <OptimizedImage
                src="/light-logo.png"
                alt="Gajian Aman"
                width={32}
                height={32}
                priority
              />
            </div>
            <span className="font-extrabold tracking-tight">Gajian Aman</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Coba Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero with Dynamic Background Video */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/50" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 text-white" style={{ backgroundColor: 'var(--color-brand-primary)', borderColor: 'var(--color-brand-primary)' }}>
            🇮🇩 Dibuat untuk pekerja Indonesia
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-white drop-shadow-lg">
            Udah gajian,<br />
            <span style={{ color: 'var(--color-brand-primary)' }}>tapi duit ke mana?</span>
          </h1>
          <p className="text-lg text-gray-100 max-w-xl mx-auto mb-10 drop-shadow-md">
            Dashboard keuangan lengkap. Catat transaksi via Telegram untuk kemudahan sehari-hari.
            AI yang kategoriin, kamu yang kontrol. Simple banget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2 px-8 text-white shadow-lg" style={{ backgroundColor: 'var(--color-brand-primary)' }}>
                Coba Gratis <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
            >
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </section>

      {/* 2. How It Works */}
      <section ref={howItWorksRef} className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Cara Kerjanya</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <div className="text-4xl">{s.icon}</div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features with Animated Background */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
        >
          <source src="/nexora-automation.mp4" type="video/mp4" />
        </video>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Fitur Unggulan</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border bg-card/95 hover:bg-card hover:border-primary/50 transition-all hover:shadow-lg backdrop-blur-sm"
              >
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Comparison */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Yuk Bandingin</h2>
          <p className="text-center text-muted-foreground mb-12">Gajian Aman vs cara lama</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-semibold text-muted-foreground">Fitur</th>
                  <th className="py-3 px-4 font-bold text-primary">Gajian Aman</th>
                  <th className="py-3 px-4 text-muted-foreground">Spreadsheet</th>
                  <th className="py-3 px-4 text-muted-foreground">Catatan HP</th>
                  <th className="py-3 px-4 text-muted-foreground">Buku Tulis</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.item} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{row.item}</td>
                    <td className="py-3 px-4 text-center text-primary font-medium">{row.ga}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{row.spreadsheet}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{row.catatan}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{row.buku}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Pricing */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Harga</h2>
          <p className="text-center text-muted-foreground mb-12">Mulai gratis, upgrade kalau udah siap</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border-2 p-6 relative ${p.badge ? 'border-primary' : 'border-border'}`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">{p.badge}</Badge>
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="mb-4">
                  <span className="text-3xl font-extrabold">{p.price === 0 ? 'Gratis' : formatRp(p.price)}</span>
                  {p.price > 0 && <span className="text-muted-foreground text-sm">{p.period}</span>}
                </p>
                <div className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-sentiment-positive)' }} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link to="/login">
                  <Button variant={p.ctaStyle} className="w-full">{p.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Social Proof */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kata Mereka</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Andi, 28', role: 'Software Engineer Jakarta', quote: 'Akhirnya ada apps finance yang gak ribet. Ketik di Telegram, beres.' },
              { name: 'Sari, 25', role: 'Marketing Staff Bandung', quote: 'Split bill bareng temen sekarang gak pake drama. Langsung share link!' },
              { name: 'Budi, 31', role: 'Freelancer Surabaya', quote: 'AI-nya akurat banget. Jarang salah kategoriin. Suka banget.' },
            ].map((t) => (
              <div key={t.name} className="bg-card rounded-2xl border p-6 space-y-3">
                <p className="text-sm text-muted-foreground italic">{'"'}{t.quote}{'"'}</p>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={String(i)} className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 8. CTA Footer */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-extrabold">Mulai gratis sekarang.</h2>
          <p className="text-primary-foreground/80">Gak perlu kartu kredit. Setup dalam 2 menit.</p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="gap-2 px-10">
              Mulai Sekarang <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>{'© 2025 Gajian Aman · Dibuat dengan ❤️ untuk pekerja Indonesia'}</p>
        <p className="mt-1">Powered by Claude AI · Supabase · Vercel</p>
      </footer>
    </div>
  );
}
