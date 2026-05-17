import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import Overview from './pages/Overview';
import Pengeluaran from './pages/Pengeluaran';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Riwayat from './pages/Riwayat';
import Tren from './pages/Tren';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/pengeluaran" element={<Pengeluaran />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/tren" element={<Tren />} />
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}