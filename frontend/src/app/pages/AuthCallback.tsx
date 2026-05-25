import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'gajian_aman_user';
const PENDING_KEY = 'gajian_aman_pending_google';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Menghubungkan akun Google...');

  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    const delay = (ms: number) => new Promise<void>(resolve => {
      timeoutIds.push(setTimeout(resolve, ms));
    });

    async function handle() {
      try {
        // Wait a bit for Supabase to fully process the OAuth
        await delay(500);

        // Try to get session multiple times as OAuth state might not be immediately available
        let session = null;
        let attempts = 0;
        while (!session && attempts < 3) {
          const { data: { session: s }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Session error:', error);
            break;
          }
          session = s;
          if (!session) {
            await delay(300);
            attempts++;
          }
        }

        if (!session) {
          console.error('No session available after OAuth');
          setStatus('Tidak dapat menemukan session. Coba lagi...');
          timeoutIds.push(setTimeout(() => navigate('/login', { replace: true }), 2000));
          return;
        }

        const googleId = session.user.id;
        const email = session.user.email ?? '';
        const fullName = session.user.user_metadata?.full_name ?? '';

        console.log('OAuth session found:', { googleId, email });

        // Try by google_id first
        let { data: linked, error: lookupError } = await supabase
          .from('users')
          .select('user_id, name, username, email')
          .eq('google_id', googleId)
          .maybeSingle();

        if (lookupError) {
          console.error('Error looking up by google_id:', lookupError);
        }

        // Fallback: try by email
        if (!linked && email) {
          const { data: byEmail, error: emailError } = await supabase
            .from('users')
            .select('user_id, name, username, email')
            .eq('email', email)
            .maybeSingle();

          if (emailError) {
            console.error('Error looking up by email:', emailError);
          } else if (byEmail) {
            linked = byEmail;
            // Backfill google_id
            await supabase
              .from('users')
              .update({ google_id: googleId })
              .eq('user_id', linked.user_id);
            console.log('Backfilled google_id for existing user');
          }
        }

        if (linked) {
          // User found — log them in
          console.log('User found in database:', linked.user_id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            userId: linked.user_id,
            name: linked.name ?? linked.username ?? email ?? fullName,
            email: linked.email ?? email,
          }));
          window.dispatchEvent(new Event('gajian-auth-updated'));
          setStatus('Masuk berhasil. Membuka dashboard...');
          // Give them a moment to see the success message
          await delay(500);
          navigate('/overview', { replace: true });
          return;
        }

        // First time Google user — create new account without requiring Telegram
        console.log('New Google user, creating account');

        // Generate a unique user_id for Google-only users (use negative ID to avoid Telegram collision)
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000000);
        const newUserId = -(timestamp + randomNum); // Negative ID for Google-only accounts

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: newUserId,
            google_id: googleId,
            email,
            name: fullName || email.split('@')[0],
            username: `user_${Math.abs(newUserId).toString().slice(-6)}`,
            currency: 'IDR',
            timezone: 'Asia/Jakarta',
          })
          .select('user_id, name, email')
          .single();

        if (insertError) {
          console.error('Error creating new user:', insertError);
          setStatus(`Gagal membuat akun: ${insertError.message}`);
          timeoutIds.push(setTimeout(() => navigate('/login', { replace: true }), 3000));
          return;
        }

        if (newUser) {
          console.log('New account created:', newUser.user_id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            userId: newUser.user_id,
            name: newUser.name,
            email: newUser.email,
          }));
          window.dispatchEvent(new Event('gajian-auth-updated'));
          setStatus('Akun baru berhasil dibuat. Membuka dashboard...');
          await delay(500);
          navigate('/overview', { replace: true });
          return;
        }

        setStatus('Gagal membuat akun. Coba lagi...');
        timeoutIds.push(setTimeout(() => navigate('/login', { replace: true }), 3000));
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        timeoutIds.push(setTimeout(() => navigate('/login', { replace: true }), 3000));
      }
    }

    handle();
    return () => { for (const id of timeoutIds) clearTimeout(id); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
 <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}
