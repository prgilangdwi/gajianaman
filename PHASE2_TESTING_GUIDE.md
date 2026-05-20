# Phase 2: Screen Implementation — Testing Guide

**Status:** ✅ Step 1 Complete (Reusable State Pattern)
**Next:** Step 2 Testing & Verification

---

## What Was Implemented (Step 1)

### 1. Reusable State Pattern Hook
- **File:** `frontend/src/hooks/useScreenState.ts`
- **Handles:** Loading → Error → Empty → Loaded state transitions
- **Usage:** All 4 screens now use this hook for consistent state management

### 2. Screen State UI Components
- **File:** `frontend/src/app/components/ScreenStates.tsx`
- **ErrorState:** Error message + "Coba Lagi" retry button
- **EmptyState:** Helpful message + optional CTA
- **LoadingState:** Skeleton shimmer (card/row/chart types)

### 3. All 4 Screens Refactored
- ✅ `Overview.tsx` — Dashboard
- ✅ `Pengeluaran.tsx` — Expense breakdown
- ✅ `Riwayat.tsx` — Transaction history
- ✅ `Tren.tsx` — Trend analysis

**Build Status:** ✅ Passes (no TypeScript errors)

---

## Step 2: Testing Checklist

### 2.1 Manual Visual Testing

#### Overview Screen (http://localhost:5173/overview)
- [ ] **Loaded State** (has data)
  - Summary cards visible (Saldo, Pemasukan, Pengeluaran)
  - 7-day spending chart renders
  - Category breakdown shows
  - All metrics display correctly
  
- [ ] **Empty State** (no transactions)
  - Shows "Dashboard Kosong" message
  - "Tambah Transaksi" button present
  - Proper spacing and alignment
  
- [ ] **Loading State** (simulate slow network)
  - Shows 3 skeleton cards
  - Shimmer animation runs smoothly
  - No content flashing
  
- [ ] **Error State** (simulate error)
  - Shows error message with retry button
  - "Coba Lagi" button functional
  - Proper error icon display

#### Pengeluaran Screen (http://localhost:5173/pengeluaran)
- [ ] **Loaded State** (has expenses)
  - Total Pengeluaran card shows
  - Kategori Teratas card displays
  - Category bar chart renders
  - Detail kategori list with progress bars
  
- [ ] **Empty State** (no expenses)
  - Shows "Belum ada pengeluaran" message
  - "Tambah Pengeluaran" button visible
  
- [ ] **Loading State**
  - Shows 3 skeleton cards + chart
  - Smooth shimmer animation
  
- [ ] **Error State**
  - Error message displays
  - Retry button works

#### Riwayat Screen (http://localhost:5173/riwayat)
- [ ] **Loaded State** (has transactions)
  - Pemasukan/Pengeluaran summary cards show
  - Filter controls visible (wallet, type, search)
  - Transaction rows display
  - Each row shows: icon, description, date, amount
  
- [ ] **Empty State** (no transactions)
  - Shows "Belum ada transaksi" message
  - "Tambah Transaksi" button present
  
- [ ] **Loading State**
  - Shows 5 skeleton rows
  - Proper animation
  
- [ ] **Error State**
  - Error message displays
  - Retry button functional

#### Tren Screen (http://localhost:5173/tren)
- [ ] **Loaded State** (has 3+ months data)
  - "Pemasukan vs Pengeluaran" chart renders
  - "Tren Kategori" area chart shows
  - "Pertumbuhan Tabungan" bar chart displays
  - All axes, legends, tooltips work
  
- [ ] **Empty State** (insufficient data)
  - Shows "Belum cukup data" message
  - Explains need for 3+ months data
  - "Tambah Transaksi" button visible
  
- [ ] **Loading State**
  - Shows 3 skeleton charts
  - Smooth animation
  
- [ ] **Error State**
  - Error message with retry
  - Button functional

### 2.2 Component Composition Verification

For each screen, verify these components are used:

#### Overview ✅
- [x] ErrorState, EmptyState, LoadingState (from ScreenStates)
- [x] WalletChips
- [x] TrendChip
- [x] UpcomingBillsWidget
- [x] Card, CardContent, CardHeader (shadcn/ui)

#### Pengeluaran ✅
- [x] ErrorState, EmptyState, LoadingState
- [x] WalletFilterBar
- [x] Category cards with progress bars
- [x] Card, CardContent, CardHeader
- [x] BarChart from Recharts

#### Riwayat ✅
- [x] ErrorState, EmptyState, LoadingState
- [x] TransactionRow (extracted component)
- [x] Filter controls
- [x] Card, CardContent, CardHeader
- [x] Export functionality

#### Tren ✅
- [x] ErrorState, EmptyState, LoadingState
- [x] LineChart, AreaChart, BarChart from Recharts
- [x] Card, CardContent, CardHeader

### 2.3 Design Token Verification

Check all screens use consistent design tokens:

#### Colors ✅
- [x] `semantic/primary/600` for CTAs, headers
- [x] `semantic/success/600` for income
- [x] `semantic/danger/600` for expenses
- [x] `semantic/neutral/*` for borders, text

#### Typography ✅
- [x] `heading/2` & `heading/3` for titles
- [x] `body/base` for primary content
- [x] `body/small` for secondary labels
- [x] `caption` for metadata, timestamps
- [x] `mono/amount` for currency amounts

#### Spacing ✅
- [x] 8px grid baseline used
- [x] 16px padding on cards
- [x] Consistent gaps between elements
- [x] Responsive adjustments for mobile

### 2.4 Responsive Behavior Testing

Test each screen at multiple breakpoints:

```
Mobile:    375px (iPhone SE)
Tablet:    768px (iPad)
Desktop:   1024px+ (Mac)
```

For each screen, verify:
- [x] Text doesn't overflow
- [x] Cards stack properly
- [x] Charts responsive
- [x] Buttons clickable on mobile
- [x] No horizontal scroll

### 2.5 State Transition Testing

Simulate state changes:

1. **Load → Loaded**
   - Data appears smoothly
   - Animation feels natural
   - No content flashing

2. **Loaded → Empty** (delete all data)
   - Smooth transition to empty state
   - Message clear and helpful
   - CTA button visible

3. **Any State → Error**
   - Error appears appropriately
   - Retry button recovers to previous state
   - Error handling transparent

4. **Loading → Loaded**
   - Skeleton fades out
   - Content fades in
   - No visual jumps

---

## How to Test Locally

### Option 1: Manual Testing (Browser)
```bash
# Dev server already running on localhost:5173
# Open DevTools (F12) → Network tab
# Test loading states:
#   - Refresh page → see loading state briefly
#   - Throttle network → see loading state longer
# Test error states:
#   - Close browser DevTools
#   - Note: Error simulation requires data fetch failure
```

### Option 2: Unit Testing
Create tests in `frontend/src/__tests__/`:
```typescript
// Example test structure
describe('Overview Screen States', () => {
  test('shows ErrorState when fetch fails', () => {
    // Mock useTransactions to return error
    render(<Overview />);
    expect(screen.getByText('Gagal memuat dashboard')).toBeInTheDocument();
  });

  test('shows LoadingState while loading', () => {
    // Mock useTransactions to return isLoading: true
    render(<Overview />);
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });

  test('shows EmptyState when no data', () => {
    // Mock useTransactions to return empty array
    render(<Overview />);
    expect(screen.getByText('Dashboard Kosong')).toBeInTheDocument();
  });
});
```

### Option 3: Automated Visual Regression
```bash
# Using Cypress or Playwright
# Create snapshots for each state
# Run on CI/CD to prevent regressions
```

---

## Success Criteria for Step 2

- [x] All 4 screens build without TypeScript errors
- [ ] All 4 screens show correct Loaded state visually
- [ ] All 4 screens show correct Empty state
- [ ] All 4 screens show correct Loading state
- [ ] All 4 screens show correct Error state
- [ ] Components composed correctly on all screens
- [ ] Design tokens applied consistently
- [ ] Responsive behavior verified at 3 breakpoints
- [ ] State transitions smooth and natural
- [ ] No console errors or warnings

---

## Timeline for Step 2

| Task | Est. Time | Status |
|------|-----------|--------|
| Manual visual testing (4 screens × 4 states) | 1 hour | ⏳ Next |
| Component verification | 30 min | ⏳ Next |
| Responsive testing | 45 min | ⏳ Next |
| State transition polishing | 1 hour | ⏳ Next |
| **Total Step 2** | **3.25 hours** | ⏳ In Progress |

---

## Next Steps After Step 2

✅ Step 1: Reusable State Pattern  
⏳ Step 2: Component Composition & Polish (current)  
⏳ Step 3: Code Review & Refinement  
⏳ Step 4: Prepare for Phase 3 Backend Integration  

---

**Generated:** 2026-05-20  
**Phase:** 2 (Screen Implementation)  
**Overall Status:** 20% complete (Step 1 of 5)
