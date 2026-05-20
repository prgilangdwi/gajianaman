# Phase 2, Step 2 — Testing Walkthrough

**Dev Server:** http://localhost:5173  
**Status:** All 4 screens ready for manual testing  
**Time estimate:** 45 minutes  

---

## Quick Test Script (Follow in Browser)

### Screen 1: Overview (http://localhost:5173/overview)

#### 1.1 Loaded State (Normal visit)
- [ ] Page loads with 3 summary cards (Saldo, Pemasukan, Pengeluaran)
- [ ] 7-day chart visible with weekly income/expense bars
- [ ] Calendar heatmap shows with color intensity (light = low, red = high spend)
- [ ] Health score card visible (if implemented)
- [ ] Export PDF button clickable in top right
- [ ] **Visual check:** No text overflow, cards aligned, spacing even

#### 1.2 Loading State (Network throttled)
1. Open DevTools (F12) → Network tab
2. Throttle to "Slow 3G"
3. Refresh page (Cmd+Shift+R or Ctrl+Shift+R)
4. Within first 2 seconds, you should see:
   - [ ] 3 skeleton card placeholders (shimmer animation)
   - [ ] Skeleton animation runs smoothly
   - [ ] No actual content visible
   - [ ] **Visual check:** Animation feels natural, no jumps

#### 1.3 Empty State (No transactions)
1. In month/year filter, navigate to a month with no transactions
   - (or manually test by looking for a month you know is empty)
2. Page should show:
   - [ ] "Dashboard Kosong" title
   - [ ] "Mulai dengan menambahkan transaksi..." message
   - [ ] "Tambah Transaksi" button is visible and clickable
   - [ ] Button navigates to /add-transaction on click
   - [ ] **Visual check:** Centered layout, clear messaging, CTA button prominent

#### 1.4 Error State (Offline simulation)
1. DevTools → Network tab → set to "Offline"
2. Refresh page (Cmd+Shift+R)
3. Page should show:
   - [ ] Error icon (triangle alert)
   - [ ] "Gagal memuat dashboard" title
   - [ ] "Terjadi kesalahan..." message
   - [ ] "Coba Lagi" button is visible
   - [ ] Button refreshes page and retries on click
4. Turn offline mode off and click "Coba Lagi" to recover
   - [ ] Page reloads and shows loaded state if transactions exist
   - [ ] **Visual check:** Error state has good contrast, button obvious

---

### Screen 2: Pengeluaran (http://localhost:5173/pengeluaran)

#### 2.1 Loaded State
- [ ] "Total Pengeluaran" card shows total amount
- [ ] "Kategori Teratas" card shows top category name + emoji
- [ ] Horizontal bar chart renders with all categories
- [ ] Each bar has proper height (proportional to amount)
- [ ] **Visual check:** Chart axes labeled, no overlap

#### 2.2 Loading State
1. Throttle to Slow 3G
2. Refresh (Cmd+Shift+R)
3. You should see:
   - [ ] 3 skeleton cards at top
   - [ ] Shimmer animation on all placeholders
   - [ ] No chart content visible initially

#### 2.3 Empty State
1. Navigate to a month with no expenses
2. Page shows:
   - [ ] "Belum ada pengeluaran" title
   - [ ] "Anda belum mencatat pengeluaran..." message
   - [ ] "Tambah Pengeluaran" button visible
   - [ ] **Visual check:** Clear, centered layout

#### 2.4 Error State
1. Set Network to Offline
2. Refresh page
3. Shows:
   - [ ] Error icon + "Gagal memuat pengeluaran" title
   - [ ] "Coba Lagi" button works
   - [ ] **Visual check:** Error message is distinct from loaded state

---

### Screen 3: Riwayat (http://localhost:5173/riwayat)

#### 3.1 Loaded State
- [ ] 2 KPI cards at top (Pemasukan + Pengeluaran for month)
- [ ] Wallet filter dropdown visible (if you have wallets)
- [ ] Type filter (Semua Tipe / Pemasukan / Pengeluaran) works
- [ ] Search input responsive
- [ ] "Export" button with CSV/PDF options visible
- [ ] Transaction rows display below with:
  - [ ] Category icon on left
  - [ ] Transaction description
  - [ ] Date on right
  - [ ] Amount (color-coded: green for income, red for expense)
- [ ] Rows show transaction count in header
- [ ] **Visual check:** No text cutoff on mobile, rows clearly separated

#### 3.2 Loading State
1. Throttle to Slow 3G
2. Refresh
3. Shows:
   - [ ] 5 skeleton rows (matching transaction row structure)
   - [ ] Smooth shimmer animation
   - [ ] No real transaction data visible

#### 3.3 Empty State
1. Navigate to empty month
2. Shows:
   - [ ] "Belum ada transaksi" title
   - [ ] "Belum ada riwayat transaksi..." message
   - [ ] "Tambah Transaksi" button
   - [ ] **Visual check:** Single column, centered

#### 3.4 Error State
1. Network → Offline
2. Refresh
3. Shows error with retry button
4. Click retry to recover

---

### Screen 4: Tren (http://localhost:5173/tren)

#### 4.1 Loaded State (3+ months data required)
- [ ] "Pemasukan vs Pengeluaran" line chart renders
  - [ ] 2 lines (green for income, red for expense)
  - [ ] X-axis shows months (Jan, Feb, Mar, etc.)
  - [ ] Y-axis shows compact numbers (1M, 2M, 10jt, etc.)
  - [ ] Legend visible with both line names
- [ ] "Tren Kategori" area chart renders (if 3+ months)
  - [ ] Multiple colored areas stacked
  - [ ] Smooth opacity transitions
- [ ] "Pertumbuhan Tabungan" bar chart shows
  - [ ] Two bar sets: Tabungan Bulan Ini (light green) + Kumulatif (blue)
  - [ ] Cumulative bar grows over time
- [ ] All charts have hover tooltips that show formatted Rupiah
- [ ] **Visual check:** Charts fill width on mobile, axes readable

#### 4.2 Loading State
1. Throttle to Slow 3G
2. Refresh
3. Shows:
   - [ ] 3 skeleton charts (matching chart heights)
   - [ ] Shimmer runs on all placeholders

#### 4.3 Empty State (< 3 months data)
1. If you don't have 3+ months of data:
2. Shows:
   - [ ] "Belum cukup data" title
   - [ ] "Anda membutuhkan minimal 3 bulan..." explanation
   - [ ] "Tambah Transaksi" button
   - [ ] **Visual check:** Clear explanation of requirement

#### 4.4 Error State
1. Network → Offline
2. Refresh
3. Shows error + retry button

---

## Responsive Testing (After Basic Tests Pass)

Test each screen at these breakpoints:

### Mobile (375px — iPhone SE)
1. Resize browser to 375px width
2. For each screen, verify:
   - [ ] No horizontal scroll
   - [ ] Text doesn't overflow
   - [ ] Cards/buttons remain clickable
   - [ ] Charts scale down proportionally
   - [ ] Bottom padding doesn't cut off content

### Tablet (768px — iPad)
1. Resize to 768px
2. Verify:
   - [ ] Grid layouts adjust (e.g., 1 → 2 columns)
   - [ ] Cards have adequate spacing
   - [ ] Charts remain readable

### Desktop (1024px+)
1. Full width browser
2. Verify:
   - [ ] 3-column grids on Overview
   - [ ] Proper max-widths if set
   - [ ] Charts have enough space

---

## Design Token Verification

### Colors Used
- [ ] **Primary headings:** `--color-content-primary` (dark gray/white)
- [ ] **Secondary text:** `--color-content-tertiary` (lighter gray)
- [ ] **Income (Pemasukan):** `--color-sentiment-positive` (green)
- [ ] **Expense (Pengeluaran):** `--color-sentiment-negative` (red)
- [ ] **Card backgrounds:** `--color-bg-card` (light/dark mode aware)
- [ ] **Borders:** `--color-border-neutral`

### Typography
- [ ] **Page titles (h1):** Large, bold, primary color
- [ ] **Card titles:** Medium, slightly smaller than h1
- [ ] **Body text:** Regular weight, readable size
- [ ] **Amounts:** Monospace font (`font-mono`), bold

### Spacing
- [ ] 16px padding inside cards
- [ ] 24px gap between major sections (space-y-6)
- [ ] 8px grid baseline on smaller elements
- [ ] Mobile padding reduced (16px → 12px)

---

## Component Verification Checklist

### Overview Screen
- [ ] WalletChips component visible (if multiple wallets)
- [ ] TrendChip visible on Saldo card (shows trend vs previous month)
- [ ] UpcomingBillsWidget present (if recurring bills exist)
- [ ] All Cards use shadcn/ui Card + CardContent/CardHeader
- [ ] Charts use Recharts (AreaChart for weekly)

### Pengeluaran Screen
- [ ] WalletFilterBar (custom select) present
- [ ] Category cards with visual indicators
- [ ] BarChart uses Recharts with horizontal layout
- [ ] Category expansion toggle works (click category to see last 5 txs)

### Riwayat Screen
- [ ] TransactionRow component renders each transaction
- [ ] Filter bar: wallet select + type select + search input
- [ ] Tag filter buttons appear (if tags exist on transactions)
- [ ] Export dropdown menu functional
- [ ] AnimatePresence on transaction list (smooth remove/add animation)

### Tren Screen
- [ ] LineChart for income vs expense (2 lines)
- [ ] AreaChart for category trend (stacked areas)
- [ ] BarChart for savings growth (2 bar sets)
- [ ] All charts properly connected to data hooks

---

## Success Criteria

After completing all tests:

- [ ] All 4 screens show correct Loaded state
- [ ] All 4 screens show correct Empty state
- [ ] All 4 screens show correct Loading state (smooth shimmer)
- [ ] All 4 screens show correct Error state + retry works
- [ ] State transitions are smooth (no flashing, no jumps)
- [ ] All components render as expected
- [ ] Design tokens applied consistently
- [ ] Responsive at 375px, 768px, 1024px+
- [ ] No console errors or warnings
- [ ] All CTAs (buttons) navigate or refresh correctly

---

## Issues Found & Fixes

| Issue | Screen | Fix |
|-------|--------|-----|
| [Add if found] | [Screen] | [Description] |

---

## Notes

- First visit after deploy may show loading state briefly (this is normal)
- Skeleton shimmer animation is set to 1.5s per cycle
- All state messages are in Indonesian
- Error messages show actual API errors if available
- Reduced motion respected (skips animations if enabled in OS)

---

**Next Steps:**
- [ ] Complete all tests above
- [ ] Document any issues in "Issues Found" table
- [ ] If issues found: fix and re-test
- [ ] If all pass: proceed to Step 3 (Code Review & Refinement)
