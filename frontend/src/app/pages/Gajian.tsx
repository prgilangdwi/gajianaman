import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import GajianWizard from '@/app/components/GajianWizard';

export default function Gajian() {
  const [showWizard, setShowWizard] = useState(false);
  const prefersReduced = useReducedMotion();

  if (showWizard) {
    return <GajianWizard onBack={() => setShowWizard(false)} />;
  }

  return (
    <motion.div
      className="min-h-screen pb-20 px-4 sm:px-6"
      variants={pageEnter}
      initial="hidden"
      animate="visible"
      transition={prefersReduced ? { duration: 0 } : { duration: 0.5 }}
    >
      {/* Hero Section */}
      <motion.div
        className="max-w-2xl mx-auto pt-12 pb-8"
        variants={fadeUp}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.6, delay: 0.1 }}
      >
        <div className="text-center space-y-4">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: 'var(--color-brand-primary)' }}
            animate={prefersReduced ? {} : { scale: [1, 1.05, 1] }}
            transition={prefersReduced ? {} : { duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className={cn('text-4xl font-bold leading-tight', textColorVar('content-primary'))}>
            Konfigurasi Gajian Aman
          </h1>
          <p className={cn('text-lg', textColorVar('content-secondary'))}>
            Biarkan AI merekomendasikan anggaran yang sempurna berdasarkan gaji dan pengeluaran tetap Anda
          </p>
        </div>
      </motion.div>

      {/* Benefits Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12"
        variants={fadeUp}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
      >
        {[
          {
            icon: Zap,
            title: 'Analisis Cepat',
            description: 'Dapatkan rekomendasi anggaran dalam hitungan detik',
          },
          {
            icon: TrendingUp,
            title: 'Dipersonalisasi',
            description: 'AI menyesuaikan dengan profil risiko dan pengeluaran Anda',
          },
          {
            icon: Sparkles,
            title: 'Dioptimalkan',
            description: 'Maksimalkan penghematan sambil mempertahankan fleksibilitas',
          },
        ].map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={index}
              variants={fadeUp}
              transition={prefersReduced ? { duration: 0 } : { duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <Card
                className={cn(
                  'p-6 text-center border-2 transition-all hover:shadow-lg',
                  bgColorVar('bg-card'),
                  borderColorVar('border-neutral')
                )}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 text-white"
                  style={{ background: 'var(--color-brand-primary)' }}
                  animate={prefersReduced ? {} : { y: [0, -4, 0] }}
                  transition={prefersReduced ? {} : { duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <h3 className={cn('font-semibold mb-2 text-sm', textColorVar('content-primary'))}>
                  {benefit.title}
                </h3>
                <p className={cn('text-xs', textColorVar('content-secondary'))}>
                  {benefit.description}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA Card */}
      <motion.div
        className="max-w-2xl mx-auto mb-8"
        variants={fadeUp}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.6, delay: 0.4 }}
      >
        <Card
          className={cn(
            'p-8 border-2 border-dashed',
            bgColorVar('bg-card'),
            borderColorVar('border-brand-primary')
          )}
        >
          <div className="text-center space-y-4">
            <p className={cn('text-lg', textColorVar('content-primary'))}>
              Siap mengatur keuangan Anda dengan lebih cerdas?
            </p>
            <motion.button
              onClick={() => setShowWizard(true)}
              whileHover={prefersReduced ? {} : { scale: 1.02 }}
              whileTap={prefersReduced ? {} : { scale: 0.98 }}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 text-white font-semibold"
                style={{
                  background: 'var(--color-brand-primary)',
                }}
              >
                Mulai Wizard
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.button>
          </div>
        </Card>
      </motion.div>

      {/* Info Section */}
      <motion.div
        className="max-w-2xl mx-auto"
        variants={fadeUp}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.6, delay: 0.5 }}
      >
        <Card
          className={cn('p-6', bgColorVar('bg-card'), borderColorVar('border-neutral'))}
        >
          <h3 className={cn('font-semibold mb-4 flex items-center gap-2', textColorVar('content-primary'))}>
            <Sparkles className="w-5 h-5" />
            Apa yang Kami Butuhkan?
          </h3>
          <ul className={cn('space-y-2 text-sm', textColorVar('content-secondary'))}>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-brand-primary)] font-bold">1.</span>
              <span>Tanggal gajian Anda (1-28 dalam sebulan)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-brand-primary)] font-bold">2.</span>
              <span>Jumlah gaji bulanan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-brand-primary)] font-bold">3.</span>
              <span>Pengeluaran tetap Anda (sewa, utilitas, dll)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-brand-primary)] font-bold">4.</span>
              <span>Preferensi risiko (Konservatif, Seimbang, atau Agresif)</span>
            </li>
          </ul>
        </Card>
      </motion.div>
    </motion.div>
  );
}
