# PHASE 03: NAVIGATION & LAYOUT RESTRUCTURING

> **Phase:** 03 of 12  
> **Name:** Navigation & Layout Restructuring  
> **Duration:** 5–7 days (3 Claude Code sessions)  
> **Dependencies:** Phase 02 (Design System Foundation) complete  
> **Status:** NOT STARTED

---

## CROSS-REFERENCE

| Document | Section |
|----------|---------|
| `GAJIAN_AMAN_REDESIGN_STRATEGY.md` | §3 Information Architecture Redesign, §3.1–3.4 |
| `GAJIAN_AMAN_REVAMP_AUDIT_REPORT.md` | §3 Application Structure Map, §4.1 Overview nav issues |
| `GAJIAN_AMAN_PROJECT_CONTEXT.md` | §6 UI/UX Architecture, Navigation Groups |
| `GAJIAN_AMAN_FIGMA_PRODUCTION_SYSTEM.md` | Bottom Navigation, Sidebar frames |

---

## SCOPE BOUNDARIES

### ✅ IN-SCOPE

1. **New 5-icon BottomNavigation component** for mobile (375–768px)
2. **Redesigned desktop Sidebar** (200px fixed, 5 primary sections + sub-nav)
3. **Collapsible icon-only rail** for tablet breakpoint (768–1024px, 60px width)
4. **Responsive `Layout.tsx` refactor** (3 breakpoints: mobile/tablet/desktop)
5. **New route structure** in `App.tsx` (grouped under section paths)
6. **`NavigationProvider` context** (persists active section + tab state)
7. **Tab navigation within sections** (e.g., Spend → Spending | Budget | Goals)
8. **`HeaderBar` component** (page title, filters toggle, menu actions)
9. **`MobileFilterSheet` component** (bottom sheet for month/wallet filters)
10. **Redirect routes** for old paths → new paths (backward compatibility)
11. **Update all internal `<Link>` references** across existing pages

### ❌ OUT-OF-SCOPE

1. Page content/logic changes (pages render identically, only route paths change)
2. Data fetching hooks (no changes to `useTransactions`, `useBudgets`, etc.)
3. Component internal logic (no changes to `TransactionModal`, `BudgetCard`, etc.)
4. Design tokens (use Phase 02 tokens as-is; no new CSS variables)
5. Backend API changes
6. New page creation (only re-routing existing pages)
7. Animation system changes (use existing `transitions.ts` presets)
8. Authentication flow changes
9. Marketing/public page routing

---

## DO NOT TOUCH SECTIONS

> [!CAUTION]
> These files/modules must NOT be modified during Phase 03.

| File/Module | Reason |
|------------|--------|
| `frontend/src/app/components/ui/*` | shadcn/ui primitives — never edit |
| `frontend/src/hooks/useAuth.tsx` | Auth context — stable |
| `frontend/src/hooks/useTransactions.ts` | Data fetching — stable |
| `frontend/src/hooks/useBudgets.ts` | Data fetching — stable |
| `frontend/src/hooks/useGoals.ts` | Data fetching — stable |
| `frontend/src/hooks/useWallets.ts` | Data fetching — stable |
| `frontend/src/hooks/useCategories.ts` | Data fetching — stable |
| `frontend/src/hooks/useRecurringBills.ts` | Data fetching — stable |
| `frontend/src/hooks/data/*` | Computed data hooks — stable |
| `frontend/src/lib/supabase.ts` | Type definitions — stable |
| `frontend/src/lib/utils.ts` | Color helpers — stable |
| `frontend/src/lib/transitions.ts` | Animation presets — stable |
| `frontend/src/styles/theme.css` | Design tokens — Phase 02 output |
| `frontend/src/styles/fonts.css` | Font imports — stable |
| `frontend/src/app/pages/*.tsx` | All page contents (route paths change, not content) |
| `frontend/api/*` | Vercel serverless functions — stable |
| `db/*` | Database operations — stable |
| `bot/*` | Telegram bot — stable |

---

## PRE-FLIGHT CHECKS

Before starting Phase 03, verify ALL of the following:

- [ ] Phase 02 merged and deployed: `theme.css` has all design tokens
- [ ] `frontend/src/styles/theme.css` contains `--color-sidebar-*`, `--color-brand-*`, `--shadow-*`, `--radius-*` variables
- [ ] `frontend/src/lib/utils.ts` exports `bgColorVar`, `textColorVar`, `borderColorVar`, `colorVar`, `cn`
- [ ] `frontend/src/lib/transitions.ts` exports `pageEnter`, `fadeUp`, `bottomSheetEnter`, `slideInLeft`, `useReducedMotion`
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without TypeScript errors
- [ ] Git is on clean branch: `git checkout -b phase-03/navigation-restructuring`
- [ ] Current Layout.tsx has 501 lines (verified: `frontend/src/app/components/Layout.tsx`)
- [ ] Current App.tsx has 134 lines (verified: `frontend/src/app/App.tsx`)
- [ ] Current MobileNav.tsx has 204 lines (verified: `frontend/src/app/components/MobileNav.tsx`)
- [ ] All 21 protected routes exist in App.tsx (lines 98–121)
- [ ] lucide-react installed and exporting all required icons

---

## IMPLEMENTATION SEQUENCE

### Step 1: Create Navigation Configuration (`navigationConfig.ts`)

**File:** `frontend/src/lib/navigationConfig.ts`  
**Purpose:** Single source of truth for all navigation items, sections, routes, and mappings.

```typescript
// frontend/src/lib/navigationConfig.ts
import {
  Home, Wallet2, BarChart3, Wrench, Sparkles,
  TrendingDown, Target, Star, FileText, TrendingUp,
  LineChart, Wallet, Repeat2, Users, Layers
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Primary Navigation (Bottom Nav + Sidebar top-level) ──
export interface NavSection {
  id: string;
  label: string;
  labelId: string;          // Indonesian label
  icon: LucideIcon;
  path: string;             // Default route for this section
  children: NavChild[];
}

export interface NavChild {
  id: string;
  label: string;
  labelId: string;
  icon: LucideIcon;
  path: string;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'home',
    label: 'Home',
    labelId: 'Beranda',
    icon: Home,
    path: '/home',
    children: [
      { id: 'overview', label: 'Overview', labelId: 'Ikhtisar', icon: Home, path: '/home/overview' },
      // Insights tab (renders within Overview, driven by tab state)
    ],
  },
  {
    id: 'spend',
    label: 'Spend',
    labelId: 'Belanja',
    icon: Wallet2,
    path: '/spend',
    children: [
      { id: 'spending', label: 'Spending', labelId: 'Pengeluaran', icon: TrendingDown, path: '/spend/spending' },
      { id: 'budget', label: 'Budget', labelId: 'Anggaran', icon: Target, path: '/spend/budget' },
      { id: 'goals', label: 'Goals', labelId: 'Tujuan', icon: Star, path: '/spend/goals' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    labelId: 'Analitik',
    icon: BarChart3,
    path: '/analytics',
    children: [
      { id: 'laporan', label: 'Reports', labelId: 'Laporan', icon: FileText, path: '/analytics/laporan' },
      { id: 'tren', label: 'Trends', labelId: 'Tren', icon: TrendingUp, path: '/analytics/tren' },
      { id: 'forecasting', label: 'Forecast', labelId: 'Prakiraan', icon: LineChart, path: '/analytics/forecasting' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    labelId: 'Alat',
    icon: Wrench,
    path: '/tools',
    children: [
      { id: 'wallets', label: 'Wallets', labelId: 'Dompet', icon: Wallet, path: '/tools/wallets' },
      { id: 'recurring', label: 'Recurring', labelId: 'Tagihan', icon: Repeat2, path: '/tools/recurring' },
      { id: 'split', label: 'Split Bill', labelId: 'Patungan', icon: Users, path: '/tools/split' },
      { id: 'categories', label: 'Categories', labelId: 'Kategori', icon: Layers, path: '/tools/categories' },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    labelId: 'AI',
    icon: Sparkles,
    path: '/ai',
    children: [
      { id: 'chat', label: 'Chat', labelId: 'Asisten', icon: Sparkles, path: '/ai/chat' },
    ],
  },
];

// ── Route Redirects (old path → new path) ──
export const ROUTE_REDIRECTS: Record<string, string> = {
  '/overview': '/home/overview',
  '/pengeluaran': '/spend/spending',
  '/pemasukan': '/spend/spending',    // Merged into spending view
  '/budget': '/spend/budget',
  '/goals': '/spend/goals',
  '/goal-progress': '/spend/goals',
  '/riwayat': '/home/overview',       // Now accessible via filter in Overview
  '/laporan': '/analytics/laporan',
  '/monthly-report': '/analytics/laporan',
  '/tren': '/analytics/tren',
  '/forecasting': '/analytics/forecasting',
  '/spending-patterns': '/analytics/tren',
  '/categories': '/tools/categories',
  '/wallet': '/tools/wallets',
  '/recurring': '/tools/recurring',
  '/split': '/tools/split',
  '/kalender': '/home/overview',
  '/asisten': '/ai/chat',
  '/smart-alerts': '/home/overview',
  '/gajian': '/home/overview',
};

// ── Helper: Find active section from pathname ──
export function getActiveSectionFromPath(pathname: string): string {
  const section = NAV_SECTIONS.find(
    (s) => pathname.startsWith(s.path)
  );
  return section?.id ?? 'home';
}

// ── Helper: Find active child from pathname ──
export function getActiveChildFromPath(pathname: string): string | null {
  for (const section of NAV_SECTIONS) {
    const child = section.children.find((c) => pathname === c.path);
    if (child) return child.id;
  }
  return null;
}

// ── Badge configuration (section → badge source) ──
export interface BadgeConfig {
  sectionId: string;
  type: 'count' | 'dot';
}
```

### Step 2: Create NavigationProvider Context

**File:** `frontend/src/hooks/useNavigation.tsx`  
**Purpose:** Persistent navigation state (active section, active tab per section, scroll positions).

```typescript
// frontend/src/hooks/useNavigation.tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getActiveSectionFromPath, NAV_SECTIONS } from '@/lib/navigationConfig';

interface NavigationState {
  activeSection: string;
  activeTabs: Record<string, string>;  // sectionId → last active child path
}

interface NavigationContextValue {
  activeSection: string;
  setActiveSection: (sectionId: string) => void;
  getActiveTab: (sectionId: string) => string;
  setActiveTab: (sectionId: string, childPath: string) => void;
  navigateToSection: (sectionId: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const STORAGE_KEY = 'gajian-aman-nav-state';

function loadPersistedState(): NavigationState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: first child of each section
  const activeTabs: Record<string, string> = {};
  NAV_SECTIONS.forEach((s) => {
    if (s.children.length > 0) {
      activeTabs[s.id] = s.children[0].path;
    }
  });
  return { activeSection: 'home', activeTabs };
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<NavigationState>(loadPersistedState);

  // Sync active section from URL on navigation
  useEffect(() => {
    const sectionId = getActiveSectionFromPath(location.pathname);
    setState((prev) => {
      const newTabs = { ...prev.activeTabs };
      // Update the active tab for this section to current path
      const section = NAV_SECTIONS.find((s) => s.id === sectionId);
      if (section) {
        const matchingChild = section.children.find((c) => location.pathname === c.path);
        if (matchingChild) {
          newTabs[sectionId] = matchingChild.path;
        }
      }
      return { activeSection: sectionId, activeTabs: newTabs };
    });
  }, [location.pathname]);

  // Persist to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setActiveSection = useCallback((sectionId: string) => {
    setState((prev) => ({ ...prev, activeSection: sectionId }));
  }, []);

  const getActiveTab = useCallback((sectionId: string): string => {
    return state.activeTabs[sectionId] ??
      NAV_SECTIONS.find((s) => s.id === sectionId)?.children[0]?.path ?? '';
  }, [state.activeTabs]);

  const setActiveTab = useCallback((sectionId: string, childPath: string) => {
    setState((prev) => ({
      ...prev,
      activeTabs: { ...prev.activeTabs, [sectionId]: childPath },
    }));
  }, []);

  const navigateToSection = useCallback((sectionId: string) => {
    const lastTab = state.activeTabs[sectionId];
    const section = NAV_SECTIONS.find((s) => s.id === sectionId);
    const target = lastTab ?? section?.children[0]?.path ?? section?.path ?? '/home';
    navigate(target);
  }, [navigate, state.activeTabs]);

  return (
    <NavigationContext.Provider
      value={{ activeSection: state.activeSection, setActiveSection, getActiveTab, setActiveTab, navigateToSection }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
```

### Step 3: Create BottomNavigation Component

**File:** `frontend/src/app/components/BottomNavigation.tsx`  
**Purpose:** 5-icon mobile bottom navigation bar with badge system, 56px touch targets, active state animation.

```typescript
// frontend/src/app/components/BottomNavigation.tsx
import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { NAV_SECTIONS } from '@/lib/navigationConfig';
import { useNavigation } from '@/hooks/useNavigation';
import { cn, textColorVar } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

interface BottomNavigationProps {
  badges?: Record<string, number>;  // sectionId → badge count
}

export function BottomNavigation({ badges = {} }: BottomNavigationProps) {
  const location = useLocation();
  const { activeSection, navigateToSection, getActiveTab } = useNavigation();
  const prefersReduced = useReducedMotion();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex items-stretch justify-around h-16 max-w-md mx-auto">
        {NAV_SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;
          const badgeCount = badges[section.id] ?? 0;
          const targetPath = getActiveTab(section.id) || section.path;

          return (
            <Link
              key={section.id}
              to={targetPath}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
                'min-w-[56px] min-h-[56px]',  // 56px touch target
                'transition-colors duration-[var(--duration-fast)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]',
                isActive
                  ? 'text-[var(--color-brand-primary)]'
                  : 'text-[var(--color-content-tertiary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${section.labelId} — ${section.label}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                {/* Active indicator dot */}
                {isActive && !prefersReduced && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-brand-primary)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {/* Badge */}
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[var(--color-sentiment-negative)] text-white text-[10px] font-bold"
                    aria-label={`${badgeCount} notifikasi`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight',
                isActive && 'font-semibold'
              )}>
                {section.labelId}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Step 4: Create Desktop Sidebar Component

**File:** `frontend/src/app/components/DesktopSidebar.tsx`  
**Purpose:** 200px fixed left sidebar with 5 primary sections, sub-navigation, collapsible rail mode for tablet.

```typescript
// frontend/src/app/components/DesktopSidebar.tsx
import { Link, useLocation } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GajianAmanMark } from './GajianAmanMark';
import { NAV_SECTIONS, type NavSection } from '@/lib/navigationConfig';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';

interface DesktopSidebarProps {
  isRailMode?: boolean;  // true for tablet (icon-only 60px rail)
}

export function DesktopSidebar({ isRailMode = false }: DesktopSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeSection } = useNavigation();
  const userInitials = (user?.name ?? 'U').slice(0, 2).toUpperCase();
  const avatarSeed = user?.name ?? 'user';

  const sidebarWidth = isRailMode ? 'w-[60px]' : 'w-[200px]';

  return (
    <aside
      className={cn(
        'hidden md:fixed md:inset-y-0 md:flex md:flex-col',
        sidebarWidth,
        'bg-[var(--color-sidebar-bg)] overflow-hidden transition-[width] duration-[var(--duration-normal)]'
      )}
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn('shrink-0 px-4 py-6', isRailMode && 'px-2 py-4')}>
          <div className={cn('flex items-center', isRailMode ? 'justify-center' : 'gap-3 px-2')}>
            <GajianAmanMark className={cn(isRailMode ? 'w-8 h-8' : 'w-9 h-9')} />
            {!isRailMode && (
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight text-[var(--color-sidebar-text)] truncate">
                  Gajian Aman
                </h1>
                <p className="text-[10px] text-[var(--color-sidebar-muted)] font-body">
                  Safe Paycheck
                </p>
              </div>
            )}
          </div>

          {/* User avatar (compact in rail mode) */}
          {!isRailMode && (
            <div className="flex items-center gap-2 p-2 mt-4 rounded-[var(--radius-md)] bg-[var(--color-sidebar-hover-bg)]">
              <Avatar className="h-7 w-7">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--color-sidebar-text)] truncate">
                  {user?.name ?? 'User'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
          {NAV_SECTIONS.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              isActive={activeSection === section.id}
              currentPath={location.pathname}
              isRailMode={isRailMode}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('shrink-0 border-t border-[var(--color-border-neutral)] p-2', isRailMode && 'p-1')}>
          {!isRailMode && (
            <p className="text-[10px] text-[var(--color-sidebar-muted)] text-center mb-2">
              Powered by Claude · Supabase
            </p>
          )}
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              'w-full text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]',
              isRailMode ? 'justify-center p-2' : 'justify-start text-xs'
            )}
            aria-label="Logout"
          >
            <LogOut className={cn('w-4 h-4', !isRailMode && 'mr-2')} />
            {!isRailMode && 'Logout'}
          </Button>
        </div>
      </div>
    </aside>
  );
}

// ── Individual Sidebar Section ──
function SidebarSection({
  section,
  isActive,
  currentPath,
  isRailMode,
}: {
  section: NavSection;
  isActive: boolean;
  currentPath: string;
  isRailMode: boolean;
}) {
  const Icon = section.icon;

  return (
    <div className="space-y-0.5">
      {/* Section Header / Primary Nav Item */}
      <Link
        to={section.children[0]?.path ?? section.path}
        className={cn(
          'flex items-center gap-2 rounded-[var(--radius-md)] transition-colors relative group',
          isRailMode ? 'justify-center p-2' : 'px-3 py-2',
          isActive
            ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-brand-primary)]'
            : 'text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-text)]'
        )}
        aria-current={isActive ? 'true' : undefined}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" />
        {!isRailMode && (
          <span className="text-sm font-semibold truncate">{section.labelId}</span>
        )}
        {/* Rail mode tooltip */}
        {isRailMode && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--color-content-primary)] text-white text-xs rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {section.labelId}
          </div>
        )}
      </Link>

      {/* Sub-navigation (only shown when section is active and not in rail mode) */}
      {isActive && !isRailMode && section.children.length > 1 && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-2 pl-3 border-l border-[var(--color-sidebar-hover-bg)]"
          >
            {section.children.map((child) => {
              const isChildActive = currentPath === child.path;
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.id}
                  to={child.path}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors',
                    isChildActive
                      ? 'text-[var(--color-brand-primary)] font-semibold'
                      : 'text-[var(--color-sidebar-muted)] hover:text-[var(--color-sidebar-text)]'
                  )}
                >
                  <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{child.labelId}</span>
                </Link>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
```

### Step 5: Create HeaderBar Component

**File:** `frontend/src/app/components/HeaderBar.tsx`  
**Purpose:** Unified top header for all layouts — shows page title, month filter, privacy toggle, avatar.

```typescript
// frontend/src/app/components/HeaderBar.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Eye, EyeOff, Bell, SlidersHorizontal, Menu } from 'lucide-react';
import { GajianAmanMark } from './GajianAmanMark';
import { useAuth } from '@/hooks/useAuth';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { usePrivacy } from '@/hooks/usePrivacy';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';
import { NAV_SECTIONS, getActiveSectionFromPath } from '@/lib/navigationConfig';
import { useLocation } from 'react-router';

interface HeaderBarProps {
  variant: 'mobile' | 'desktop';
  onOpenFilters?: () => void;
  onOpenMenu?: () => void;
  pageTitle?: string;
}

export function HeaderBar({ variant, onOpenFilters, onOpenMenu, pageTitle }: HeaderBarProps) {
  const { user } = useAuth();
  const { selectedMonth, setSelectedMonth, monthOptions } = useMonthFilter();
  const { isHidden, toggle } = usePrivacy();
  const location = useLocation();

  const userInitials = (user?.name ?? 'U').slice(0, 2).toUpperCase();
  const avatarSeed = user?.name ?? 'user';

  // Derive page title from current route
  const derivedTitle = pageTitle ?? (() => {
    const sectionId = getActiveSectionFromPath(location.pathname);
    const section = NAV_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return 'Overview';
    const child = section.children.find((c) => location.pathname === c.path);
    return child?.labelId ?? section.labelId;
  })();

  if (variant === 'mobile') {
    return (
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <GajianAmanMark className="w-6 h-6" variant="dark" />
            <h1 className="font-bold tracking-tight text-sm text-[var(--color-content-primary)]">
              {derivedTitle}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {onOpenFilters && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenFilters} aria-label="Buka filter">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle} aria-label={isHidden ? 'Tampilkan jumlah' : 'Sembunyikan jumlah'}>
              {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Avatar className="w-7 h-7">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
    );
  }

  // Desktop header
  return (
    <header
      className="hidden lg:block sticky top-0 z-30 w-full border-b border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60"
      role="banner"
    >
      <div className="flex h-14 items-center justify-between px-6">
        <h1 className="font-bold text-base text-[var(--color-content-primary)]">{derivedTitle}</h1>
        <div className="flex items-center gap-3">
          <label htmlFor="month-select-desktop" className="sr-only">Pilih bulan</label>
          <select
            id="month-select-desktop"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-screen)] text-xs font-medium text-[var(--color-content-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            aria-label="Filter bulan"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={isHidden ? 'Tampilkan jumlah' : 'Sembunyikan jumlah'} className="h-8 w-8">
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifikasi" className="h-8 w-8">
            <Bell className="w-4 h-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={user?.name} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
```

### Step 6: Create MobileFilterSheet Component

**File:** `frontend/src/app/components/MobileFilterSheet.tsx`  
**Purpose:** Bottom sheet for mobile filter controls (month picker, wallet selector).

```typescript
// frontend/src/app/components/MobileFilterSheet.tsx
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { bottomSheetEnter, useReducedMotion } from '@/lib/transitions';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterSheet({ isOpen, onClose }: MobileFilterSheetProps) {
  const { selectedMonth, setSelectedMonth, monthOptions } = useMonthFilter();
  const { walletId, setWalletId } = useWalletFilter();
  const { user } = useAuth();
  const { wallets } = useWallets(user?.userId);
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : bottomSheetEnter.initial}
            animate={prefersReduced ? { opacity: 1 } : bottomSheetEnter.animate}
            exit={prefersReduced ? { opacity: 0 } : bottomSheetEnter.exit}
            transition={bottomSheetEnter.transition}
            className="fixed bottom-0 inset-x-0 z-50 bg-[var(--color-bg-elevated)] rounded-t-[var(--radius-2xl)] shadow-[var(--shadow-modal)] max-h-[70vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-[var(--color-content-tertiary)]/30" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-content-primary)]">Filter</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Month Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-content-secondary)]">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-screen)] text-sm"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Wallet Selector */}
              {wallets.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-content-secondary)]">Dompet</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setWalletId('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                        walletId === 'all'
                          ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] border-transparent'
                          : 'bg-transparent text-[var(--color-content-secondary)] border-[var(--color-border-neutral)]'
                      )}
                    >
                      Semua
                    </button>
                    {wallets.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setWalletId(w.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                          walletId === w.id
                            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] border-transparent'
                            : 'bg-transparent text-[var(--color-content-secondary)] border-[var(--color-border-neutral)]'
                        )}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button */}
              <Button
                onClick={onClose}
                className="w-full bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] hover:bg-[var(--color-brand-primary-dark)]"
              >
                Terapkan Filter
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Step 7: Create SectionTabBar Component

**File:** `frontend/src/app/components/SectionTabBar.tsx`  
**Purpose:** Horizontal tab bar rendered below HeaderBar for sections with multiple children.

```typescript
// frontend/src/app/components/SectionTabBar.tsx
import { Link, useLocation } from 'react-router';
import { NAV_SECTIONS, getActiveSectionFromPath } from '@/lib/navigationConfig';
import { cn, textColorVar } from '@/lib/utils';

export function SectionTabBar() {
  const location = useLocation();
  const sectionId = getActiveSectionFromPath(location.pathname);
  const section = NAV_SECTIONS.find((s) => s.id === sectionId);

  // Don't render tab bar if section has 0 or 1 children
  if (!section || section.children.length <= 1) return null;

  return (
    <div className="sticky top-14 lg:top-[57px] z-20 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-neutral)]">
      <div className="flex overflow-x-auto no-scrollbar px-3 lg:px-6">
        {section.children.map((child) => {
          const isActive = location.pathname === child.path;
          return (
            <Link
              key={child.id}
              to={child.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-content-tertiary)] hover:text-[var(--color-content-secondary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {child.labelId}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

### Step 8: Refactor Layout.tsx

**File:** `frontend/src/app/components/Layout.tsx` (REPLACE ENTIRE FILE)  
**Purpose:** New responsive layout shell — desktop sidebar + tablet rail + mobile bottom nav.

> [!IMPORTANT]
> This is the most critical step. The new Layout.tsx replaces the old 501-line monolith with a clean composition of the new navigation components.

The new Layout.tsx should:
1. Import `DesktopSidebar`, `BottomNavigation`, `HeaderBar`, `SectionTabBar`, `MobileFilterSheet`
2. Use `useMediaQuery` or CSS classes for responsive breakpoints
3. Render sidebar on `md:` and above, bottom nav on mobile
4. Keep `TransactionModal` FAB button
5. Keep `Outlet` for route rendering
6. Remove all inline nav item definitions (use `navigationConfig.ts`)
7. Remove `MobileNav` drawer (replaced by `BottomNavigation`)

**Key layout structure:**
```
Desktop (≥1024px): DesktopSidebar(200px) | HeaderBar + SectionTabBar + Outlet
Tablet (768–1023px): DesktopSidebar(60px rail) | HeaderBar + SectionTabBar + Outlet
Mobile (<768px): HeaderBar + SectionTabBar + Outlet + BottomNavigation
```

### Step 9: Update App.tsx Route Structure

**File:** `frontend/src/app/App.tsx` (MODIFY)  
**Purpose:** Restructure routes under new grouped paths with redirect support.

Key changes:
1. Wrap router in `NavigationProvider`
2. Add new grouped routes:
   - `/home/overview` → `<Overview />`
   - `/spend/spending` → `<Pengeluaran />`
   - `/spend/budget` → `<Budget />`
   - `/spend/goals` → `<Goals />`
   - `/analytics/laporan` → `<Laporan />`
   - `/analytics/tren` → `<Tren />`
   - `/analytics/forecasting` → `<Forecasting />`
   - `/tools/wallets` → `<WalletPage />`
   - `/tools/recurring` → `<Recurring />`
   - `/tools/split` → `<SplitBill />`
   - `/tools/categories` → `<CategoryBrowser />`
   - `/ai/chat` → `<Asisten />`
3. Add redirect routes for ALL old paths (from `ROUTE_REDIRECTS` in config)
4. Add index redirects:
   - `/home` → `/home/overview`
   - `/spend` → `/spend/spending`
   - `/analytics` → `/analytics/laporan`
   - `/tools` → `/tools/wallets`
   - `/ai` → `/ai/chat`
5. Keep existing routes that don't move: `/profile`, `/langganan`, `/gajian`, `/category/:category`
6. Keep all public routes unchanged

### Step 10: Update Internal Links Across Pages

**Scope:** Search all `*.tsx` files for `href=` and `to=` references pointing to old routes, update to new paths.

**Critical links to update:**
- `Overview.tsx`: Link to `/riwayat` → `/home/overview` (or keep if still valid)
- `Layout.tsx` (old): All sidebar links (now handled by config)
- Any `<Link to="/pengeluaran">` → `<Link to="/spend/spending">`
- Any `<Link to="/budget">` → `<Link to="/spend/budget">`
- Any `<Link to="/goals">` → `<Link to="/spend/goals">`
- Any `<Link to="/wallet">` → `<Link to="/tools/wallets">`
- Any `<Link to="/asisten">` → `<Link to="/ai/chat">`

Run `grep -rn 'to="/' frontend/src/app/pages/` to find all instances.

---

## FILE TOUCH LIST

### Created (New Files)
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `frontend/src/lib/navigationConfig.ts` | Navigation configuration, route mappings, helpers |
| 2 | `frontend/src/hooks/useNavigation.tsx` | NavigationProvider context + useNavigation hook |
| 3 | `frontend/src/app/components/BottomNavigation.tsx` | Mobile 5-icon bottom nav |
| 4 | `frontend/src/app/components/DesktopSidebar.tsx` | Desktop/tablet sidebar with rail mode |
| 5 | `frontend/src/app/components/HeaderBar.tsx` | Unified top header bar |
| 6 | `frontend/src/app/components/MobileFilterSheet.tsx` | Bottom sheet for mobile filters |
| 7 | `frontend/src/app/components/SectionTabBar.tsx` | Horizontal tab bar for sections |

### Modified (Existing Files)
| # | File Path | Changes |
|---|-----------|---------|
| 8 | `frontend/src/app/App.tsx` | New route structure + NavigationProvider + redirects |
| 9 | `frontend/src/app/components/Layout.tsx` | Full rewrite: compose new nav components |
| 10 | `frontend/src/app/pages/Overview.tsx` | Update internal links only |
| 11+ | `frontend/src/app/pages/*.tsx` (all pages) | Update `<Link to>` and `href` for new routes |

### Deprecated (Kept but No Longer Primary)
| # | File Path | Status |
|---|-----------|--------|
| 12 | `frontend/src/app/components/MobileNav.tsx` | Deprecated — replaced by BottomNavigation; keep for rollback |

---

## EXPECTED OUTPUTS

When Phase 03 is complete, the following must be true:

- [ ] **BottomNavigation** renders on screens < 768px with 5 icons: Home, Spend, Analytics, Tools, AI
- [ ] Each bottom nav icon has **56px×56px minimum touch target**
- [ ] Active icon shows **Gajian green (#4AE54A)**, inactive shows **gray**
- [ ] **DesktopSidebar** renders at 200px width on screens ≥ 1024px
- [ ] **Icon rail** renders at 60px width on screens 768–1023px with tooltips on hover
- [ ] **Sidebar sub-navigation** expands when section is active (accordion-style)
- [ ] **HeaderBar** shows on all breakpoints with page title, filters, privacy toggle
- [ ] **MobileFilterSheet** opens from HeaderBar filter icon on mobile
- [ ] **SectionTabBar** shows horizontal tabs for multi-child sections (Spend has 3 tabs, Analytics has 3 tabs)
- [ ] All **old routes redirect** to new paths (e.g., `/pengeluaran` → `/spend/spending`)
- [ ] **NavigationProvider** persists last-viewed tab per section across navigation
- [ ] **FAB button** (add transaction) renders correctly on all breakpoints without collision
- [ ] No pages have broken internal links
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] All pages render identically (content unchanged, only route + layout changed)

---

## VALIDATION STEPS

### Build Validation
```bash
cd frontend
npm run build    # Must pass with zero errors
npm run dev      # Must start without crashes
```

### Route Testing (Manual)
1. Navigate to `/overview` → should redirect to `/home/overview`
2. Navigate to `/pengeluaran` → should redirect to `/spend/spending`
3. Navigate to `/budget` → should redirect to `/spend/budget`
4. Navigate to `/goals` → should redirect to `/spend/goals`
5. Navigate to `/laporan` → should redirect to `/analytics/laporan`
6. Navigate to `/tren` → should redirect to `/analytics/tren`
7. Navigate to `/wallet` → should redirect to `/tools/wallets`
8. Navigate to `/asisten` → should redirect to `/ai/chat`
9. Navigate to `/profile` → should render Profile page (unchanged)
10. Navigate to `/` → logged-in users go to `/home/overview`, guests see Landing

### Responsive Testing (DevTools)
1. **iPhone SE (375px):** Bottom nav visible, no sidebar, HeaderBar compact
2. **iPhone 14 (390px):** Same as SE, verify touch targets ≥ 56px
3. **iPad Mini (768px):** Icon rail visible (60px), no bottom nav, tab bar visible
4. **iPad Pro (1024px):** Full sidebar (200px), no bottom nav
5. **Desktop (1440px):** Full sidebar, desktop header

### Navigation State Testing
1. Navigate to Spend → Budget tab
2. Navigate to Analytics section
3. Navigate back to Spend → should show Budget tab (persisted)
4. Refresh page → should maintain section state

### Accessibility Testing
1. Tab through bottom nav icons — focus ring visible on each
2. Screen reader announces: "Beranda — Home", "Belanja — Spend", etc.
3. `aria-current="page"` set on active nav item
4. Skip-to-main-content link still works
5. Keyboard: Enter/Space activates nav items

---

## GIT COMMIT CHECKPOINTS

| Checkpoint | Files | Commit Message |
|-----------|-------|----------------|
| CP-03.1 | `navigationConfig.ts`, `useNavigation.tsx` | `feat(nav): add navigation config and NavigationProvider context` |
| CP-03.2 | `BottomNavigation.tsx` | `feat(nav): add mobile BottomNavigation with 5-tier system` |
| CP-03.3 | `DesktopSidebar.tsx` | `feat(nav): add desktop sidebar with rail mode for tablet` |
| CP-03.4 | `HeaderBar.tsx`, `SectionTabBar.tsx` | `feat(nav): add HeaderBar and SectionTabBar components` |
| CP-03.5 | `MobileFilterSheet.tsx` | `feat(nav): add MobileFilterSheet bottom sheet` |
| CP-03.6 | `Layout.tsx` | `refactor(layout): rewrite Layout.tsx with new nav composition` |
| CP-03.7 | `App.tsx` | `refactor(routes): restructure routes under 5-tier navigation` |
| CP-03.8 | `pages/*.tsx` | `refactor(links): update all internal links to new route paths` |
| CP-03.9 | — | `chore(nav): cleanup deprecated MobileNav, verify build` |

---

## ROLLBACK INSTRUCTIONS

### Full Phase Rollback
```bash
git stash          # Save any work in progress
git checkout main  # Return to pre-phase-03 state
git branch -D phase-03/navigation-restructuring  # Delete phase branch
```

### Partial Rollback (Keep Config, Revert Layout)
```bash
git checkout HEAD~3 -- frontend/src/app/components/Layout.tsx
git checkout HEAD~3 -- frontend/src/app/App.tsx
# Keep: navigationConfig.ts, useNavigation.tsx, new components
```

### Emergency Rollback (Layout Only)
If the new Layout.tsx causes rendering issues:
1. The old `MobileNav.tsx` is preserved (not deleted)
2. Revert `Layout.tsx` to previous commit
3. Revert `App.tsx` to previous commit
4. Old routes will still work (redirects are additive)

---

## SESSION RECAP TEMPLATE

```markdown
## Phase 03 Session Recap — [DATE]

### Session Number: [X/3]
### Duration: ~[X] minutes
### Context Used: ~[X]% estimated

### Completed:
- [ ] Step 1: navigationConfig.ts
- [ ] Step 2: NavigationProvider
- [ ] Step 3: BottomNavigation
- [ ] Step 4: DesktopSidebar
- [ ] Step 5: HeaderBar
- [ ] Step 6: MobileFilterSheet
- [ ] Step 7: SectionTabBar
- [ ] Step 8: Layout.tsx refactor
- [ ] Step 9: App.tsx route restructure
- [ ] Step 10: Internal link updates

### Files Created:
- [list]

### Files Modified:
- [list]

### Issues Encountered:
- [any TypeScript errors, rendering issues]

### Deferred to Next Session:
- [anything not completed]

### Build Status:
- `npm run build`: [PASS/FAIL]
- `npm run dev`: [PASS/FAIL]

### Git Commits Made:
- [list commit hashes and messages]
```

---

## ARCHITECTURE NOTES

### Decision: Bottom Nav vs. Tab Bar
**Choice:** Bottom navigation with 5 persistent icons  
**Rationale:** The app currently has 21+ sidebar items creating cognitive overload (audit score: 6.5/10 UX). Bottom nav with 5 icons matches fintech standards (Wise, Revolut, GoPay) and supports thumb-zone interaction. The QPay UI Kit specifically validates this pattern for wallet apps.  
**Tradeoff:** Users must learn new groupings. Mitigated by redirect system preserving all old URLs.

### Decision: Rail Mode vs. Hamburger on Tablet
**Choice:** Collapsible icon rail (60px) instead of hamburger menu  
**Rationale:** Hamburger menus hide navigation behind an interaction (extra tap). Icon rails show all 5 sections at a glance, with tooltip labels on hover. Wise Design System uses this pattern for their tablet breakpoint.  
**Tradeoff:** 60px of horizontal space consumed vs. full-width content. Acceptable for 768px+ screens.

### Decision: SessionStorage vs. localStorage for Nav State
**Choice:** sessionStorage  
**Rationale:** Nav state should persist within a browser session (tab switching, refreshes) but reset between sessions. Users returning after hours/days should start fresh. localStorage would create stale state issues.

### Decision: Redirect Routes as Permanent
**Choice:** Keep redirect routes (`/overview` → `/home/overview`) permanently, not temporarily  
**Rationale:** Users may have bookmarks, browser history, or muscle memory for old URLs. Breaking these creates friction. The redirect cost is negligible (one React render cycle).

### Decision: SectionTabBar as Separate Component
**Choice:** SectionTabBar is its own component, rendered between HeaderBar and content  
**Rationale:** Some sections (AI) have only 1 child and shouldn't show a tab bar. Making it conditional as a separate component is cleaner than embedding tab logic in Layout.

---

## UI CONSISTENCY CHECKS

- [ ] Bottom nav active color matches sidebar active color (`--color-brand-primary`)
- [ ] Both navs use same icon set (lucide-react, consistent stroke width)
- [ ] HeaderBar height consistent: 56px mobile, 56px desktop
- [ ] SectionTabBar height: 40px (consistent with Wise tab bar)
- [ ] All border colors use `--color-border-neutral`
- [ ] All background blur uses `backdrop-blur` with `supports-[backdrop-filter]`
- [ ] Avatar size: 28px mobile, 32px desktop
- [ ] Font weights: nav labels `font-medium` inactive, `font-semibold` active
- [ ] Brand mark consistent: `GajianAmanMark` used in both sidebar header and mobile header

---

## MOBILE RESPONSIVENESS CHECKS

- [ ] **375px (iPhone SE):** Bottom nav 5 icons fit without horizontal scroll
- [ ] **390px (iPhone 14):** Touch targets verified ≥ 56px height
- [ ] **768px (iPad Mini):** Icon rail renders, bottom nav hidden
- [ ] **1024px (iPad Pro):** Full sidebar renders, icon rail hidden
- [ ] **1440px (Desktop):** Sidebar + content max-width 1200px centered
- [ ] SectionTabBar scrolls horizontally on narrow screens (< 400px)
- [ ] MobileFilterSheet max-height 70vh with overflow scroll
- [ ] FAB button doesn't overlap bottom nav (positioned 80px from bottom on mobile)
- [ ] Main content has `pb-24` on mobile to account for bottom nav + FAB

---

## ACCESSIBILITY CHECKS

- [ ] Bottom nav: `role="navigation"`, `aria-label="Navigasi utama"`
- [ ] Each nav item: `aria-current="page"` when active
- [ ] Each nav item: `aria-label` with bilingual label ("Beranda — Home")
- [ ] Sidebar rail tooltips: not `aria-hidden` (visible to screen readers on focus)
- [ ] HeaderBar: all buttons have `aria-label`
- [ ] Month select: `<label htmlFor>` association (sr-only label)
- [ ] MobileFilterSheet: focus trapped when open (first/last element cycling)
- [ ] MobileFilterSheet: `Escape` key closes sheet
- [ ] SectionTabBar: `aria-current="page"` on active tab
- [ ] Skip-to-main-content link preserved and functional
- [ ] Color contrast: bottom nav inactive gray on white = minimum 4.5:1 ratio
- [ ] Keyboard: Tab order follows visual order (left sidebar → header → tabs → content)

---

## TECHNICAL DEBT PREVENTION CHECKS

- [ ] No hardcoded route strings in components — all from `navigationConfig.ts`
- [ ] No hardcoded colors — all via CSS variables and utility functions
- [ ] No `any` types in new TypeScript files — strict typing for all nav types
- [ ] No duplicate nav definitions — single source of truth in config
- [ ] No inline styles — all via Tailwind classes
- [ ] `MobileNav.tsx` marked as deprecated with comment header, not deleted
- [ ] All new components export from a barrel file or are individually imported
- [ ] No circular dependencies between nav components
- [ ] NavigationProvider does not re-render entire tree on state change (memoized context value)

---

## CLAUDE CODE SESSION BATCHES

### Session 1: Foundation (Steps 1–3)
**Estimated context:** ~40%  
**Duration:** ~45 minutes  

**Tasks:**
1. Create `navigationConfig.ts` (Step 1)
2. Create `useNavigation.tsx` (Step 2)
3. Create `BottomNavigation.tsx` (Step 3)
4. Commit CP-03.1, CP-03.2

**Session start prompt:**
```
Read phase-03-navigation.md. Execute Steps 1-3 only.
Create navigationConfig.ts, useNavigation.tsx, and BottomNavigation.tsx.
Do NOT modify Layout.tsx or App.tsx yet.
Commit after each component is verified.
```

### Session 2: Components (Steps 4–7)
**Estimated context:** ~45%  
**Duration:** ~50 minutes  

**Tasks:**
1. Create `DesktopSidebar.tsx` (Step 4)
2. Create `HeaderBar.tsx` (Step 5)
3. Create `MobileFilterSheet.tsx` (Step 6)
4. Create `SectionTabBar.tsx` (Step 7)
5. Commit CP-03.3, CP-03.4, CP-03.5

**Session start prompt:**
```
Read phase-03-navigation.md. Execute Steps 4-7 only.
Files already created: navigationConfig.ts, useNavigation.tsx, BottomNavigation.tsx.
Create DesktopSidebar.tsx, HeaderBar.tsx, MobileFilterSheet.tsx, SectionTabBar.tsx.
Do NOT modify Layout.tsx or App.tsx yet.
```

### Session 3: Integration (Steps 8–10)
**Estimated context:** ~50%  
**Duration:** ~60 minutes  

**Tasks:**
1. Refactor `Layout.tsx` (Step 8) — compose new components
2. Restructure `App.tsx` routes (Step 9) — add NavigationProvider + new paths
3. Update all internal links across pages (Step 10)
4. Run `npm run build` to verify
5. Commit CP-03.6, CP-03.7, CP-03.8, CP-03.9

**Session start prompt:**
```
Read phase-03-navigation.md. Execute Steps 8-10 only.
All nav components are created. Now integrate:
1. Rewrite Layout.tsx to compose DesktopSidebar, BottomNavigation, HeaderBar, SectionTabBar, MobileFilterSheet
2. Update App.tsx with new route paths + NavigationProvider + redirect routes
3. Update all <Link to> and href references in pages/*.tsx
4. Run npm run build to verify zero errors
```

---

## FIGMA REFERENCE LINKS

| Reference | Usage in Phase 03 |
|-----------|-------------------|
| **Awwwards Bottom Navigation** | Mobile bottom nav animation patterns, active state transitions, icon sizing (56px targets) |
| **Wise Design System** | Sidebar interaction patterns, rail mode behavior, tooltip styling, nav item hover/focus states |
| **QPay Digital Wallet UI Kit** | Bottom nav layout with 5 icons, badge positioning, active indicator dot animation |
| **Data Visualization UI Kit** | Tab bar styling within analytical sections |

**Specific design elements to extract:**
- Bottom nav icon size: 20px (5×5 grid)
- Bottom nav label size: 10px
- Active indicator: 4px dot below icon
- Badge: 16px circle, red (#A8200D), white text
- Sidebar rail: 60px width, 40px icon touch target, centered
- Sidebar expanded: 200px, 32px item height, 4px left border active indicator

---

## DEPENDENCY OUTPUTS

Phase 03 produces the following for subsequent phases:

| Output | Consumed By |
|--------|------------|
| `navigationConfig.ts` | Phase 04+ (all phases reference nav structure) |
| `useNavigation` hook | Phase 04 (dashboard uses section detection), Phase 05+ |
| `BottomNavigation` component | Phase 05+ (transaction flow uses FAB positioning) |
| `DesktopSidebar` component | Phase 06+ (sidebar badge updates) |
| `HeaderBar` component | Phase 04 (dashboard header), Phase 05 (transaction header) |
| `SectionTabBar` component | Phase 04 (home tabs), Phase 05 (spend tabs) |
| `MobileFilterSheet` component | Phase 04 (overview filters), Phase 05 (spending filters) |
| `Layout.tsx` (new) | All subsequent phases (page rendering shell) |
| Route structure (`/home/*`, `/spend/*`, etc.) | Phase 04+ (all new pages follow this structure) |
| Redirect system | Permanent — ensures old bookmarks/links work forever |

> [!NOTE]
> Phase 04 (Dashboard Modernization) directly depends on the new Layout shell from this phase. The Overview page will be redesigned within the `/home/overview` route, using `SectionTabBar` for the Home section tabs and `HeaderBar` for the page header.
