import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Home,
  TrendingDown,
  Target,
  Sparkles,
  History,
  TrendingUp,
  LogOut,
  Bell,
  Plus,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionModal } from './TransactionModal';

const navItems = [
  { icon: Home, label: 'Overview', path: '/' },
  { icon: TrendingDown, label: 'Pengeluaran', path: '/pengeluaran' },
  { icon: Target, label: 'Budget', path: '/budget' },
  { icon: Sparkles, label: 'Goals', path: '/goals' },
  { icon: History, label: 'Riwayat', path: '/riwayat' },
  { icon: TrendingUp, label: 'Tren', path: '/tren' },
];

export function Layout() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col bg-sidebar">
        <div className="flex flex-col gap-y-6 px-6 py-8 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sidebar-foreground">Gajian Aman</h1>
              <p className="text-xs text-sidebar-foreground/70">Safe Paycheck</p>
            </div>
          </div>

          {/* User Greeting */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/30">
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gilang" />
              <AvatarFallback>GI</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-sidebar-foreground">Halo, Gilang 👋</p>
              <p className="text-xs text-sidebar-foreground/60">gilang@email.com</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
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
          </nav>

          {/* Footer */}
          <div className="space-y-3 border-t border-sidebar-border pt-4">
            <p className="text-xs text-sidebar-foreground/50 text-center">
              Powered by Claude · Supabase
            </p>
            <Button
              variant="ghost"
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
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold">Gajian Aman</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-sm font-medium bg-transparent border-none focus:outline-none">
              <option>Mei 2026</option>
              <option>Apr 2026</option>
              <option>Mar 2026</option>
            </select>
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gilang" />
              <AvatarFallback>GI</AvatarFallback>
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
              <div className="flex flex-col gap-y-6 px-6 py-8 h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="font-extrabold text-sidebar-foreground">Gajian Aman</h1>
                    <p className="text-xs text-sidebar-foreground/70">Safe Paycheck</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/30">
                  <Avatar>
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gilang" />
                    <AvatarFallback>GI</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-sidebar-foreground">Halo, Gilang 👋</p>
                    <p className="text-xs text-sidebar-foreground/60">gilang@email.com</p>
                  </div>
                </div>

                <nav className="flex-1 space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
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
                </nav>

                <div className="space-y-3 border-t border-sidebar-border pt-4">
                  <p className="text-xs text-sidebar-foreground/50 text-center">
                    Powered by Claude · Supabase
                  </p>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
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
              <select className="px-3 py-2 rounded-lg border bg-input-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Mei 2026</option>
                <option>Apr 2026</option>
                <option>Mar 2026</option>
              </select>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gilang" />
                <AvatarFallback>GI</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 10px 30px rgba(16, 185, 129, 0.3)',
            '0 10px 40px rgba(16, 185, 129, 0.5)',
            '0 10px 30px rgba(16, 185, 129, 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Plus className="w-7 h-7 lg:w-8 lg:h-8" />
      </motion.button>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Transaction Modal */}
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
