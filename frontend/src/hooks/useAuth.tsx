import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  userId: number;
  name: string;
  email?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithTelegram: (telegramId: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'gajian_aman_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveUserFromStorage = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as AuthUser;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    setUser(resolveUserFromStorage());
    setIsLoading(false);
  }, [resolveUserFromStorage]);

  const setAndPersist = (u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  // ── Telegram ID login ─────────────────────────────────────────────────────
  const loginWithTelegram = async (telegramId: string): Promise<{ error?: string }> => {
    const numericId = parseInt(telegramId.trim(), 10);
    if (isNaN(numericId)) return { error: 'Telegram ID harus berupa angka' };

    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, username, email')
      .eq('user_id', numericId)
      .maybeSingle();

    if (error) {
      return { error: `Error DB: ${error.message} (${error.code})` };
    }
    if (!data) {
      return { error: 'Telegram ID tidak ditemukan. Kirim /start ke bot terlebih dahulu.' };
    }

    setAndPersist({
      userId: data.user_id,
      name: data.name ?? data.username ?? `User ${numericId}`,
      email: data.email ?? undefined,
    });
    return {};
  };

  // ── Google OAuth login ────────────────────────────────────────────────────
  const loginWithGoogle = async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Page will redirect — nothing to do here
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithTelegram, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate('/login', { replace: true });
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
