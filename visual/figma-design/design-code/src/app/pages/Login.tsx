import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, DollarSign, PiggyBank, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Login() {
  const [telegramId, setTelegramId] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) {
      toast.error('Mohon masukkan Telegram ID');
      return;
    }
    toast.success('Login berhasil! Selamat datang di Gajian Aman');
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  const floatingIcons = [
    { Icon: DollarSign, delay: 0, duration: 3 },
    { Icon: PiggyBank, delay: 0.5, duration: 3.5 },
    { Icon: TrendingUp, delay: 1, duration: 4 },
    { Icon: Sparkles, delay: 1.5, duration: 3.2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {floatingIcons.map(({ Icon, delay, duration }, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/10"
          initial={{ y: 0, x: Math.random() * 100 - 50 }}
          animate={{
            y: [-20, 20, -20],
            x: [0, 10, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            left: `${20 + index * 20}%`,
            top: `${10 + index * 15}%`,
          }}
        >
          <Icon className="w-12 h-12 lg:w-16 lg:h-16" />
        </motion.div>
      ))}

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col items-center justify-center text-center space-y-6"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-2xl">
            <Sparkles className="w-16 h-16 text-primary-foreground" />
          </div>

          <div className="space-y-4">
            <h1 className="font-extrabold text-5xl bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Gajian Aman
            </h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Kelola keuangan dengan cerdas. Lacak pengeluaran, capai tujuan finansial, dan raih masa depan yang
              lebih aman.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-8">
            <motion.div
              className="p-4 rounded-xl bg-card border-2 border-primary/20"
              whileHover={{ y: -5, borderColor: 'var(--primary)' }}
            >
              <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs font-semibold">Track Income</p>
            </motion.div>
            <motion.div
              className="p-4 rounded-xl bg-card border-2 border-primary/20"
              whileHover={{ y: -5, borderColor: 'var(--primary)' }}
            >
              <PiggyBank className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs font-semibold">Save Smart</p>
            </motion.div>
            <motion.div
              className="p-4 rounded-xl bg-card border-2 border-primary/20"
              whileHover={{ y: -5, borderColor: 'var(--primary)' }}
            >
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs font-semibold">Grow Wealth</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-2xl border-2">
            <CardHeader className="space-y-3 pb-6">
              <div className="lg:hidden flex flex-col items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-center">
                  <h1 className="font-extrabold text-3xl">Gajian Aman</h1>
                  <p className="text-sm text-muted-foreground">Safe Paycheck</p>
                </div>
              </div>

              <CardTitle className="text-2xl lg:text-3xl text-center lg:text-left">
                Masuk ke Akun Anda
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center lg:text-left">
                Gunakan Telegram ID untuk mengakses dashboard keuangan Anda
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="telegramId" className="font-semibold">
                    Telegram ID
                  </Label>
                  <Input
                    id="telegramId"
                    type="text"
                    placeholder="Masukkan Telegram ID Anda"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="h-12"
                  />
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                    <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Belum tahu Telegram ID Anda? Dapatkan via{' '}
                      <a
                        href="https://t.me/SimpleID_Bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        @SimpleID_Bot
                      </a>
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Masuk ke Dashboard
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-xs text-center text-muted-foreground">
                    Dengan masuk, Anda menyetujui{' '}
                    <a href="#" className="text-primary hover:underline">
                      Syarat & Ketentuan
                    </a>{' '}
                    dan{' '}
                    <a href="#" className="text-primary hover:underline">
                      Kebijakan Privasi
                    </a>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Powered by <span className="font-semibold">Claude</span> ·{' '}
            <span className="font-semibold">Supabase</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
