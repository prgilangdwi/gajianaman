import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { AuthProvider, RequireAuth } from '@/hooks/useAuth';
import { MonthFilterProvider } from '@/hooks/useMonthFilter';
import Overview from './pages/Overview';
import Pengeluaran from './pages/Pengeluaran';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Riwayat from './pages/Riwayat';
import Tren from './pages/Tren';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import LinkTelegram from './pages/LinkTelegram';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MonthFilterProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/link-telegram" element={<LinkTelegram />} />

            {/* Protected routes */}
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Overview />} />
              <Route path="/pengeluaran" element={<Pengeluaran />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/riwayat" element={<Riwayat />} />
              <Route path="/tren" element={<Tren />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </MonthFilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
