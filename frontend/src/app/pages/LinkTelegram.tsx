import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, Link, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';

const STORAGE_KEY = 'gajian_aman_user';
const PENDING_KEY = 'gajian_aman_pending_google';

interface PendingSession {
  googleId: string;
  email: string;
  name: string;
}

export default function LinkTelegram() {
  const navigate = useNavigate();
  const [telegramId, setTelegramId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState<PendingSession | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) {
      // No pending Google session — redirect to login
      navigate('/login', { replace: true });
      return;
    }
    try {
      setPending(JSON.parse(raw));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;

    const numericId = parseInt(telegramId.trim(), 10);
    if (isNaN(numericId)) {
      toast.error('Telegram ID harus berupa angka');
      return;
    }

    setIsLoading(true);

    // Verify Telegram user exists
    const { data: existing, error } = await supabase
      .from('users')
      .select('user_id, name, username, google_id')
      .eq('user_id', numericId)
      .maybeSingle();

    if (error) {
      toast.error(`Error DB: ${error.message} (${error.code})`);
      setIsLoading(false);
      return;
    }
    if (!existing) {
      toast.error('Telegram ID tidak ditemukan. Pastikan sudah kirim /start ke bot.');
      setIsLoading(false);
      return;
    }

    if (existing.google_id && existing.google_id !== pending.googleId) {
      toast.error('Akun Telegram ini sudah terhubung ke Google account lain.');
      setIsLoading(false);
      return;
    }

    // Link the Google ID to this Telegram user
    const { error: updateError } = await supabase
      .from('users')
      .update({ google_id: pending.googleId, email: pending.email })
      .eq('user_id', numericId);

    if (updateError) {
      toast.error('Gagal menghubungkan akun: ' + updateError.message);
      setIsLoading(false);
      return;
    }

    // Login
    const authUser = {
      userId: existing.user_id,
      name: existing.name ?? existing.username ?? pending.name ?? `User ${numericId}`,
      email: pending.email,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    sessionStorage.removeItem(PENDING_KEY);

    toast.success('Akun berhasil dihubungkan!');
    navigate('/', { replace: true });
  };

  if (!pending) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Link className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-extrabold">Hubungkan Akun</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Login Google berhasil sebagai<br />
              <span className="font-semibold text-foreground">{pending.email}</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Masukkan Telegram ID kamu untuk menghubungkan akun Google ini ke data finansialmu. Lakukan ini sekali saja.
              </p>
            </div>

            <form onSubmit={handleLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-id">Telegram ID</Label>
                <Input
                  id="telegram-id"
                  type="text"
                  inputMode="numeric"
                  placeholder="contoh: 123456789"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                  className="h-12 text-lg font-mono"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Cari di Telegram: buka <span className="font-medium">Settings → Advanced → Telegram ID</span>, atau kirim pesan ke{' '}
                  <span className="font-semibold text-primary">@userinfobot</span> untuk melihat ID kamu.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !telegramId}
                className="w-full h-12 bg-primary hover:bg-primary-dark font-semibold"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menghubungkan...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Hubungkan & Masuk</>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { sessionStorage.removeItem(PENDING_KEY); navigate('/login'); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Batal, kembali ke login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
