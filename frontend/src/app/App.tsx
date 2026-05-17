import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { AuthProvider, RequireAuth, useAuth } from '@/hooks/useAuth';
import { MonthFilterProvider } from '@/hooks/useMonthFilter';
import { PrivacyProvider } from '@/hooks/usePrivacy';
import { WalletFilterProvider } from '@/hooks/useWalletFilter';
import Overview from './pages/Overview';
import Pengeluaran from './pages/Pengeluaran';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Riwayat from './pages/Riwayat';
import Tren from './pages/Tren';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import LinkTelegram from './pages/LinkTelegram';
import WalletPage from './pages/Wallet';
import Kalender from './pages/Kalender';
import Langganan from './pages/Langganan';
import Landing from './pages/Landing';

function StubPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <p className="text-4xl">🚧</p>
      <p className="text-lg font-bold">{title}</p>
      <p className="text-sm text-muted-foreground">Fitur ini sedang dalam pengembangan.</p>
    </div>
  );
}

function SmartHome() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/overview" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrivacyProvider>
          <WalletFilterProvider>
          <MonthFilterProvider>
            <Routes>
              <Route path="/" element={<SmartHome />} />

              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/link-telegram" element={<LinkTelegram />} />

              <Route
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route path="/overview" element={<Overview />} />
                <Route path="/pengeluaran" element={<Pengeluaran />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/riwayat" element={<Riwayat />} />
                <Route path="/tren" element={<Tren />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/split" element={<StubPage title="Split Bill" />} />
                <Route path="/gajian" element={<StubPage title="Gajian" />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/langganan" element={<Langganan />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-center" richColors />
          </MonthFilterProvider>
          </WalletFilterProvider>
        </PrivacyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
