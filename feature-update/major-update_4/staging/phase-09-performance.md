# PHASE 09: PERFORMANCE & OPTIMIZATION

**Phase Number:** 09  
**Phase Name:** Performance & Optimization  
**Duration:** 3–5 days (4 Claude Code sessions)  
**Dependencies:** Phase 08 (Animation & Motion System) complete  
**Status:** NOT STARTED  
**Last Updated:** 2026-05-21  

---

## CROSS-REFERENCE

- **Master Roadmap:** `master-development-roadmap.md` → Phase 09
- **Project Context:** `GAJIAN_AMAN_PROJECT_CONTEXT.md` → Section 4 (Tech Stack)
- **Audit Report:** `GAJIAN_AMAN_REVAMP_AUDIT_REPORT.md` → Performance section
- **Redesign Strategy:** `GAJIAN_AMAN_REDESIGN_STRATEGY.md` → Section 2.3 (Motion tokens)
- **Figma System:** `GAJIAN_AMAN_FIGMA_PRODUCTION_SYSTEM.md` → Loading states

---

## SCOPE BOUNDARIES

### IN-SCOPE
- Bundle analysis with `rollup-plugin-visualizer` / `vite-plugin-visualizer`
- Vite chunk splitting strategy optimization (vendor, charts, UI, AI, motion)
- Route-based code splitting with `React.lazy` for all 39 pages
- `Suspense` boundaries per route group (auth, dashboard, public, analytics)
- Lazy loading for heavy components (Recharts, TransactionModal, Laporan)
- Image/asset compression and modern format adoption (WebP)
- DiceBear avatar loading optimization (caching, placeholder)
- `React.memo` audit for expensive render paths
- `useMemo` / `useCallback` audit across all 16 hooks
- Virtual scrolling for Riwayat transaction list
- Debounce for search inputs, throttle for scroll handlers
- Stale-while-revalidate pattern for Supabase data hooks
- Request deduplication layer
- Supabase query optimization (select specific columns, pagination)
- GPU-accelerated animation enforcement (transform/opacity only)
- `prefers-reduced-motion` compliance audit
- Core Web Vitals measurement tooling
- Basic performance monitoring dashboard
- `web-vitals` library integration

### OUT-OF-SCOPE
- Backend/Supabase schema changes
- New features or UI redesign
- Component restructuring (only wrapping with memo/lazy)
- Server-side rendering (SSR) — project uses Vite SPA
- CDN configuration (handled by Vercel)
- Service Worker / PWA (Phase 11+ if applicable)
- Database indexing (backend team responsibility)
- Third-party analytics (Google Analytics, Mixpanel)

---

## DO NOT TOUCH SECTIONS

> [!CAUTION]
> These files/modules MUST NOT be modified in this phase. Performance changes are additive wrappers, NOT structural refactors.

| Path | Reason |
|------|--------|
| `frontend/src/app/pages/*.tsx` (internal logic) | Only wrap with `React.lazy`, do NOT change page content |
| `frontend/src/app/components/ui/*` | shadcn/ui primitives — never edit |
| `frontend/src/hooks/useAuth.tsx` | Auth flow is critical path — no changes |
| `frontend/src/lib/supabase.ts` (types) | TypeScript types must remain unchanged |
| `frontend/src/styles/theme.css` | Design tokens are Phase 01 deliverable |
| `frontend/src/styles/fonts.css` | Font imports are stable |
| `frontend/api/*.js` | Vercel serverless functions — backend scope |
| `bot/` | Python Telegram bot — entirely separate |
| `db/` | Database layer — separate |
| `scheduler/` | APScheduler — separate |

---

## PRE-FLIGHT CHECKS

Before starting Phase 09, verify ALL of the following:

```bash
# 1. Phase 08 completion check
# All animation presets in transitions.ts are finalized
# All pages use motion/react animations consistently

# 2. Build succeeds without errors
cd frontend && npm run build

# 3. TypeScript compiles cleanly
npm run typecheck

# 4. Tests pass
npm run test

# 5. Current bundle size baseline (record this)
# Run build and note chunk sizes from terminal output
npm run build 2>&1 | Select-String "chunk"

# 6. Dev server starts without errors
npm run dev

# 7. Git clean state
git status  # Should show no uncommitted changes
```

**Baseline Metrics to Record:**
- Total bundle size (dist/ folder): ______ KB
- Largest chunk name and size: ______ KB
- `vendor` chunk size: ______ KB
- `charts` chunk size: ______ KB
- Number of chunks: ______
- Dev server cold start time: ______ ms

---

## IMPLEMENTATION SEQUENCE

### STEP 1: Bundle Analysis Setup (30 min)

**1.1 Install analysis tooling**
```bash
cd frontend
npm install --save-dev rollup-plugin-visualizer
```

**1.2 Create analysis script in `vite.config.ts`**

Add conditional visualizer plugin (only when `ANALYZE=true`):

```typescript
// Add at top of vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

// Inside plugins array, add conditionally:
...(process.env.ANALYZE === 'true' ? [
  visualizer({
    filename: 'dist/bundle-report.html',
    open: true,
    gzipSize: true,
    brotliSize: true,
    template: 'treemap', // or 'sunburst', 'network'
  })
] : []),
```

**1.3 Add npm script for analysis**

In `package.json`, add:
```json
"analyze": "ANALYZE=true vite build"
```

On Windows (PowerShell):
```json
"analyze": "set ANALYZE=true && vite build"
```

**1.4 Run initial analysis and screenshot results**
```bash
npm run analyze
```

Record initial findings in `docs/performance-baseline.md`.

---

### STEP 2: Chunk Splitting Optimization (45 min)

**2.1 Optimize `manualChunks` in `vite.config.ts`**

Current chunks (from existing config):
- `vendor`: react, react-dom, react-router
- `charts`: recharts
- `ui`: 4 Radix packages + lucide-react
- `supabase`: @supabase/supabase-js
- `motion`: motion
- `pdf`: html2pdf.js

Target optimized chunks:

```typescript
manualChunks: {
  // Core framework — loaded on every page
  vendor: ['react', 'react-dom', 'react-router'],

  // Charts — lazy loaded, only on pages with charts
  charts: ['recharts'],

  // UI primitives — loaded on most pages
  ui: [
    '@radix-ui/react-dialog',
    '@radix-ui/react-tabs',
    '@radix-ui/react-select',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-accordion',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-avatar',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-popover',
    '@radix-ui/react-progress',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-separator',
    '@radix-ui/react-slider',
    '@radix-ui/react-slot',
    '@radix-ui/react-switch',
    '@radix-ui/react-toggle',
    '@radix-ui/react-toggle-group',
    'lucide-react',
  ],

  // AI SDK — only loaded when AI features used
  ai: ['@anthropic-ai/sdk', '@google/generative-ai'],

  // Animation engine — loaded on animated pages
  motion: ['motion'],

  // Supabase client — loaded after auth
  supabase: ['@supabase/supabase-js'],

  // PDF export — lazy loaded on demand
  pdf: ['html2pdf.js'],

  // Form handling
  forms: ['react-hook-form'],

  // Date utilities
  dates: ['date-fns', 'react-day-picker'],
},
```

**2.2 Set chunk size warning limit**

```typescript
chunkSizeWarningLimit: 250, // Tighter than default 500
```

**2.3 Verify build output**
```bash
npm run build
```

Target chunk sizes:
| Chunk | Target Size (gzip) |
|-------|-------------------|
| `vendor` | < 45 KB |
| `ui` | < 60 KB |
| `charts` | < 50 KB |
| `motion` | < 20 KB |
| `supabase` | < 15 KB |
| `ai` | < 25 KB |
| `pdf` | < 30 KB |
| `forms` | < 10 KB |
| `dates` | < 15 KB |
| **Initial load total** | **< 300 KB** |

---

### STEP 3: Route-Based Code Splitting (90 min)

**3.1 Create `frontend/src/app/LazyPages.tsx`**

This file centralizes all lazy imports:

```typescript
import { lazy } from 'react';

// ─── Critical Path (preloaded) ───
export const Overview = lazy(() => import('./pages/Overview'));
export const Login = lazy(() => import('./pages/Login'));
export const Landing = lazy(() => import('./pages/Landing'));

// ─── Dashboard Pages ───
export const Pengeluaran = lazy(() => import('./pages/Pengeluaran'));
export const Pemasukan = lazy(() => import('./pages/Pemasukan'));
export const Budget = lazy(() => import('./pages/Budget'));
export const Goals = lazy(() => import('./pages/Goals'));
export const Riwayat = lazy(() => import('./pages/Riwayat'));
export const Gajian = lazy(() => import('./pages/Gajian'));
export const Wallet = lazy(() => import('./pages/Wallet'));

// ─── Analytics Pages (heavier, lazy by default) ───
export const Laporan = lazy(() => import('./pages/Laporan'));
export const Tren = lazy(() => import('./pages/Tren'));
export const Forecasting = lazy(() => import('./pages/Forecasting'));
export const SpendingPatterns = lazy(() => import('./pages/SpendingPatterns'));
export const MonthlyReport = lazy(() => import('./pages/MonthlyReport'));

// ─── Tools Pages ───
export const Kalender = lazy(() => import('./pages/Kalender'));
export const Recurring = lazy(() => import('./pages/Recurring'));
export const SplitBill = lazy(() => import('./pages/SplitBill'));
export const SplitBillShare = lazy(() => import('./pages/SplitBillShare'));
export const CategoryBrowser = lazy(() => import('./pages/CategoryBrowser'));
export const CategoryDetail = lazy(() => import('./pages/CategoryDetail'));

// ─── AI Pages ───
export const Asisten = lazy(() => import('./pages/Asisten'));
export const SmartAlerts = lazy(() => import('./pages/SmartAlerts'));
export const BudgetRecommendations = lazy(() => import('./pages/BudgetRecommendations'));

// ─── Account & Settings ───
export const Profile = lazy(() => import('./pages/Profile'));
export const Langganan = lazy(() => import('./pages/Langganan'));
export const Onboarding = lazy(() => import('./pages/Onboarding'));
export const AuthCallback = lazy(() => import('./pages/AuthCallback'));
export const LinkTelegram = lazy(() => import('./pages/LinkTelegram'));
export const Keamanan = lazy(() => import('./pages/Keamanan'));
export const GoalProgress = lazy(() => import('./pages/GoalProgress'));

// ─── Public/Marketing Pages ───
export const CaraKerja = lazy(() => import('./pages/CaraKerja'));
export const Fitur = lazy(() => import('./pages/Fitur'));
export const Testimonial = lazy(() => import('./pages/Testimonial'));
export const FAQ = lazy(() => import('./pages/FAQ'));
export const Blog = lazy(() => import('./pages/Blog'));
export const TentangKami = lazy(() => import('./pages/TentangKami'));
export const SyaratKetentuan = lazy(() => import('./pages/SyaratKetentuan'));
export const KebijakanPrivasi = lazy(() => import('./pages/KebijakanPrivasi'));
```

**3.2 Create `frontend/src/app/components/SuspenseBoundary.tsx`**

```typescript
import { Suspense, type ReactNode } from 'react';
import { LoadingState } from './ScreenStates';

interface SuspenseBoundaryProps {
  children: ReactNode;
  variant?: 'card' | 'row' | 'chart' | 'default' | 'page';
  count?: number;
}

export function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingState variant="card" count={3} />
      </div>
    }>
      {children}
    </Suspense>
  );
}

export function ChartSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />
    }>
      {children}
    </Suspense>
  );
}

export function ModalSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
```

**3.3 Update `App.tsx` to use lazy imports + Suspense**

Replace all static imports with lazy imports from `LazyPages.tsx`. Wrap route groups with `<PageSuspense>`:

```typescript
// Replace: import Overview from './pages/Overview';
// With:    import { Overview } from './LazyPages';

// Wrap each <Route element={...}> with PageSuspense:
<Route path="/overview" element={<PageSuspense><Overview /></PageSuspense>} />
```

Group Suspense boundaries:
- **Auth routes:** Individual Suspense (fast load expected)
- **Dashboard routes:** Shared `<PageSuspense>` wrapper
- **Analytics routes:** Shared `<PageSuspense>` with chart skeleton
- **Public routes:** Shared `<PageSuspense>` with minimal loader

**3.4 Add route preloading for critical paths**

Create `frontend/src/lib/preload.ts`:

```typescript
// Preload critical routes after initial render
export function preloadCriticalRoutes() {
  // Preload after 2s idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('../app/pages/Overview');
      import('../app/pages/Pengeluaran');
      import('../app/pages/Riwayat');
    });
  } else {
    setTimeout(() => {
      import('../app/pages/Overview');
      import('../app/pages/Pengeluaran');
      import('../app/pages/Riwayat');
    }, 2000);
  }
}

// Preload on link hover (for navigation items)
export function preloadOnHover(pageName: string) {
  const preloadMap: Record<string, () => Promise<unknown>> = {
    overview: () => import('../app/pages/Overview'),
    pengeluaran: () => import('../app/pages/Pengeluaran'),
    pemasukan: () => import('../app/pages/Pemasukan'),
    budget: () => import('../app/pages/Budget'),
    goals: () => import('../app/pages/Goals'),
    riwayat: () => import('../app/pages/Riwayat'),
    laporan: () => import('../app/pages/Laporan'),
    tren: () => import('../app/pages/Tren'),
    asisten: () => import('../app/pages/Asisten'),
    wallet: () => import('../app/pages/Wallet'),
    kalender: () => import('../app/pages/Kalender'),
  };

  preloadMap[pageName]?.();
}
```

**3.5 Integrate preloading into `Layout.tsx` nav items**

Add `onMouseEnter` / `onFocus` handler to each nav link:

```typescript
<NavLink
  to="/pengeluaran"
  onMouseEnter={() => preloadOnHover('pengeluaran')}
  onFocus={() => preloadOnHover('pengeluaran')}
>
```

---

### STEP 4: Lazy Load Heavy Components (60 min)

**4.1 Lazy load TransactionModal (56KB source)**

In `Layout.tsx` or wherever TransactionModal is rendered:

```typescript
const TransactionModal = lazy(() => import('./TransactionModal'));

// Wrap with ModalSuspense
{showModal && (
  <ModalSuspense>
    <TransactionModal open={showModal} onClose={() => setShowModal(false)} />
  </ModalSuspense>
)}
```

**4.2 Lazy load chart components within pages**

Create `frontend/src/app/components/LazyChart.tsx`:

```typescript
import { lazy, Suspense, memo } from 'react';

const LazyAreaChart = lazy(() =>
  import('recharts').then(m => ({ default: m.AreaChart as any }))
);

// Generic chart wrapper with loading skeleton
export const ChartContainer = memo(function ChartContainer({
  children,
  height = 256,
}: {
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="w-full animate-pulse rounded-lg bg-muted"
          style={{ height }}
        />
      }
    >
      {children}
    </Suspense>
  );
});
```

**4.3 Lazy load CategoryManager (12KB source)**

```typescript
const CategoryManager = lazy(() => import('./CategoryManager'));
```

**4.4 Lazy load Footer (19KB source)**

```typescript
const Footer = lazy(() => import('./Footer'));
```

---

### STEP 5: Runtime Performance Optimizations (90 min)

**5.1 React.memo audit — wrap expensive components**

Components to wrap with `React.memo`:

| Component | File | Reason |
|-----------|------|--------|
| `TransactionRow` | `TransactionRow.tsx` | Rendered 50-100x in lists |
| `BudgetCard` | `BudgetCard.tsx` | Rendered per category (10+) |
| `GoalCard` | `GoalCard.tsx` | Rendered per goal |
| `AIInsightCard` | `AIInsightCard.tsx` | Re-renders on parent state |
| `PrivacyAmount` | `PrivacyAmount.tsx` | Rendered 50-100x in lists |
| `TrendChip` | `TrendChip.tsx` | Rendered in multiple lists |
| `WalletChips` | `WalletChips.tsx` | Re-renders on filter change |
| `BriefingCard` | `BriefingCard.tsx` | Static content mostly |
| `ScreenStates` | `ScreenStates.tsx` | Loading/Error/Empty states |

Pattern for each:
```typescript
// Before:
export function TransactionRow({ transaction }: Props) { ... }

// After:
export const TransactionRow = memo(function TransactionRow({ transaction }: Props) {
  // ... same implementation
});
```

**5.2 useMemo / useCallback audit**

Audit ALL 16 hooks in `frontend/src/hooks/`:

| Hook | Memoize What |
|------|-------------|
| `useTransactions.ts` | Memoize filtered/sorted transaction arrays |
| `useBudgets.ts` | Memoize budget calculation results |
| `useGoals.ts` | Memoize goal progress percentages |
| `useCategories.ts` | Memoize category lookup maps |
| `useCategoryTransactions.ts` | Memoize grouped transaction data |
| `useRecurringBills.ts` | Memoize upcoming bills list |
| `useWallets.ts` | Memoize wallet balance calculations |
| `useSubscription.ts` | Memoize plan feature flags |
| `useScreenState.ts` | Memoize combined loading/error state |
| `useTransactionForm.ts` | Memoize form handlers with useCallback |
| `useCategoryManager.ts` | Memoize category tree computation |

Pattern:
```typescript
// Before:
const filteredTransactions = transactions.filter(t => t.type === 'expense');

// After:
const filteredTransactions = useMemo(
  () => transactions.filter(t => t.type === 'expense'),
  [transactions]
);

// Before:
const handleSubmit = () => { ... };

// After:
const handleSubmit = useCallback(() => { ... }, [dependencies]);
```

**5.3 Virtual scrolling for Riwayat transaction list**

Install `@tanstack/react-virtual`:
```bash
npm install @tanstack/react-virtual
```

Implement in `Riwayat.tsx`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height in px
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TransactionRow transaction={transactions[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**5.4 Debounce search inputs**

Create `frontend/src/hooks/useDebounce.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

Apply to Riwayat search:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Use debouncedSearch for filtering, not searchQuery
```

**5.5 Throttle scroll handlers**

Create `frontend/src/hooks/useThrottle.ts`:

```typescript
import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 100
): T {
  const lastCall = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback((...args: any[]) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall.current);

    if (remaining <= 0) {
      lastCall.current = now;
      callback(...args);
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, remaining);
    }
  }, [callback, delay]) as T;
}
```

---

### STEP 6: Network Optimization (60 min)

**6.1 Stale-while-revalidate pattern**

Create `frontend/src/hooks/useStaleWhileRevalidate.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

interface SWROptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  staleTime?: number;     // ms before data considered stale (default: 30s)
  cacheTime?: number;     // ms before cache evicted (default: 5min)
}

const cache = new Map<string, { data: unknown; timestamp: number }>();

export function useStaleWhileRevalidate<T>({
  key,
  fetcher,
  staleTime = 30_000,
  cacheTime = 300_000,
}: SWROptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data as T;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsValidating(true);
      const result = await fetcher();
      cache.set(key, { data: result, timestamp: Date.now() });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, fetcher]);

  useEffect(() => {
    const cached = cache.get(key);
    if (cached) {
      setData(cached.data as T);
      setIsLoading(false);

      // Revalidate if stale
      if (Date.now() - cached.timestamp > staleTime) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [key, staleTime, fetchData]);

  const mutate = useCallback(() => {
    cache.delete(key);
    return fetchData();
  }, [key, fetchData]);

  return { data, isLoading, isValidating, error, mutate };
}
```

**6.2 Request deduplication**

Create `frontend/src/lib/requestDedup.ts`:

```typescript
const inflight = new Map<string, Promise<unknown>>();

export function deduplicateRequest<T>(
  key: string,
  request: () => Promise<T>
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = request().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}
```

**6.3 Optimize Supabase queries — select specific columns**

Audit and optimize each hook's Supabase query:

```typescript
// BEFORE (selects all columns):
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId);

// AFTER (select only needed columns):
const { data } = await supabase
  .from('transactions')
  .select('id, amount, type, category, note, date, wallet_id')
  .eq('user_id', userId)
  .order('date', { ascending: false })
  .limit(50); // Add pagination
```

Files to optimize:
- `useTransactions.ts` — add `.select(...)` and `.limit(50)`
- `useBudgets.ts` — add `.select('id, category, amount, month, year')`
- `useGoals.ts` — add `.select('id, name, target_amount, saved_amount, deadline')`
- `useWallets.ts` — add `.select('id, name, type, icon, is_primary, initial_balance')`
- `useCategories.ts` — add `.select('id, name, type, icon, color, parent_group_id')`
- `useRecurringBills.ts` — add `.select(...)` with needed columns only

**6.4 Add pagination to Riwayat**

```typescript
const PAGE_SIZE = 50;

export function useTransactionsPaginated(userId: number, page: number) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  return useStaleWhileRevalidate({
    key: `transactions-${userId}-${page}`,
    fetcher: async () => {
      const { data, count } = await supabase
        .from('transactions')
        .select('id, amount, type, category, note, date, wallet_id', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .range(from, to);

      return { transactions: data ?? [], total: count ?? 0, hasMore: (count ?? 0) > to + 1 };
    },
  });
}
```

---

### STEP 7: Image & Asset Optimization (45 min)

**7.1 DiceBear avatar optimization**

Create `frontend/src/lib/avatar.ts`:

```typescript
const avatarCache = new Map<string, string>();

export function getAvatarUrl(userId: string | number, size: number = 40): string {
  const key = `${userId}-${size}`;
  if (avatarCache.has(key)) return avatarCache.get(key)!;

  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&size=${size}`;
  avatarCache.set(key, url);
  return url;
}

// Preload avatar as <link rel="preload"> in document head
export function preloadAvatar(userId: string | number) {
  const url = getAvatarUrl(userId);
  const existing = document.querySelector(`link[href="${url}"]`);
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  }
}
```

**7.2 Lazy image component**

Create `frontend/src/app/components/LazyImage.tsx`:

```typescript
import { useState, useRef, useEffect, memo } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  placeholder = 'data:image/svg+xml,...', // 1px transparent SVG
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className} style={{ width, height }}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
});
```

**7.3 Add static asset compression script**

Create `frontend/scripts/compress-assets.sh` (or PowerShell equivalent):

```powershell
# frontend/scripts/compress-assets.ps1
# Compress images in public/ directory

$publicDir = Join-Path $PSScriptRoot ".." "public"

Write-Host "Checking for uncompressed images in $publicDir..."

Get-ChildItem -Path $publicDir -Recurse -Include "*.png","*.jpg","*.jpeg" | ForEach-Object {
    Write-Host "  Found: $($_.Name) ($([math]::Round($_.Length / 1KB, 1)) KB)"
}

Write-Host ""
Write-Host "Recommendation: Convert large images to WebP format."
Write-Host "Use: npx sharp-cli --input <file> --output <file>.webp --webp"
```

**7.4 Add `loading="lazy"` and `decoding="async"` to all `<img>` tags**

Search and update all img tags in components and pages:
```bash
# Find all img tags
grep -rn "<img" frontend/src/ --include="*.tsx"
```

For each, ensure:
```html
<img loading="lazy" decoding="async" alt="descriptive text" ... />
```

---

### STEP 8: Animation Performance (45 min)

**8.1 GPU-acceleration audit**

Create `frontend/src/lib/animationPerf.ts`:

```typescript
// Only use GPU-accelerated properties for animations
// SAFE: transform, opacity
// AVOID: width, height, top, left, margin, padding, border

export const gpuSafeProperties = {
  x: true,
  y: true,
  scale: true,
  scaleX: true,
  scaleY: true,
  rotate: true,
  rotateX: true,
  rotateY: true,
  opacity: true,
} as const;

// Validate animation variants only use GPU-safe properties
export function validateAnimationVariants(
  variants: Record<string, Record<string, unknown>>
): boolean {
  const unsafeProps = ['width', 'height', 'top', 'left', 'right', 'bottom',
    'margin', 'padding', 'border', 'fontSize', 'lineHeight'];

  for (const [, values] of Object.entries(variants)) {
    for (const prop of Object.keys(values)) {
      if (unsafeProps.includes(prop)) {
        console.warn(`[AnimPerf] Unsafe CSS property "${prop}" used in animation. Use transform instead.`);
        return false;
      }
    }
  }
  return true;
}
```

**8.2 Audit all motion/react animations in `transitions.ts`**

Verify every preset uses only `transform` and `opacity`:

```typescript
// ✅ Safe (GPU-accelerated):
pageEnter: { opacity: 0 → 1, y: 8 → 0 }      // y uses translateY
fadeUp:    { opacity: 0 → 1, y: 8 → 0 }
modalEnter:{ opacity: 0 → 1, scale: 0.97 → 1 }
slideInRight: { x: 32 → 0 }                    // x uses translateX

// ❌ Unsafe (causes layout thrashing):
// height: 0 → 'auto'
// width: 0 → 200
// padding: 0 → 16
```

**8.3 `prefers-reduced-motion` compliance**

Verify every animated component respects reduced motion:

```typescript
import { useReducedMotion } from 'motion/react';

export function AnimatedCard({ children }: Props) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
```

**8.4 Disable heavy animations on low-end devices**

Create `frontend/src/hooks/useDeviceCapability.ts`:

```typescript
export function useDeviceCapability() {
  const isLowEnd =
    navigator.hardwareConcurrency <= 4 ||
    (navigator as any).deviceMemory <= 4 ||
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    isLowEnd,
    shouldAnimate: !isLowEnd,
    animationDuration: isLowEnd ? 0 : undefined,
  };
}
```

---

### STEP 9: Core Web Vitals & Monitoring (60 min)

**9.1 Install web-vitals**
```bash
npm install web-vitals
```

**9.2 Create `frontend/src/lib/webVitals.ts`**

```typescript
import { onCLS, onFID, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

interface VitalsReport {
  cls: number | null;
  fid: number | null;
  lcp: number | null;
  ttfb: number | null;
  inp: number | null;
}

const vitalsReport: VitalsReport = {
  cls: null, fid: null, lcp: null, ttfb: null, inp: null,
};

function handleMetric(metric: Metric) {
  const { name, value } = metric;

  switch (name) {
    case 'CLS': vitalsReport.cls = value; break;
    case 'FID': vitalsReport.fid = value; break;
    case 'LCP': vitalsReport.lcp = value; break;
    case 'TTFB': vitalsReport.ttfb = value; break;
    case 'INP': vitalsReport.inp = value; break;
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    const status = getVitalStatus(name, value);
    console.log(
      `%c[WebVital] ${name}: ${value.toFixed(2)} (${status})`,
      status === 'good' ? 'color: green' : status === 'needs-improvement' ? 'color: orange' : 'color: red'
    );
  }
}

function getVitalStatus(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FID: [100, 300],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };

  const [good, poor] = thresholds[name] ?? [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export function initWebVitals() {
  onCLS(handleMetric);
  onFID(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
  onINP(handleMetric);
}

export function getVitalsReport() {
  return { ...vitalsReport };
}
```

**9.3 Initialize in `main.tsx`**

```typescript
import { initWebVitals } from './lib/webVitals';

// After React render
initWebVitals();
```

**9.4 Create performance debug panel (dev only)**

Create `frontend/src/app/components/DevPerfPanel.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { getVitalsReport } from '@/lib/webVitals';

export function DevPerfPanel() {
  const [vitals, setVitals] = useState(getVitalsReport());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setVitals(getVitalsReport()), 2000);
    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full bg-black text-white p-2 text-xs shadow-lg"
      >
        ⚡ Perf
      </button>
      {isOpen && (
        <div className="absolute bottom-10 right-0 bg-black text-white text-xs rounded-lg p-3 min-w-[200px] shadow-xl">
          <div className="font-bold mb-2">Core Web Vitals</div>
          <div>LCP: {vitals.lcp?.toFixed(0) ?? '...'} ms (target: &lt;2500)</div>
          <div>FID: {vitals.fid?.toFixed(0) ?? '...'} ms (target: &lt;100)</div>
          <div>CLS: {vitals.cls?.toFixed(3) ?? '...'} (target: &lt;0.1)</div>
          <div>TTFB: {vitals.ttfb?.toFixed(0) ?? '...'} ms (target: &lt;800)</div>
          <div>INP: {vitals.inp?.toFixed(0) ?? '...'} ms (target: &lt;200)</div>
        </div>
      )}
    </div>
  );
}
```

**9.5 Add to App.tsx (dev only)**

```typescript
{import.meta.env.DEV && <DevPerfPanel />}
```

---

## FILE TOUCH LIST

### Files CREATED (new)
| File | Purpose |
|------|---------|
| `frontend/src/app/LazyPages.tsx` | Centralized lazy imports for all pages |
| `frontend/src/app/components/SuspenseBoundary.tsx` | Reusable Suspense wrappers |
| `frontend/src/app/components/LazyImage.tsx` | Lazy loading image component |
| `frontend/src/app/components/DevPerfPanel.tsx` | Dev-only performance panel |
| `frontend/src/hooks/useDebounce.ts` | Debounce hook |
| `frontend/src/hooks/useThrottle.ts` | Throttle hook |
| `frontend/src/hooks/useStaleWhileRevalidate.ts` | SWR data fetching hook |
| `frontend/src/hooks/useDeviceCapability.ts` | Device capability detection |
| `frontend/src/lib/preload.ts` | Route preloading utilities |
| `frontend/src/lib/requestDedup.ts` | Request deduplication |
| `frontend/src/lib/webVitals.ts` | Core Web Vitals monitoring |
| `frontend/src/lib/avatar.ts` | DiceBear avatar caching |
| `frontend/src/lib/animationPerf.ts` | Animation performance utilities |
| `frontend/scripts/compress-assets.ps1` | Asset compression script |
| `docs/performance-baseline.md` | Baseline metrics documentation |

### Files MODIFIED
| File | Changes |
|------|---------|
| `frontend/vite.config.ts` | Add visualizer plugin, optimize chunks |
| `frontend/package.json` | Add analyze script, new dependencies |
| `frontend/src/app/App.tsx` | Replace static imports with lazy, add Suspense |
| `frontend/src/main.tsx` | Add webVitals init |
| `frontend/src/app/components/Layout.tsx` | Add preload onMouseEnter to nav links |
| `frontend/src/app/components/TransactionRow.tsx` | Wrap with React.memo |
| `frontend/src/app/components/BudgetCard.tsx` | Wrap with React.memo |
| `frontend/src/app/components/GoalCard.tsx` | Wrap with React.memo |
| `frontend/src/app/components/AIInsightCard.tsx` | Wrap with React.memo |
| `frontend/src/app/components/PrivacyAmount.tsx` | Wrap with React.memo |
| `frontend/src/app/components/TrendChip.tsx` | Wrap with React.memo |
| `frontend/src/app/components/WalletChips.tsx` | Wrap with React.memo |
| `frontend/src/app/components/BriefingCard.tsx` | Wrap with React.memo |
| `frontend/src/app/components/ScreenStates.tsx` | Wrap with React.memo |
| `frontend/src/app/pages/Riwayat.tsx` | Add virtual scrolling, debounced search |
| `frontend/src/hooks/useTransactions.ts` | Optimize query, add useMemo |
| `frontend/src/hooks/useBudgets.ts` | Optimize query, add useMemo |
| `frontend/src/hooks/useGoals.ts` | Optimize query, add useMemo |
| `frontend/src/hooks/useWallets.ts` | Optimize query, add useMemo |
| `frontend/src/hooks/useCategories.ts` | Optimize query, add useMemo |
| `frontend/src/hooks/useRecurringBills.ts` | Optimize query, add useMemo |
| `frontend/src/hooks/useTransactionForm.ts` | Add useCallback for handlers |
| `frontend/src/hooks/useCategoryManager.ts` | Add useMemo for tree computation |
| `frontend/src/lib/transitions.ts` | Verify GPU-safe properties only |

### Files DELETED
None.

---

## EXPECTED OUTPUTS

When Phase 09 is complete, the following must be true:

1. **Bundle Analysis:** `npm run analyze` generates visual report in `dist/bundle-report.html`
2. **Chunk Splitting:** Build output shows 9+ named chunks with no chunk > 100KB gzipped
3. **Initial Bundle:** Total initial JS < 300KB gzipped (vendor + app + CSS)
4. **Lazy Loading:** All 39 pages use `React.lazy` — zero static page imports in `App.tsx`
5. **Suspense Boundaries:** Every lazy component wrapped in appropriate `<Suspense>` with skeleton fallback
6. **Route Preloading:** Critical routes (Overview, Pengeluaran, Riwayat) preload on idle
7. **Nav Preloading:** Hovering nav links triggers `import()` for target page
8. **React.memo:** 9+ frequently-rendered components wrapped with `React.memo`
9. **useMemo/useCallback:** All hooks optimized with appropriate memoization
10. **Virtual Scrolling:** Riwayat transaction list uses `@tanstack/react-virtual`
11. **Debounce/Throttle:** Search inputs debounced at 300ms, scroll handlers throttled at 100ms
12. **Supabase Queries:** All queries use specific column `.select()` and `.limit()`
13. **Web Vitals:** `web-vitals` library integrated and reporting in console (dev mode)
14. **Dev Panel:** Performance debug panel visible in development mode
15. **Animation Safety:** All animations use only `transform` and `opacity`
16. **Reduced Motion:** Every animated component respects `prefers-reduced-motion`
17. **Build passes:** `npm run build` succeeds with no errors
18. **Types pass:** `npm run typecheck` succeeds with no errors

---

## VALIDATION STEPS

### Automated Validation
```bash
# 1. Build succeeds
cd frontend && npm run build

# 2. TypeScript compiles
npm run typecheck

# 3. Tests pass
npm run test

# 4. Bundle analysis
npm run analyze
# → Open dist/bundle-report.html and verify chunk sizes

# 5. Check no static page imports in App.tsx
grep -c "from './pages/" src/app/App.tsx
# Should return 0 (all imports moved to LazyPages.tsx)

# 6. Verify React.memo usage
grep -rc "React.memo\|memo(" src/app/components/ --include="*.tsx"
# Should return >= 9

# 7. Verify lazy imports
grep -c "lazy(" src/app/LazyPages.tsx
# Should return >= 39
```

### Manual Validation
1. **Dev Server Test:** Run `npm run dev`, navigate all routes — no white screens, all load correctly
2. **Network Tab:** Open DevTools Network, check that page chunks load on navigation (not all upfront)
3. **Performance Tab:** Run Lighthouse on `/overview` — LCP < 2.5s, CLS < 0.1
4. **Throttled Test:** Use Chrome DevTools "Slow 3G" throttling, verify app loads within 5s
5. **Reduced Motion:** Enable `prefers-reduced-motion: reduce` in Chrome DevTools → Rendering, verify no animations
6. **Virtual Scroll:** Navigate to Riwayat with 100+ transactions, verify smooth scrolling with no jank
7. **Console Check:** Open console in dev mode, verify Web Vitals are being logged

---

## GIT COMMIT CHECKPOINTS

```
# After Step 1 (Bundle Analysis)
git add -A && git commit -m "perf(phase09): add bundle analysis tooling with vite-plugin-visualizer"

# After Step 2 (Chunk Splitting)
git add -A && git commit -m "perf(phase09): optimize manual chunk splitting strategy — 9 named chunks"

# After Step 3 (Code Splitting)
git add -A && git commit -m "perf(phase09): implement route-based code splitting with React.lazy for all 39 pages"

# After Step 4 (Lazy Components)
git add -A && git commit -m "perf(phase09): lazy load heavy components — TransactionModal, charts, Footer"

# After Step 5 (Runtime Perf)
git add -A && git commit -m "perf(phase09): React.memo audit, useMemo/useCallback, virtual scroll, debounce/throttle"

# After Step 6 (Network)
git add -A && git commit -m "perf(phase09): SWR pattern, request dedup, Supabase query optimization, pagination"

# After Step 7 (Assets)
git add -A && git commit -m "perf(phase09): DiceBear caching, LazyImage component, asset optimization"

# After Step 8 (Animations)
git add -A && git commit -m "perf(phase09): GPU-safe animation audit, reduced-motion compliance, low-end device detection"

# After Step 9 (Monitoring)
git add -A && git commit -m "perf(phase09): web-vitals integration, dev perf panel, Core Web Vitals monitoring"

# Final
git add -A && git commit -m "perf(phase09): PHASE 09 COMPLETE — performance optimization"
git tag phase-09-complete
```

---

## ROLLBACK INSTRUCTIONS

Phase 09 is entirely additive (new files + wrappers). Rollback is straightforward:

```bash
# Full rollback to Phase 08
git revert --no-commit HEAD~10..HEAD
git commit -m "revert: rollback Phase 09 performance optimizations"

# OR reset to Phase 08 tag
git reset --hard phase-08-complete

# Partial rollback (keep analysis, revert code splitting)
git revert <commit-hash-of-step-3>  # Revert code splitting only
```

**Post-rollback cleanup:**
1. Remove new devDependencies: `npm uninstall rollup-plugin-visualizer @tanstack/react-virtual web-vitals`
2. Restore static imports in `App.tsx` from `LazyPages.tsx`
3. Delete new files: `LazyPages.tsx`, `SuspenseBoundary.tsx`, etc.

---

## SESSION RECAP TEMPLATE

```markdown
## Phase 09 Session Recap — [DATE]

### Session Number: ___/4
### Duration: ___ minutes
### Steps Completed: ___

### Files Created:
- [ ] List new files

### Files Modified:
- [ ] List modified files

### Metrics Before:
- Total bundle: ___ KB
- Largest chunk: ___ KB
- Number of chunks: ___

### Metrics After:
- Total bundle: ___ KB (Δ: ___)
- Largest chunk: ___ KB (Δ: ___)
- Number of chunks: ___

### Issues Encountered:
- None / describe

### Next Session Focus:
- Step(s) ___

### Git Commits Made:
- [ ] List commit messages
```

---

## ARCHITECTURE NOTES

### Decision: Custom SWR vs Library (TanStack Query / SWR)
**Choice:** Custom lightweight SWR hook  
**Rationale:** Adding `@tanstack/react-query` (30KB) or `swr` (15KB) contradicts the performance optimization goal. A custom 80-line SWR hook covers the project's needs (simple cache, stale revalidation, manual invalidation) without bundle bloat. If the app grows significantly, migration to TanStack Query is straightforward — the hook API is intentionally similar.

### Decision: Virtual Scrolling Library
**Choice:** `@tanstack/react-virtual` (8KB gzipped)  
**Rationale:** Lightest-weight virtualization library available. Only needed for Riwayat (potentially 1000+ transactions). `react-window` (6KB) was considered but `@tanstack/react-virtual` has better TypeScript support and is actively maintained by the same team.

### Decision: No Service Worker / PWA
**Choice:** Deferred to post-AETHER  
**Rationale:** Service workers add complexity (cache invalidation, update notifications) that's out of scope for a 3-5 day performance sprint. The stale-while-revalidate pattern at the React level provides 80% of the benefit without the operational complexity.

### Decision: Manual Chunks vs Dynamic Splitting
**Choice:** `manualChunks` in Vite config  
**Rationale:** Vite's automatic code splitting via `React.lazy` handles page-level splitting well. `manualChunks` is needed only to consolidate vendor libraries into predictable, cacheable chunks. Without it, Radix UI would create 20+ tiny chunks.

### Decision: Web Vitals Reporting — Console Only
**Choice:** Console logging in dev, no production analytics  
**Rationale:** Production RUM requires a backend endpoint or third-party service (e.g., Sentry, Datadog). This is infrastructure setup, not frontend code. Console logging gives developers immediate feedback during development. Production analytics can be added in a future ops sprint.

---

## UI CONSISTENCY CHECKS

- [ ] Suspense fallback skeletons match existing `<LoadingState>` component visual style
- [ ] Lazy-loaded pages render identically to statically-imported versions
- [ ] No flash of unstyled content (FOUC) during lazy page loads
- [ ] Dev performance panel does not overlap with FAB button
- [ ] Virtual scrolling in Riwayat preserves row styling and spacing
- [ ] LazyImage placeholder matches surrounding component background

---

## MOBILE RESPONSIVENESS CHECKS

- [ ] Suspense fallback skeletons work on 320px–430px viewports
- [ ] Virtual scroll list works with touch scrolling (momentum scroll)
- [ ] Dev perf panel hidden on mobile (or positioned away from bottom nav)
- [ ] Nav link preloading works with touch (onTouchStart as onMouseEnter equivalent)
- [ ] No layout shift when lazy components load in

---

## ACCESSIBILITY CHECKS

- [ ] `prefers-reduced-motion` disables all transform-based animations
- [ ] Suspense fallback skeletons have `role="progressbar"` and `aria-label`
- [ ] Virtual scroll list maintains keyboard navigation (arrow keys, Tab)
- [ ] LazyImage has proper `alt` text propagation
- [ ] Dev perf panel button has `aria-label="Performance metrics"`
- [ ] Focus management preserved when lazy-loaded modals open

---

## TECHNICAL DEBT PREVENTION CHECKS

- [ ] No `any` types introduced in new files
- [ ] All new hooks have JSDoc comments
- [ ] `requestDedup.ts` includes TTL to prevent memory leaks
- [ ] SWR cache has size limit (max 100 entries)
- [ ] `useDebounce` and `useThrottle` clean up timers on unmount
- [ ] Virtual scrolling integrates with existing `useTransactions` hook (not parallel)
- [ ] `preloadOnHover` doesn't trigger on mobile (only pointer devices)
- [ ] Bundle analysis report is gitignored (`dist/bundle-report.html`)

---

## CLAUDE CODE SESSION BATCHES

### Session 1: Analysis & Chunk Optimization (60–90 min)
**Steps:** 1, 2  
**Context needed:** `vite.config.ts`, `package.json`  
**Deliverable:** Bundle analysis setup + optimized chunk strategy  
**Commit:** 2 commits  

### Session 2: Code Splitting & Lazy Loading (90–120 min)
**Steps:** 3, 4  
**Context needed:** `App.tsx`, all page imports, `Layout.tsx`  
**Deliverable:** All 39 pages lazy-loaded, Suspense boundaries, preloading  
**Commit:** 2 commits  

### Session 3: Runtime Performance (90–120 min)
**Steps:** 5, 6  
**Context needed:** All hooks (16 files), `Riwayat.tsx`, `TransactionRow.tsx`  
**Deliverable:** React.memo, useMemo/useCallback, virtual scroll, SWR, Supabase optimization  
**Commit:** 2 commits  

### Session 4: Assets, Animations & Monitoring (60–90 min)
**Steps:** 7, 8, 9  
**Context needed:** `transitions.ts`, `main.tsx`, static assets  
**Deliverable:** LazyImage, DiceBear caching, web-vitals, dev panel  
**Commit:** 3 commits  

> [!IMPORTANT]
> Each session must end with `npm run build && npm run typecheck` passing. Never leave a session in a broken state.

---

## FIGMA REFERENCE LINKS

No Figma work in Phase 09 — this is a code-only optimization phase.

**Reference only:**
- Loading skeleton designs → used for Suspense fallback styling
- Empty state designs → ensure they render correctly after lazy loading

---

## DEPENDENCY OUTPUTS

Phase 09 produces the following for Phase 10 (QA & Polish):

| Output | Used By Phase 10 |
|--------|-----------------|
| Bundle analysis report (`dist/bundle-report.html`) | QA: Verify production build sizes |
| Web Vitals monitoring (`webVitals.ts`) | QA: Measure Core Web Vitals targets |
| Dev performance panel | QA: Visual verification of metrics |
| Virtual scrolling in Riwayat | QA: Test with large datasets |
| `prefers-reduced-motion` compliance | QA: Accessibility audit |
| Suspense fallback skeletons | QA: Visual consistency check |
| Lazy-loaded pages | QA: Cross-browser testing (lazy loading compat) |
| Optimized Supabase queries | QA: Verify no data regressions |
| `docs/performance-baseline.md` | QA: Before/after comparison |

---

## CORE WEB VITALS TARGET CHECKLIST

| Metric | Target | How to Measure |
|--------|--------|---------------|
| **LCP** | < 2.5s | Lighthouse on /overview with throttling |
| **FID** | < 100ms | Web Vitals console log after interaction |
| **CLS** | < 0.1 | Lighthouse or DevPerfPanel |
| **TTFB** | < 800ms | Web Vitals console log on initial load |
| **INP** | < 200ms | Web Vitals console log on interaction |
| **Initial Bundle** | < 300KB gzipped | `npm run build` output |
| **Largest Chunk** | < 100KB gzipped | Bundle analysis report |
| **Time to Interactive** | < 3.5s | Lighthouse |

> [!TIP]
> Run Lighthouse in Incognito mode with no extensions for accurate measurements. Use "Mobile" device preset with "Slow 4G" throttling for worst-case testing.
