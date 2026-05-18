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
import Laporan from './pages/Laporan';
import SmartAlerts from './pages/SmartAlerts';
import Recurring from './pages/Recurring';
import BudgetRecommendations from './pages/BudgetRecommendations';
import Asisten from './pages/Asisten';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import LinkTelegram from './pages/LinkTelegram';
import WalletPage from './pages/Wallet';
import Kalender from './pages/Kalender';
import Langganan from './pages/Langganan';
import Landing from './pages/Landing';
import Gajian from './pages/Gajian';
import SplitBill from './pages/SplitBill';
import SplitBillShare from './pages/SplitBillShare';
import SpendingPatterns from './pages/SpendingPatterns';
import Tren from './pages/Tren';
import Forecasting from './pages/Forecasting';
import CategoryBrowser from './pages/CategoryBrowser';
import CategoryDetail from './pages/CategoryDetail';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';

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
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/split/:token" element={<SplitBillShare />} />

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
                <Route path="/goal-progress" element={<Navigate to="/goals" replace />} />
                <Route path="/riwayat" element={<Riwayat />} />
                <Route path="/laporan" element={<Laporan />} />
                <Route path="/monthly-report" element={<Navigate to="/laporan" replace />} />
                <Route path="/smart-alerts" element={<SmartAlerts />} />
                <Route path="/recurring" element={<Recurring />} />
                <Route path="/budget-recommendations" element={<BudgetRecommendations />} />
                <Route path="/spending-patterns" element={<SpendingPatterns />} />
                <Route path="/tren" element={<Tren />} />
                <Route path="/forecasting" element={<Forecasting />} />
                <Route path="/categories" element={<CategoryBrowser />} />
                <Route path="/category/:category" element={<CategoryDetail />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/split" element={<SplitBill />} />
                <Route path="/gajian" element={<Gajian />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/langganan" element={<Langganan />} />
                <Route path="/asisten" element={<Asisten />} />
                <Route path="/profile" element={<Profile />} />
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
