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
  ],
  keuangan: [
    { icon: TrendingDown, label: 'Pengeluaran', path: '/pengeluaran' },
    { icon: Target, label: 'Budget', path: '/budget' },
    { icon: Star, label: 'Goals', path: '/goals' },
    { icon: History, label: 'Riwayat', path: '/riwayat' },
  ],
  analitik: [
    { icon: TrendingUp, label: 'Laporan', path: '/laporan' },
    { icon: Percent, label: 'Pola Waktu', path: '/spending-patterns' },
    { icon: BarChart3, label: 'Prakiraan', path: '/forecasting' },
    { icon: BarChart3, label: 'Tren', path: '/spending-patterns' },
  ],
  alat: [
    { icon: Layers, label: 'Kategori', path: '/categories' },
    { icon: Zap, label: 'Gajian', path: '/gajian' },
    { icon: Wallet, label: 'Dompet', path: '/wallet' },
    { icon: Calendar, label: 'Kalender', path: '/kalender' },
    { icon: Sparkles, label: 'Asisten', path: '/asisten' },
  ],
  lainnya: [
    { icon: Repeat2, label: 'Berulang', path: '/recurring' },
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
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col bg-sidebar overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header - Non-scrolling */}
          <div className="shrink-0 space-y-6 px-6 py-8">
            <div className="flex items-center gap-3">
              <GajianAmanMark className="w-10 h-10" />
              <div className="flex flex-col">
                <h1 className="font-extrabold tracking-tight text-sidebar-foreground">Gajian Aman</h1>
                <p className="text-xs text-sidebar-foreground/60 font-body">Safe Paycheck</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/30">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-sidebar-foreground">Halo, {user?.name ?? 'User'} 👋</p>
                <p className="text-xs text-sidebar-foreground/60">ID: {user?.userId}</p>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}

            {/* KEUANGAN Group */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mt-5 mb-2">
              KEUANGAN
            </p>
            {navItemsGrouped.keuangan.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* ANALITIK Group */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mt-5 mb-2">
              ANALITIK
            </p>
            {navItemsGrouped.analitik.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* ALAT Group */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mt-5 mb-2">
              ALAT
            </p>
            {navItemsGrouped.alat.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* LAINNYA Divider */}
            <hr className="border-border my-2 mx-3" />

            {/* LAINNYA Group - De-emphasized */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mt-5 mb-2">
              LAINNYA
            </p>
            {navItemsGrouped.lainnya.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative text-xs ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer - Non-scrolling */}
          <div className="shrink-0 space-y-3 border-t border-sidebar-border pt-3 pb-4 px-3">
            <p className="text-xs text-sidebar-foreground/50 text-center">
              Powered by Claude · Supabase
            </p>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
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
              <h1 className="font-bold tracking-tight text-sm sm:text-base">Gajian Aman</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs sm:text-sm font-medium bg-transparent border-none focus:outline-none"
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
      <div className="lg:pl-[260px]">
        {/* Desktop Top Bar */}
        <header className="hidden lg:block sticky top-0 z-30 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <h2 className="font-bold">
                {navItems.find((item) => item.path === location.pathname)?.label || 'Overview'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border bg-input-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon" onClick={toggle} title={isHidden ? 'Tampilkan angka' : 'Sembunyikan angka'}>
                {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="px-2 py-3 sm:px-4 sm:py-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 z-50 right-6 max-sm:right-auto max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:bottom-[88px] w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:shadow-2xl transition-all group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 4px 20px rgba(74, 229, 74, 0.25)',
            '0 8px 40px rgba(74, 229, 74, 0.4)',
            '0 4px 20px rgba(74, 229, 74, 0.25)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
        title="Tambah Transaksi"
        aria-label="Tambah Transaksi Baru"
      >
        <Plus className="w-7 h-7 lg:w-8 lg:h-8" />
        {/* Tooltip on hover */}
        <span className="absolute bottom-full mb-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Tambah Transaksi
        </span>
      </motion.button>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-around px-0.5 py-1">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2 rounded-lg transition-colors flex-1 min-h-[52px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium leading-tight text-center line-clamp-2">{item.label}</span>
              </Link>
            );
          })}
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
