import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  ChevronRight,
  Check,
  Wallet,
  PlusCircle,
  TrendingUp,
  Zap,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';

type OnboardingStep = 'welcome' | 'wallet' | 'features' | 'ready';

interface WalletSetup {
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  icon: string;
  initialBalance: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallets, refetch } = useWallets(user?.userId);

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [walletSetup, setWalletSetup] = useState<WalletSetup>({
    name: '',
    type: 'bank',
    icon: '🏦',
    initialBalance: '0',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Skip onboarding if user already has wallets
  if (wallets.length > 0) {
    navigate('/overview', { replace: true });
    return null;
  }

  const handleCreateWallet = async () => {
    if (!user || !walletSetup.name.trim()) {
      toast.error('Masukkan nama wallet');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          name: walletSetup.name,
          type: walletSetup.type,
          icon: walletSetup.icon,
          initial_balance: parseInt(walletSetup.initialBalance.replace(/\D/g, ''), 10) || 0,
          is_primary: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to create wallet');
      await refetch();
      setStep('features');
      toast.success('Wallet berhasil dibuat!');
    } catch (err) {
      toast.error('Gagal membuat wallet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    navigate('/overview', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl border-0">
              <CardHeader className="text-center pb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  👋
                </motion.div>
                <CardTitle className="text-3xl font-extrabold">
                  Selamat datang, {user?.name?.split(' ')[0]}!
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Mari setup dashboard keuangan kamu dalam 2 menit
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex gap-3">
 <div className="size-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
 <Check className="size-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Catat transaksi dari mana saja</p>
                      <p className="text-xs text-muted-foreground">Via web atau Telegram bot</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
 <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
 <Check className="size-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Lihat laporan real-time</p>
                      <p className="text-xs text-muted-foreground">Dashboard auto-update setiap transaksi</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
 <div className="size-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
 <Check className="size-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Kelola budget & goals</p>
                      <p className="text-xs text-muted-foreground">Track spending dan target menabung</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => setStep('wallet')}
                  className="w-full h-12 font-semibold gap-2"
                >
 Mulai Setup <ChevronRight className="size-4 " />
                </Button>

                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  Lewati untuk sekarang
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Create First Wallet */}
        {step === 'wallet' && (
          <motion.div
            key="wallet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Step 1 of 3</Badge>
                </div>
                <CardTitle className="text-2xl font-extrabold">Buat Wallet Pertama</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Wallet adalah wadah untuk track sumber dana (bank, cash, e-wallet, dll)
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Wallet Type Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase">Tipe Wallet</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'bank' as const, icon: '🏦', label: 'Bank' },
                      { type: 'ewallet' as const, icon: '💳', label: 'E-Wallet' },
                      { type: 'cash' as const, icon: '💵', label: 'Cash' },
                    ].map((option) => (
                      <button
                        type="button"
                        key={option.type}
                        onClick={() => setWalletSetup({ ...walletSetup, type: option.type, icon: option.icon })}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          walletSetup.type === option.type
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <p className="text-xs font-medium">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallet Name */}
                <div className="space-y-2">
                  <Label htmlFor="wallet-name">Nama Wallet</Label>
                  <Input
                    id="wallet-name"
                    placeholder="Contoh: BCA Utama, Gopay, Dompet Fisik"
                    value={walletSetup.name}
                    onChange={(e) => setWalletSetup({ ...walletSetup, name: e.target.value })}
                    autoFocus
                  />
                </div>

                {/* Initial Balance */}
                <div className="space-y-2">
                  <Label htmlFor="initial-balance">Saldo Awal (Opsional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    <Input
                      id="initial-balance"
                      placeholder="0"
                      value={walletSetup.initialBalance}
                      onChange={(e) =>
                        setWalletSetup({ ...walletSetup, initialBalance: e.target.value.replace(/\D/g, '') })
                      }
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Masukkan berapa saldo di wallet ini saat ini</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setStep('welcome')}
                    variant="outline"
                    className="flex-1"
                  >
                    Kembali
                  </Button>
                  <Button
                    onClick={handleCreateWallet}
                    disabled={isCreating || !walletSetup.name.trim()}
                    className="flex-1 gap-2"
                  >
                    {isCreating ? (
 <Loader2 className="size-4 animate-spin" />
                    ) : (
 <PlusCircle className="size-4 " />
                    )}
                    Buat Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Features Overview */}
        {step === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Step 2 of 3</Badge>
                </div>
                <CardTitle className="text-2xl font-extrabold">Jelajahi Fitur</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Feature Cards */}
                {[
                  { emoji: '📊', title: 'Dashboard', desc: 'Lihat overview keuangan harian' },
                  { emoji: '💬', title: 'Telegram Bot', desc: 'Catat transaksi sambil chatting' },
                  { emoji: '📋', title: 'Laporan', desc: 'Download laporan CSV & PDF' },
                  { emoji: '🎯', title: 'Goals & Budget', desc: 'Set target dan tracking progres' },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="text-2xl flex-shrink-0">{feature.emoji}</div>
                    <div>
                      <p className="font-semibold text-sm">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Actions */}
                <Button
                  onClick={() => setStep('ready')}
                  className="w-full h-12 font-semibold gap-2"
                >
 Lanjut <ChevronRight className="size-4 " />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Ready to Go */}
        {step === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl border-0 border-l-4 border-l-green-500">
              <CardHeader className="text-center pb-6">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl mb-4"
                >
                  🎉
                </motion.div>
                <CardTitle className="text-3xl font-extrabold">
                  Siap Memulai!
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Wallet kamu sudah siap. Mulai catat transaksi dan kelola keuangan!
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Quick Tips */}
                <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase">💡 Tips Cepat</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Klik tombol <span className="font-semibold">+</span> besar untuk catat transaksi</li>
                    <li>• Gunakan Telegram bot untuk catat saat mobile</li>
                    <li>• Download laporan di tab "Laporan"</li>
                  </ul>
                </div>

                {/* CTAs */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/overview', { replace: true })}
                    className="flex-1 h-12 font-semibold gap-2"
                  >
 Masuk Dashboard <ArrowRight className="size-4 " />
                  </Button>
                </div>

                <Button
                  onClick={() => navigate('/split', { replace: true })}
                  variant="outline"
                  className="w-full"
                >
 <Zap className="size-4 mr-2" />
                  Coba Split Bill
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
