import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'gajian_aman_user';
const PENDING_KEY = 'gajian_aman_pending_google';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Menghubungkan akun Google...');

  useEffect(() => {
    async function handle() {
      // Supabase client automatically picks up the OAuth tokens from the URL
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setStatus('Login gagal. Kembali ke halaman login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      const googleId = session.user.id;
      const email = session.user.email ?? '';

      // Look up if this Google account is already linked to a Telegram user
      const { data: linked } = await supabase
        .from('users')
        .select('user_id, name, username')
        .eq('google_id', googleId)
        .maybeSingle();

      if (linked) {
        // Returning Google user — auto login
        const authUser = {
          userId: linked.user_id,
          name: linked.name ?? linked.username ?? email,
          email,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        navigate('/', { replace: true });
        return;
      }

      // First time — store pending session and ask to link Telegram ID
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ googleId, email, name: session.user.user_metadata?.full_name ?? '' }));
      setStatus('Akun baru. Menghubungkan ke Telegram...');
      navigate('/link-telegram', { replace: true });
    }

    handle();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}
