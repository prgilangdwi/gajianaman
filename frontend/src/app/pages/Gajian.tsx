import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Sparkles, Zap, User, TrendingUp, ChevronRight, Calendar, DollarSign, BarChart3, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import GajianWizard from '../components/GajianWizard';

// ── Data ──────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Zap,
    emoji: '⚡',
    title: 'Analisis Cepat',
    description: 'AI menganalisis profil keuangan kamu dalam hitungan detik dan menghasilkan anggaran yang realistis.',
  },
  {
    icon: User,
    emoji: '🎯',
    title: 'Personal',
    description: 'Rekomendasi disesuaikan dengan gaji, pengeluaran tetap, dan profil risiko keuangan unik milik kamu.',
  },
  {
    icon: TrendingUp,
    emoji: '📈',
    title: 'Optimal',
    description: 'Alokasi yang dirancang untuk memaksimalkan tabungan sambil tetap nyaman dengan pengeluaran sehari-hari.',
  },
];

const DATA_NEEDED = [
  { icon: DollarSign, label: 'Jumlah gaji bulanan', hint: 'Gaji bersih setelah pajak' },
  { icon: Calendar, label: 'Tanggal gajian', hint: 'Tanggal 1–28 setiap bulan' },
  { icon: BarChart3, label: 'Pengeluaran tetap', hint: 'Sewa, cicilan, tagihan rutin' },
  { icon: Shield, label: 'Profil risiko', hint: 'Konservatif, moderat, atau agresif' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Gajian() {
  const prefersReduced = useReducedMotion();
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.2 }}
        className="min-h-full py-4 sm:py-8"
      >
        <GajianWizard onBack={() => setShowWizard(false)} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-8 pb-8"
    >
      {/* Hero section */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.3, delay: prefersReduced ? 0 : 0.05 }}
        className="text-center space-y-4 pt-4 sm:pt-8"
      >
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: prefersReduced ? 0 : 0.4,
            delay: prefersReduced ? 0 : 0.1,
            ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          className={cn(
 'size-20 rounded-2xl mx-auto flex items-center justify-center',
            'bg-[var(--color-brand-primary)]',
          )}
          aria-hidden="true"
        >
 <Sparkles className="size-10 text-white" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-content-primary)]">
            Wizard Gajian
          </h1>
          <p className="text-base text-[var(--color-content-secondary)] max-w-sm mx-auto leading-relaxed">
            Biarkan AI merancang anggaran bulanan yang ideal berdasarkan kondisi keuangan kamu — gratis, cepat, dan personal.
          </p>
        </div>

        <Button
          onClick={() => setShowWizard(true)}
          size="lg"
          className={cn(
            'bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)]',
            'text-white font-semibold px-8 gap-2',
          )}
          aria-label="Mulai Wizard Gajian untuk membuat rekomendasi anggaran"
        >
 <Sparkles className="size-5 " />
          Mulai Wizard
 <ChevronRight className="size-4 " />
        </Button>
      </motion.div>

      {/* Benefit cards */}
      <section aria-labelledby="benefits-heading">
        <motion.h2
          id="benefits-heading"
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={{ ...fadeUp.transition, delay: prefersReduced ? 0 : 0.15 }}
          className="text-sm font-semibold text-[var(--color-content-tertiary)] text-center uppercase tracking-wider mb-4"
        >
          Mengapa Wizard Gajian?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0 : 0.25,
                delay: prefersReduced ? 0 : 0.2 + index * 0.08,
              }}
            >
              <Card
                className={cn(
                  bgColorVar('bg-card'),
                  borderColorVar('border-neutral'),
                  'h-full',
                )}
              >
                <CardContent className="pt-5 space-y-3">
                  <div
                    className={cn(
 'size-10 rounded-xl flex items-center justify-center',
                      bgColorVar('bg-elevated'),
                    )}
                    aria-hidden="true"
                  >
                    <span className="text-xl" role="img" aria-label={benefit.title}>
                      {benefit.emoji}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[var(--color-content-primary)]">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-[var(--color-content-secondary)] leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Data needed section */}
      <motion.section
        aria-labelledby="data-needed-heading"
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25, delay: prefersReduced ? 0 : 0.4 }}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-5 space-y-4">
            <h2
              id="data-needed-heading"
              className="font-semibold text-[var(--color-content-primary)]"
            >
              Data yang dibutuhkan
            </h2>
            <p className="text-sm text-[var(--color-content-secondary)]">
              Wizard hanya memerlukan 4 informasi dasar — tidak ada data sensitif seperti nomor rekening atau kata sandi.
            </p>

            <ul className="space-y-3" role="list">
              {DATA_NEEDED.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.label}
                    className="flex items-center gap-3"
                    role="listitem"
                  >
                    <div
                      className={cn(
 'size-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        bgColorVar('bg-elevated'),
                      )}
                      aria-hidden="true"
                    >
 <Icon className="size-4 text-[var(--color-brand-primary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-content-primary)]">
                        {item.label}
                      </p>
                      <p className="text-xs text-[var(--color-content-tertiary)]">
                        {item.hint}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="pt-2">
              <Button
                onClick={() => setShowWizard(true)}
                variant="outline"
                className="w-full sm:w-auto gap-2"
                aria-label="Mulai Wizard Gajian"
              >
 <Sparkles className="size-4 " />
                Mulai Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
}
