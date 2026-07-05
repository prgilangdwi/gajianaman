import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DollarSign, PiggyBank, TrendingUp, Info, Loader2 } from 'lucide-react';
import { cn, bgColorVar, textColorVar } from '@/lib/utils';

function GajianAmanMark({ className }: { className?: string }) {
  return <img src="/dark-logo.png" alt="Gajian Aman" className={className} />;
}
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface FloatingIconProps {
  icon: React.ElementType;
  style: React.CSSProperties;
  delay?: number;
}

function FloatingIcon({ icon: Icon, style, delay = 0 }: FloatingIconProps) {
  return (
    <motion.div
      className="absolute text-white/20 pointer-events-none"
      style={style}
      animate={{ y: [0, -18, 0], rotate: [0, 10, -10, 0], opacity: [0.15, 0.35, 0.15] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
 <Icon className="size-10 " />
    </motion.div>
  );
}

// Google G SVG icon
function GoogleIcon() {
  return (
 <svg className="size-5 " viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, loginWithTelegram, loginWithGoogle } = useAuth();
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true });
  }, [user, authLoading, navigate]);

  const handleTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) {
      toast.error('Masukkan Telegram ID kamu');
      return;
    }
    setLoading(true);
    const result = await loginWithTelegram(telegramId.trim());
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Selamat datang!');
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    if (result.error) {
      toast.error(result.error);
      setGoogleLoading(false);
    }
    // On success, page redirects to Google — no need to reset loading
  };

  if (authLoading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', bgColorVar('sidebar-bg'))}>
 <Loader2 className="size-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className={cn('flex-1 flex items-center justify-center px-4', bgColorVar('sidebar-bg'))}>
        <FloatingIcon icon={DollarSign} style={{ top: '15%', left: '5%' }} delay={0} />
        <FloatingIcon icon={PiggyBank} style={{ top: '20%', right: '8%' }} delay={1.2} />
        <FloatingIcon icon={TrendingUp} style={{ bottom: '20%', left: '10%' }} delay={0.6} />
        <FloatingIcon icon={PiggyBank} style={{ bottom: '15%', right: '6%' }} delay={1.8} />

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
            <CardHeader className="text-center space-y-3 pb-4">
              <motion.div
                className="mx-auto"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
 <GajianAmanMark className="size-16 " />
              </motion.div>
              <div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Gajian Aman
                </CardTitle>
                <p className={cn('text-sm mt-1 font-body font-semibold', textColorVar('brand-primary'))}>
                  Dashboard keuangan lengkap, catat transaksi via Telegram
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-sm font-semibold"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
 <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-2">Masuk dengan Google</span>
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">atau gunakan Telegram ID</span>
                </div>
              </div>

              {/* Telegram ID form */}
              <form onSubmit={handleTelegramSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telegram-id">Telegram ID</Label>
                  <Input
                    id="telegram-id"
                    type="text"
                    inputMode="numeric"
                    placeholder="cth. 123456789"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    className="text-base font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  className={cn('w-full h-11 text-base font-semibold text-white', bgColorVar('brand-primary'))}
                  disabled={loading || !telegramId}
                >
                  {loading ? (
 <><Loader2 className="size-4 mr-2 animate-spin" />Masuk…</>
                  ) : (
                    'Masuk ke Dashboard'
                  )}
                </Button>
              </form>

              {/* Info Banner */}
              <div className="flex gap-3 p-3 rounded-xl border bg-[rgba(74,229,74,0.05)] border-[rgba(74,229,74,0.2)]">
 <Info className={cn('size-4 flex-shrink-0 mt-0.5', textColorVar('brand-primary'))} />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Belum punya akun?{' '}
                  <span className="font-semibold text-slate-900">Kirim /start ke @GajianAmanBot</span>{' '}
                  di Telegram, atau mulai langsung dengan Google. Semua terintegrasi otomatis.
                </p>
              </div>

              <div className="flex justify-center gap-5 pt-1">
                {[
                  { icon: DollarSign, label: 'Catat' },
                  { icon: TrendingUp, label: 'Analisis' },
                  { icon: PiggyBank, label: 'Hemat' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
 <div className="size-10 rounded-xl flex items-center justify-center bg-[rgba(74,229,74,0.1)]">
 <Icon className={cn('size-5 ', textColorVar('brand-primary'))} />
                    </div>
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-slate-400 text-xs mt-4">
            Powered by Claude · Supabase
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <section className={cn('px-6 py-12', bgColorVar('sidebar-bg'))}>
        <Footer />
      </section>
    </div>
  );
}
