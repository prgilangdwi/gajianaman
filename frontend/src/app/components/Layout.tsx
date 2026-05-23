import { useState, useCallback } from 'react';
import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { DesktopSidebar } from './layout/DesktopSidebar';
import { HeaderBar } from './layout/HeaderBar';
import { SectionTabBar } from './layout/SectionTabBar';
import { BottomNavigation } from './BottomNavigation';
import { MobileFilterSheet } from './layout/MobileFilterSheet';
import { QuickAddSheet } from '@/components/features/transactions/QuickAddSheet';
import { useTransactionEventStore } from '@/stores/transactionEventStore';
import type { Transaction } from '@/lib/supabase';

export function Layout() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const addTransaction = useTransactionEventStore((s) => s.addTransaction);

  const handleQuickAddSuccess = useCallback(
    (transaction: Transaction) => {
      addTransaction(transaction);
    },
    [addTransaction]
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-screen)]">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-to-main">
        Lompat ke konten utama
      </a>

      {/* Tablet Sidebar - Rail Mode (768px-1023px) */}
      <div className="hidden md:block lg:hidden">
        <DesktopSidebar isRailMode={true} />
      </div>

      {/* Desktop Sidebar - Normal Mode (1024px+) */}
      <div className="hidden lg:block">
        <DesktopSidebar isRailMode={false} />
      </div>

      {/* Main Content Area with responsive margin for sidebar */}
      <div className="min-h-screen flex flex-col md:ml-[60px] lg:ml-[200px]">
        {/* Mobile Header Bar */}
        <div className="lg:hidden">
          <HeaderBar
            variant="mobile"
            onOpenFilters={() => setIsFilterSheetOpen(true)}
          />
        </div>

        {/* Desktop Header Bar */}
        <div className="hidden lg:block">
          <HeaderBar
            variant="desktop"
            onOpenFilters={() => setIsFilterSheetOpen(true)}
          />
        </div>

        {/* Section Tab Bar (conditional based on section) */}
        <SectionTabBar />

        {/* Main Content with padding for mobile bottom nav */}
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto pb-20 md:pb-6 px-3 md:px-6 py-4 md:py-6"
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation (mobile only, lg:hidden) */}
      <BottomNavigation />

      {/* Mobile Filter Sheet (mobile only) */}
      <MobileFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
      />

      {/* Quick Add FAB Button — positioned to avoid BottomNav collision */}
      <motion.div
        className="fixed bottom-20 right-4 md:bottom-8 md:right-6 z-30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsQuickAddOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white"
          aria-label="Tambah transaksi cepat"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* QuickAddSheet for mobile-first transaction entry */}
      <QuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={handleQuickAddSuccess}
        type="expense"
      />
    </div>
  );
}
