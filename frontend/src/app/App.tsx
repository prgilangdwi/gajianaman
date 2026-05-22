import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Suspense, lazy } from 'react';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { NavigationProvider } from '@/hooks/useNavigation';
import { AuthProvider, RequireAuth, useAuth } from '@/hooks/useAuth';
import { MonthFilterProvider } from '@/hooks/useMonthFilter';
import { PrivacyProvider } from '@/hooks/usePrivacy';
import { WalletFilterProvider } from '@/hooks/useWalletFilter';
import { LoadingState } from './components/ScreenStates';

// Lazy-loaded pages
const Overview = lazy(() => import('./pages/Overview'));
const Pengeluaran = lazy(() => import('./pages/Pengeluaran'));
const Pemasukan = lazy(() => import('./pages/Pemasukan'));
const Budget = lazy(() => import('./pages/Budget'));
const Goals = lazy(() => import('./pages/Goals'));
const Riwayat = lazy(() => import('./pages/Riwayat'));
const Laporan = lazy(() => import('./pages/Laporan'));
const SmartAlerts = lazy(() => import('./pages/SmartAlerts'));
const Recurring = lazy(() => import('./pages/Recurring'));
const BudgetRecommendations = lazy(() => import('./pages/BudgetRecommendations'));
const Asisten = lazy(() => import('./pages/Asisten'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const LinkTelegram = lazy(() => import('./pages/LinkTelegram'));
const WalletPage = lazy(() => import('./pages/Wallet'));
const Kalender = lazy(() => import('./pages/Kalender'));
const Langganan = lazy(() => import('./pages/Langganan'));
const Landing = lazy(() => import('./pages/Landing'));
const Gajian = lazy(() => import('./pages/Gajian'));
const SplitBill = lazy(() => import('./pages/SplitBill'));
const SplitBillShare = lazy(() => import('./pages/SplitBillShare'));
const SpendingPatterns = lazy(() => import('./pages/SpendingPatterns'));
const Tren = lazy(() => import('./pages/Tren'));
const Forecasting = lazy(() => import('./pages/Forecasting'));
const CategoryBrowser = lazy(() => import('./pages/CategoryBrowser'));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CaraKerja = lazy(() => import('./pages/CaraKerja'));
const Fitur = lazy(() => import('./pages/Fitur'));
const Keamanan = lazy(() => import('./pages/Keamanan'));
const Testimonial = lazy(() => import('./pages/Testimonial'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Blog = lazy(() => import('./pages/Blog'));
const TentangKami = lazy(() => import('./pages/TentangKami'));
const SyaratKetentuan = lazy(() => import('./pages/SyaratKetentuan'));
const KebijakanPrivasi = lazy(() => import('./pages/KebijakanPrivasi'));

function SmartHome() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/home/overview" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrivacyProvider>
          <WalletFilterProvider>
            <MonthFilterProvider>
              <NavigationProvider>
                <Suspense fallback={<LoadingState />}>
                  <Routes>
                  <Route path="/" element={<SmartHome />} />

                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/v1/callback" element={<AuthCallback />} />
                  <Route path="/link-telegram" element={<LinkTelegram />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/split/:token" element={<SplitBillShare />} />

                  {/* Public Pages */}
                  <Route path="/cara-kerja" element={<CaraKerja />} />
                  <Route path="/fitur" element={<Fitur />} />
                  <Route path="/keamanan" element={<Keamanan />} />
                  <Route path="/testimonial" element={<Testimonial />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/tentang-kami" element={<TentangKami />} />
                  <Route path="/syarat-ketentuan" element={<SyaratKetentuan />} />
                  <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />

                  {/* Protected Routes - New Structure */}
                  <Route
                    element={
                      <RequireAuth>
                        <Layout />
                      </RequireAuth>
                    }
                  >
                    {/* Home Section */}
                    <Route path="/home/overview" element={<Overview />} />
                    <Route path="/home" element={<Navigate to="/home/overview" replace />} />

                    {/* Spend Section */}
                    <Route path="/spend/spending" element={<Pengeluaran />} />
                    <Route path="/spend/budget" element={<Budget />} />
                    <Route path="/spend/goals" element={<Goals />} />
                    <Route path="/spend" element={<Navigate to="/spend/spending" replace />} />

                    {/* Analytics Section */}
                    <Route path="/analytics/laporan" element={<Laporan />} />
                    <Route path="/analytics/tren" element={<Tren />} />
                    <Route path="/analytics/forecasting" element={<Forecasting />} />
                    <Route path="/analytics" element={<Navigate to="/analytics/laporan" replace />} />

                    {/* Tools Section */}
                    <Route path="/tools/wallets" element={<WalletPage />} />
                    <Route path="/tools/recurring" element={<Recurring />} />
                    <Route path="/tools/split" element={<SplitBill />} />
                    <Route path="/tools/categories" element={<CategoryBrowser />} />
                    <Route path="/tools" element={<Navigate to="/tools/wallets" replace />} />

                    {/* AI Section */}
                    <Route path="/ai/chat" element={<Asisten />} />
                    <Route path="/ai" element={<Navigate to="/ai/chat" replace />} />

                    {/* Other protected routes (unchanged paths) */}
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/langganan" element={<Langganan />} />
                    <Route path="/gajian" element={<Gajian />} />
                    <Route path="/category/:category" element={<CategoryDetail />} />
                    <Route path="/kalender" element={<Kalender />} />
                    <Route path="/smart-alerts" element={<SmartAlerts />} />
                    <Route path="/budget-recommendations" element={<BudgetRecommendations />} />
                    <Route path="/spending-patterns" element={<SpendingPatterns />} />
                  </Route>

                  {/* Backward Compatibility Redirects */}
                  <Route path="/overview" element={<Navigate to="/home/overview" replace />} />
                  <Route path="/pengeluaran" element={<Navigate to="/spend/spending" replace />} />
                  <Route path="/pemasukan" element={<Navigate to="/spend/spending" replace />} />
                  <Route path="/budget" element={<Navigate to="/spend/budget" replace />} />
                  <Route path="/goals" element={<Navigate to="/spend/goals" replace />} />
                  <Route path="/goal-progress" element={<Navigate to="/spend/goals" replace />} />
                  <Route path="/riwayat" element={<Navigate to="/home/overview" replace />} />
                  <Route path="/laporan" element={<Navigate to="/analytics/laporan" replace />} />
                  <Route path="/monthly-report" element={<Navigate to="/analytics/laporan" replace />} />
                  <Route path="/tren" element={<Navigate to="/analytics/tren" replace />} />
                  <Route path="/forecasting" element={<Navigate to="/analytics/forecasting" replace />} />
                  <Route path="/categories" element={<Navigate to="/tools/categories" replace />} />
                  <Route path="/wallet" element={<Navigate to="/tools/wallets" replace />} />
                  <Route path="/recurring" element={<Navigate to="/tools/recurring" replace />} />
                  <Route path="/split" element={<Navigate to="/tools/split" replace />} />
                  <Route path="/asisten" element={<Navigate to="/ai/chat" replace />} />
                  <Route path="/spending-patterns" element={<Navigate to="/analytics/tren" replace />} />
                  <Route path="/kalender" element={<Navigate to="/home/overview" replace />} />
                  <Route path="/smart-alerts" element={<Navigate to="/home/overview" replace />} />

                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
                <Toaster position="top-center" richColors />
              </NavigationProvider>
            </MonthFilterProvider>
          </WalletFilterProvider>
        </PrivacyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
