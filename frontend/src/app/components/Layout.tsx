import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Home,
  TrendingDown,
  Target,
  Star,
  History,
  TrendingUp,
  LogOut,
  Bell,
  Plus,
  Menu,
  X,
  Eye,
  EyeOff,
  Calendar,
  Users,
  User,
  Wallet,
  Crown,
  Zap,
  AlertCircle,
  Repeat2,
  Lightbulb,
  BarChart3,
  Percent,
  Sparkles,
  Layers,
  Settings,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionModal } from './TransactionModal';
import { GajianAmanMark } from './GajianAmanMark';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/hooks/useAuth';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { usePrivacy } from '@/hooks/usePrivacy';

const navItemsGrouped = {
  top: [
    { icon: Home, label: 'Overview', path: '/overview' },
    { icon: Zap, label: 'Gajian', path: '/gajian' },
  ],
  keuangan: [
    { icon: TrendingDown, label: 'Pengeluaran', path: '/pengeluaran' },
    { icon: TrendingUp, label: 'Pemasukan', path: '/pemasukan' },
    { icon: Target, label: 'Budget', path: '/budget' },
    { icon: Star, label: 'Goals', path: '/goals' },
    { icon: History, label: 'Riwayat', path: '/riwayat' },
  ],
  analitik: [
    { icon: FileText, label: 'Laporan', path: '/laporan' },
    { icon: Percent, label: 'Pola Waktu', path: '/spending-patterns' },
    { icon: BarChart3, label: 'Prakiraan', path: '/forecasting' },
    { icon: TrendingUp, label: 'Tren', path: '/tren' },
  ],
  alat: [
    { icon: Layers, label: 'Kategori', path: '/categories' },
    { icon: Wallet, label: 'Dompet', path: '/wallet' },
    { icon: Calendar, label: 'Kalender', path: '/kalender' },
    { icon: Sparkles, label: 'Asisten', path: '/asisten' },
  ],
  lainnya: [
    { icon: Repeat2, label: 'Tagihan', path: '/recurring' },
    { icon: Crown, label: 'Langganan', path: '/langganan' },
    { icon: Settings, label: 'Profil', path: '/profile' },
  ],
};

// Flatten for mobile navigation
const navItems = [
  ...navItemsGrouped.top,
  ...navItemsGrouped.keuangan,
  ...navItemsGrouped.analitik,
  ...navItemsGrouped.alat,
  ...navItemsGrouped.lainnya,
];

export function Layout() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { selectedMonth, setSelectedMonth, monthOptions } = useMonthFilter();
  const { isHidden, toggle } = usePrivacy();

  const userInitials = (user?.name ?? 'U').slice(0, 2).toUpperCase();
  const avatarSeed = user?.name ?? 'user';

  return (
    <div className="min-h-screen bg-[var(--color-bg-screen)]">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-to-main">
        Lompat ke konten utama
      </a>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[240px] lg:flex-col bg-[var(--color-sidebar-bg)] overflow-hidden"
        role="navigation"
        aria-label="Navigasi utama"
      >
        <div className="flex flex-col h-full">
          {/* Header - Non-scrolling */}
          <div className="shrink-0 space-y-6 px-6 py-8">
            <div className="flex items-center gap-3">
              <GajianAmanMark className="w-10 h-10" />
              <div className="flex flex-col">
                <h1 className="text-base font-extrabold tracking-tight text-[var(--color-sidebar-text)]">Gajian Aman</h1>
                <p className="text-xs text-[var(--color-sidebar-muted)] font-body">Safe Paycheck</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-sidebar-hover-bg)]">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-sidebar-text)] truncate">Halo, {user?.name ?? 'User'} 👋</p>
                <p className="text-xs text-[var(--color-sidebar-muted)]">ID: {user?.userId}</p>
              </div>
            </div>
          </div>

          {/* Nav - Scrollable */}
          <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
            {/* Top group */}
            {navItemsGrouped.top.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors relative border-l-4 ${
                    isActive
                      ? 'border-l-[var(--color-brand-primary)] bg-[var(--color-sidebar-active-bg)] text-[var(--color-brand-primary)]'
                      : 'border-l-transparent text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}

            {/* KEUANGAN Group */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-sidebar-label)] px-3 mt-5 mb-2">
              KEUANGAN
            </p>
            {navItemsGrouped.keuangan.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors relative border-l-4 ${
                    isActive
                      ? 'border-l-[var(--color-brand-primary)] bg-[var(--color-sidebar-active-bg)] text-[var(--color-brand-primary)]'
                      : 'border-l-transparent text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}

            {/* ANALITIK Group */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-sidebar-label)] px-3 mt-5 mb-2">
              ANALITIK
            </p>
            {navItemsGrouped.analitik.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors relative border-l-4 ${
                    isActive
                      ? 'border-l-[var(--color-brand-primary)] bg-[var(--color-sidebar-active-bg)] text-[var(--color-brand-primary)]'
                      : 'border-l-transparent text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}

            {/* ALAT Group */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-sidebar-label)] px-3 mt-5 mb-2">
              ALAT
            </p>
            {navItemsGrouped.alat.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors relative border-l-4 ${
                    isActive
                      ? 'border-l-[var(--color-brand-primary)] bg-[var(--color-sidebar-active-bg)] text-[var(--color-brand-primary)]'
                      : 'border-l-transparent text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}

            {/* LAINNYA Divider */}
            <hr className="border-[var(--color-border-neutral)] my-2 mx-3" />

            {/* LAINNYA Group - De-emphasized */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-sidebar-label)] px-3 mt-5 mb-2">
              LAINNYA
            </p>
            {navItemsGrouped.lainnya.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] transition-colors relative border-l-4 ${
                    isActive
                      ? 'border-l-[var(--color-brand-primary)] bg-[var(--color-sidebar-active-bg)] text-[var(--color-brand-primary)]'
                      : 'border-l-transparent text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer - Non-scrolling */}
          <div className="shrink-0 space-y-3 border-t border-[var(--color-border-neutral)] pt-3 pb-4 px-3">
            <p className="text-xs text-[var(--color-sidebar-muted)] text-center">
              Powered by Claude · Supabase
            </p>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-1">
              <GajianAmanMark className="w-6 h-6" variant="dark" />
              <h1 className="font-bold tracking-tight text-sm sm:text-base text-[var(--color-content-primary)]">Gajian Aman</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs sm:text-sm font-medium bg-transparent border-none focus:outline-none text-[var(--color-content-secondary)]"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Avatar className="w-7 h-7">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-[280px] h-full bg-sidebar"
              onClick={(e) => e.stopPropagation()}
            >
              <MobileNav
                navItems={navItems}
                currentPath={location.pathname}
                onNavigate={() => setIsMobileMenuOpen(false)}
                user={user}
                onLogout={logout}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-[240px]">
        {/* Desktop Top Bar */}
        <header
          className="hidden lg:block sticky top-0 z-30 w-full border-b border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60"
          role="banner"
        >
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <h1 className="font-bold text-lg text-[var(--color-content-primary)]">
                {navItems.find((item) => item.path === location.pathname)?.label || 'Overview'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="month-select" className="sr-only">
                Pilih bulan
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-[var(--radius-lg)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-screen)] text-sm font-medium text-[var(--color-content-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] input-focus-ring"
                aria-label="Filter bulan"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={isHidden ? 'Tampilkan jumlah uang' : 'Sembunyikan jumlah uang'}
                aria-pressed={isHidden}
                className="focus-ring-primary"
              >
                {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifikasi"
                className="focus-ring-primary"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={user?.name} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="px-2 py-3 sm:px-4 sm:py-4 lg:p-8 pb-24 lg:pb-8"
          role="main"
        >
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 z-50 left-1/2 -translate-x-1/2 lg:bottom-8 lg:right-8 lg:left-auto lg:translate-x-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] flex items-center justify-center transition-all group lg:hover:shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            'var(--shadow-card)',
            'var(--shadow-card-hover)',
            'var(--shadow-card)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
        title="Tambah Transaksi"
        aria-label="Tambah Transaksi Baru"
      >
        <Plus className="w-7 h-7 lg:w-8 lg:h-8" />
        {/* Tooltip on hover */}
        <span className="absolute bottom-full mb-3 px-3 py-1.5 bg-[var(--color-content-primary)] text-white text-xs rounded-[var(--radius-md)] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Tambah Transaksi
        </span>
      </motion.button>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]"
        role="navigation"
        aria-label="Navigasi seluler"
      >
        <div className="flex items-end justify-around h-16">
          {/* Beranda Tab */}
          <Link
            to="/overview"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors focus-ring-primary ${
              location.pathname === '/overview'
                ? 'text-[var(--color-brand-primary)]'
                : 'text-[var(--color-content-tertiary)]'
            }`}
            aria-current={location.pathname === '/overview' ? 'page' : undefined}
            aria-label="Beranda - Ikhtisar keuangan"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Beranda</span>
          </Link>

          {/* Dompet Tab */}
          <Link
            to="/riwayat"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors focus-ring-primary ${
              location.pathname === '/riwayat'
                ? 'text-[var(--color-brand-primary)]'
                : 'text-[var(--color-content-tertiary)]'
            }`}
            aria-current={location.pathname === '/riwayat' ? 'page' : undefined}
            aria-label="Dompet - Riwayat transaksi"
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dompet</span>
          </Link>

          {/* Center CTA - Empty space for floating FAB */}
          <div className="flex-1" aria-hidden="true" />

          {/* Analitik Tab */}
          <Link
            to="/tren"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors focus-ring-primary ${
              location.pathname === '/tren'
                ? 'text-[var(--color-brand-primary)]'
                : 'text-[var(--color-content-tertiary)]'
            }`}
            aria-current={location.pathname === '/tren' ? 'page' : undefined}
            aria-label="Analitik - Tren pengeluaran"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Analitik</span>
          </Link>

          {/* Profil Tab */}
          <Link
            to="/profile"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors focus-ring-primary ${
              location.pathname === '/profile'
                ? 'text-[var(--color-brand-primary)]'
                : 'text-[var(--color-content-tertiary)]'
            }`}
            aria-current={location.pathname === '/profile' ? 'page' : undefined}
            aria-label="Profil - Pengaturan akun"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => setTimeout(() => window.location.reload(), 600)}
      />
    </div>
  );
}
