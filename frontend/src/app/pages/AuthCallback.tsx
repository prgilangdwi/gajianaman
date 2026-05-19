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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Supabase session error:', error);
          setStatus(`Login gagal: ${error.message}. Kembali ke halaman login...`);
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        if (!session) {
          console.error('No session returned from OAuth callback');
          setStatus('Google OAuth belum dikonfigurasi di Supabase. Hubungi admin.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

      const googleId = session.user.id;
      const email = session.user.email ?? '';

      // Try by google_id first
      let { data: linked } = await supabase
        .from('users')
        .select('user_id, name, username')
        .eq('google_id', googleId)
        .maybeSingle();

      // Fallback: try by email (covers users who linked before google_id column existed)
      if (!linked && email) {
        const { data: byEmail } = await supabase
          .from('users')
          .select('user_id, name, username')
          .eq('email', email)
          .maybeSingle();
        linked = byEmail;

        // Backfill google_id so future lookups use the fast path
        if (linked) {
          await supabase
            .from('users')
            .update({ google_id: googleId })
            .eq('user_id', linked.user_id);
        }
      }

      if (linked) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          userId: linked.user_id,
          name: linked.name ?? linked.username ?? email,
          email,
        }));
        navigate('/overview', { replace: true });
        return;
      }

        // First time — store pending session and ask to link Telegram ID
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({
          googleId,
          email,
          name: session.user.user_metadata?.full_name ?? '',
        }));
        setStatus('Akun baru. Menghubungkan ke Telegram...');
        navigate('/link-telegram', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('Terjadi kesalahan. Kembali ke halaman login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
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
