import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DollarSign, PiggyBank, TrendingUp, Info, Loader2 } from 'lucide-react';

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
      <Icon className="w-10 h-10" />
    </motion.div>
  );
}

// Google G SVG icon
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
    await loginWithGoogle();
    // Page will redirect — no need to reset loading
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D2818]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(150deg, #0D2818 0%, #0D3B2E 55%, #163D24 100%)' }}
    >
      <FloatingIcon icon={DollarSign} style={{ top: '8%', left: '6%' }} delay={0} />
      <FloatingIcon icon={PiggyBank} style={{ top: '12%', right: '8%' }} delay={1.2} />
      <FloatingIcon icon={TrendingUp} style={{ bottom: '14%', left: '10%' }} delay={0.6} />
      <FloatingIcon icon={PiggyBank} style={{ bottom: '10%', right: '6%' }} delay={1.8} />
      <FloatingIcon icon={DollarSign} style={{ top: '45%', left: '3%' }} delay={2.4} />
      <FloatingIcon icon={TrendingUp} style={{ top: '35%', right: '4%' }} delay={0.3} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center space-y-3 pb-4">
            <motion.div
              className="mx-auto"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <GajianAmanMark className="w-16 h-16" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                Gajian Aman
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-body">
                Dashboard keuangan lengkap, catat transaksi via Telegram
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-semibold border-2 hover:bg-gray-50 gap-2"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Masuk dengan Google
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
                className="w-full h-11 text-base font-semibold"
                disabled={loading || !telegramId}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Masuk…</>
                ) : (
                  'Masuk ke Dashboard'
                )}
              </Button>
            </form>

            {/* Info Banner */}
            <div className="flex gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Belum punya akun?{' '}
                <span className="font-semibold text-primary">Kirim /start ke @GajianAmanBot</span>{' '}
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
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/60 text-xs mt-4">
          Powered by Claude · Supabase
        </p>
      </motion.div>
    </div>

      {/* Footer — white section below the dark hero */}
      <section style={{ background: '#ffffff', padding: '48px 24px' }}>
        <Footer />
      </section>
    </div>
  );
}
