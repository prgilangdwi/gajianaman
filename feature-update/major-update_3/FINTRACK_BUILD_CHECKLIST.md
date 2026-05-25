# Gajian Aman Frontend — Build Checklist & QA Guide

**Purpose:** Phase-by-phase checklist for implementing the React frontend from scratch.

---

## Phase 1: Project Setup (2 hours)

### Repository & Dependencies
- [ ] Create `frontend/` directory in project root
- [ ] `npm create vite@latest . -- --template react-ts`
- [ ] Install dependencies:
  ```bash
  npm install react-router-dom@7 @supabase/supabase-js@2
  npm install react-hook-form recharts class-variance-authority
  npm install motion sonner
  npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
  ```
- [ ] `npm install shadcn-ui` (init via their CLI for Tailwind setup)
- [ ] Verify `node_modules/.bin/vite` exists

### Configuration Files
- [ ] Copy `tailwind.config.ts` from spec → `frontend/tailwind.config.ts`
- [ ] Copy `postcss.config.cjs` → `frontend/postcss.config.cjs`
- [ ] Create `frontend/.env` with placeholders:
  ```
  VITE_SUPABASE_URL=https://[project].supabase.co
  VITE_SUPABASE_ANON_KEY=[public_key]
  VITE_ANTHROPIC_API_KEY=[key_for_parse_image]
  ```
- [ ] Create `frontend/.env.local` (not committed) with actual values
- [ ] Update `vite.config.ts` with Tailwind plugin:
  ```typescript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwind from '@tailwindcss/vite';
  
  export default defineConfig({
    plugins: [react(), tailwind()],
    resolve: { alias: { '@': '/src' } },
  });
  ```

### Directory Structure
- [ ] Create directory tree:
  ```
  frontend/src/
  ├── app/
  │   ├── App.tsx
  │   ├── components/
  │   │   ├── Layout.tsx
  │   │   ├── ProtectedRoute.tsx
  │   │   ├── TransactionModal.tsx
  │   │   ├── LoadingSpinner.tsx
  │   │   ├── CompoundComponents.tsx
  │   │   └── ui/ (shadcn/ui)
  │   └── pages/
  │       ├── Home.tsx
  │       ├── Pengeluaran.tsx
  │       ├── Tren.tsx
  │       ├── Budget.tsx
  │       ├── Goals.tsx
  │       ├── AiChat.tsx
  │       ├── Settings.tsx
  │       ├── Login.tsx
  │       ├── AuthCallback.tsx
  │       └── LinkTelegram.tsx
  ├── hooks/
  │   ├── useAuth.tsx
  │   ├── useTransactions.ts
  │   ├── useBudgets.ts
  │   ├── useGoals.ts
  │   ├── useMonthFilter.tsx
  │   └── useImageParser.ts
  ├── lib/
  │   ├── supabase.ts
  │   ├── utils.ts
  │   └── constants.ts
  ├── styles/
  │   ├── globals.css
  │   ├── theme.css
  │   ├── fonts.css
  │   └── animations.css
  └── main.tsx
  ```

### Core Files
- [ ] `index.html` with viewport meta:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  ```
- [ ] `main.tsx` entry point
- [ ] `lib/utils.ts` with `cn()` helper
- [ ] `lib/constants.ts` with category enums, colors

### Verification
- [ ] `npm run dev` starts without errors
- [ ] Browser opens to `http://localhost:5173`
- [ ] Vite HMR works (edit file, see live update)
- [ ] No TypeScript errors

---

## Phase 2: Core Library Setup (3 hours)

### Supabase Client & Types
- [ ] Create `lib/supabase.ts` with:
  - [ ] All 10+ TypeScript types (User, Transaction, Budget, Goal, Category, Analytics, etc.)
  - [ ] Supabase client initialization
  - [ ] Type exports for all components
- [ ] Test: `npm run type-check` passes
- [ ] No `any` types except in error handling

### Styling & Theme
- [ ] `styles/globals.css` — base reset, Tailwind directives
- [ ] `styles/theme.css` — CSS variables for colors, spacing, shadows
- [ ] `styles/fonts.css` — @font-face for Inter + DM Mono
- [ ] `styles/animations.css` — keyframe definitions
- [ ] Import all in `main.tsx`
- [ ] Test: Open DevTools → verify CSS variables are set

### Layout Components
- [ ] `components/LoadingSpinner.tsx` — animated spinner, fullScreen variant
- [ ] `components/ProtectedRoute.tsx` — guards routes, redirects to /login
- [ ] `components/Layout.tsx` — sidebar/bottom nav wrapper with Outlet
- [ ] Test: Pages render without crashing

### shadcn/ui Components
- [ ] Install each via CLI:
  ```bash
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add input
  npx shadcn-ui@latest add dialog
  npx shadcn-ui@latest add select
  npx shadcn-ui@latest add badge
  npx shadcn-ui@latest add progress
  npx shadcn-ui@latest add tabs
  npx shadcn-ui@latest add popover
  ```
- [ ] Verify in `app/components/ui/`
- [ ] Do not edit `ui/` files directly

### Verification
- [ ] TypeScript strict mode: no errors
- [ ] All types exported from `lib/supabase.ts`
- [ ] Theme CSS variables visible in DevTools
- [ ] shadcn/ui components render in Storybook or test file

---

## Phase 3: State Management & Hooks (4 hours)

### Authentication Hook
- [ ] `hooks/useAuth.tsx`:
  - [ ] Login with Telegram ID
  - [ ] Login with Google OAuth (redirect to /auth/callback)
  - [ ] Logout (clear localStorage)
  - [ ] LinkTelegram (associate Google user with Telegram ID)
  - [ ] Persist session in localStorage
  - [ ] Loading state
  - [ ] Error messages
- [ ] Test:
  - [ ] Telegram login with valid ID → user stored
  - [ ] Telegram login with invalid ID → error message
  - [ ] Google OAuth flow completes → session stored
  - [ ] Logout clears session
  - [ ] Refresh page → session restored from localStorage

### Transactions Hook
- [ ] `hooks/useTransactions.ts`:
  - [ ] fetchTransactions(filter) — query by month/year/category/type
  - [ ] addTransaction(input) — insert and refetch
  - [ ] updateTransaction(id, input) — update and refetch
  - [ ] deleteTransaction(id) — delete and refetch
  - [ ] Compute dailyAggregates from transactions
  - [ ] Compute categoryAggregates from transactions
  - [ ] Real-time subscriptions to changes
  - [ ] Caching to prevent duplicate fetches
- [ ] Test:
  - [ ] Fetch transactions for current month
  - [ ] Filter by category → correct results
  - [ ] Add transaction → appears in list immediately
  - [ ] Update transaction → list updates
  - [ ] Delete transaction → removed from list
  - [ ] Real-time: open 2 tabs, add in one → appears in other

### Budgets & Goals Hooks
- [ ] `hooks/useBudgets.ts`:
  - [ ] fetchBudgets(month, year)
  - [ ] upsertBudget(category, amount)
  - [ ] Compute BudgetWithProgress (spent, remaining, percentUsed)
- [ ] `hooks/useGoals.ts`:
  - [ ] fetchGoals()
  - [ ] addGoal(name, target, deadline)
  - [ ] updateGoal(id, input)
  - [ ] Compute GoalWithProgress (percentComplete, daysRemaining)
- [ ] Test: CRUD operations work, computed fields are correct

### Month Filter Context
- [ ] `hooks/useMonthFilter.tsx`:
  - [ ] Global month/year state
  - [ ] setMonth, setYear methods
  - [ ] Compute dateRange (start, end of month)
  - [ ] Provider wraps App
- [ ] Test: Change month in one component → all components update

### Verification
- [ ] All hooks export correct types
- [ ] No console errors when calling hooks
- [ ] Data flows through multiple components
- [ ] Real-time subscriptions establish successfully

---

## Phase 4: Pages — Auth Flow (3 hours)

### Login Page
- [ ] `pages/Login.tsx`:
  - [ ] Input for Telegram ID (numeric validation)
  - [ ] Google OAuth button
  - [ ] Submit handlers for both methods
  - [ ] Loading states during login
  - [ ] Error messages display
  - [ ] Success → redirect to / (home)
  - [ ] Already logged in → redirect to / (skip login)
- [ ] Styling: mobile-first, centered, spacing
- [ ] Test:
  - [ ] Telegram ID input accepts only numbers
  - [ ] Submit with valid ID → success screen
  - [ ] Submit with invalid ID → error message
  - [ ] Google button triggers OAuth flow
  - [ ] Session persists on reload

### AuthCallback Page
- [ ] `pages/AuthCallback.tsx`:
  - [ ] Listen to Supabase auth state changes
  - [ ] Extract session from URL
  - [ ] Redirect to /link-telegram or / based on existing user
  - [ ] Handle errors (invalid code, timeout)
- [ ] Test:
  - [ ] Callback URL with valid code → session created
  - [ ] Invalid code → error message

### LinkTelegram Page
- [ ] `pages/LinkTelegram.tsx`:
  - [ ] Input for Telegram ID (numeric)
  - [ ] Instruction text: "Enter your Telegram ID to link this Google account"
  - [ ] Submit handler: call `linkTelegram(id)`
  - [ ] Success → redirect to /
  - [ ] Error → show message
- [ ] Test:
  - [ ] Link valid Telegram ID → success
  - [ ] Link invalid ID → error
  - [ ] Redirect to home after linking

### Verification
- [ ] Full auth flow works: Telegram login
- [ ] Full auth flow works: Google OAuth → link Telegram
- [ ] Session persists across page reloads
- [ ] Unauthenticated users cannot access protected routes

---

## Phase 5: Pages — Dashboard (4 hours)

### Home Page
- [ ] `pages/Home.tsx`:
  - [ ] Month selector in sticky header
  - [ ] 3 summary cards (income, expense, balance)
  - [ ] Daily bar chart (last 30 days)
  - [ ] Category pie chart (donut style)
  - [ ] Recent transactions list (5 rows)
  - [ ] FAB to add transaction
  - [ ] Padding for bottom nav
- [ ] Data binding:
  - [ ] useTransactions(userId) fetches for month
  - [ ] useMonthFilter() provides month context
  - [ ] dailyAggregates computed from transactions
  - [ ] categoryAggregates computed from transactions
- [ ] Interactions:
  - [ ] Change month → charts update
  - [ ] Click transaction row → view details (optional modal)
  - [ ] Click FAB → open TransactionModal
- [ ] Test:
  - [ ] Charts display with real data
  - [ ] Totals are correct
  - [ ] Charts update on month change
  - [ ] FAB opens modal

### Compound Components
- [ ] `components/CompoundComponents.tsx`:
  - [ ] **TransactionRow** — category icon, amount, date, click handler
  - [ ] **BudgetCard** — category, spent/total, progress bar, over-budget warning
  - [ ] **GoalCard** — goal name, progress %, saved/target, days remaining
  - [ ] **CategoryPieChart** — recharts Pie with labels, donut mode
- [ ] Styling: use Tailwind utilities, semantic colors (expense/income/saving)
- [ ] Test:
  - [ ] Each component renders without data errors
  - [ ] Responsive on mobile (fit in 375px)
  - [ ] Colors match design tokens

### Transaction Modal
- [ ] `components/TransactionModal.tsx`:
  - [ ] Modal backdrop + slide-up animation
  - [ ] TransactionForm component inside
  - [ ] Close button (X)
  - [ ] onClose callback
  - [ ] onSubmit callback
- [ ] Motion animations:
  - [ ] Backdrop fades in/out
  - [ ] Modal slides up from bottom with easing
- [ ] Test:
  - [ ] Modal opens/closes
  - [ ] Form submits correctly
  - [ ] Animations are smooth

### Verification
- [ ] Home page loads without errors
- [ ] Data displays with correct formatting (IDR, dates)
- [ ] All interactions work (month change, FAB, etc.)
- [ ] Mobile layout fits 375px without horizontal scroll

---

## Phase 6: Form Components & Validation (3 hours)

### Amount Input
- [ ] `components/CompoundComponents.tsx` → AmountInput
  - [ ] Formats input as "Rp X.XXX.XXX"
  - [ ] Validation: 100 ≤ amount ≤ 100M IDR
  - [ ] Error message display
  - [ ] onChange callback with number value
- [ ] Test:
  - [ ] Type "123456" → displays as "Rp 123.456"
  - [ ] Paste negative number → rejected
  - [ ] Exceed max → capped

### Category Select
- [ ] `components/CompoundComponents.tsx` → CategorySelect
  - [ ] Dropdown populated from categories hook
  - [ ] Filter by type (expense/income/saving)
  - [ ] Show category icon + name
  - [ ] onChange callback
  - [ ] Error display
- [ ] Test:
  - [ ] Select expense → shows expense categories only
  - [ ] Categories display with icons
  - [ ] Selection persists

### Date Range Picker
- [ ] `components/CompoundComponents.tsx` → DateRangePicker
  - [ ] Two date inputs (start, end)
  - [ ] Validation: end ≥ start
  - [ ] onChange callbacks
- [ ] Test:
  - [ ] Set valid range
  - [ ] Invalid range rejected

### Transaction Form (react-hook-form)
- [ ] Full form with all fields:
  - [ ] Amount (AmountInput)
  - [ ] Type selector (buttons: expense/income/saving)
  - [ ] Category (CategorySelect, filtered by type)
  - [ ] Note (text input, 3–100 chars)
  - [ ] Date (date input)
  - [ ] Submit button
- [ ] Validation:
  - [ ] Amount: required, min 100, max 100M
  - [ ] Type: required
  - [ ] Category: required, must exist
  - [ ] Note: required, 3–100 chars
  - [ ] Date: required, not future
- [ ] Error handling:
  - [ ] Show error below each field
  - [ ] Highlight invalid fields
  - [ ] Disable submit until valid
- [ ] Test:
  - [ ] Submit with all fields → success
  - [ ] Submit with invalid data → error per field
  - [ ] Type changes → category options update

### Verification
- [ ] All form validations work
- [ ] Errors display correctly
- [ ] Form resets on success
- [ ] Mobile layout on 375px is usable

---

## Phase 7: Pages — Analytics (3 hours)

### Pengeluaran (Spending)
- [ ] `pages/Pengeluaran.tsx`:
  - [ ] Category filter buttons (All + each category)
  - [ ] Category cards showing total, transaction count, percentage
  - [ ] Transaction list filtered by selected category
  - [ ] Link to add transaction
- [ ] Data:
  - [ ] useTransactions() fetches data
  - [ ] Compute categoryAggregates for cards
  - [ ] Filter transactions by category
- [ ] Test:
  - [ ] Click category → filter transactions
  - [ ] Cards show correct totals
  - [ ] All categories show all transactions

### Tren (Trends)
- [ ] `pages/Tren.tsx`:
  - [ ] 3-month line chart (income, expense, savings)
  - [ ] Summary stats (avg monthly, highest, trend)
  - [ ] Top categories table
  - [ ] Month/year selector for range
- [ ] Chart:
  - [ ] X-axis: months (last 3)
  - [ ] Y-axis: amount in IDR
  - [ ] Three lines: income, expense, net
  - [ ] Tooltips on hover
- [ ] Test:
  - [ ] Chart displays with real data
  - [ ] Stats are mathematically correct
  - [ ] Change range → chart updates

### Verification
- [ ] Pages load without errors
- [ ] Data displays correctly
- [ ] Filtering/selection works
- [ ] Charts are responsive

---

## Phase 8: Pages — Budget & Goals (3 hours)

### Budget Page
- [ ] `pages/Budget.tsx`:
  - [ ] Add Budget button → modal with category select + amount input
  - [ ] BudgetCard for each active budget
  - [ ] Progress bar showing spent/total
  - [ ] Over-budget warning (red)
  - [ ] Edit/delete budget (optional)
- [ ] Data:
  - [ ] useBudgets() fetches for month
  - [ ] Compute BudgetWithProgress
  - [ ] upsertBudget() on submit
- [ ] Test:
  - [ ] Add budget → appears in list
  - [ ] Progress bar reflects actual spending
  - [ ] Over-budget shows warning

### Goals Page
- [ ] `pages/Goals.tsx`:
  - [ ] Add Goal button → modal with name, target, deadline
  - [ ] GoalCard for each goal
  - [ ] Progress bar and percentage
  - [ ] Days remaining until deadline
  - [ ] Edit/delete goal (optional)
- [ ] Data:
  - [ ] useGoals() fetches goals
  - [ ] Compute GoalWithProgress
  - [ ] addGoal() on submit
- [ ] Test:
  - [ ] Add goal → appears in list
  - [ ] Progress reflects savings transactions tagged to goal
  - [ ] Deadline timer accurate

### Verification
- [ ] Budget page functional
- [ ] Goals page functional
- [ ] All CRUD operations work
- [ ] Progress calculations are correct

---

## Phase 9: Pages — AI Chat (4 hours)

### AI Chat Page
- [ ] `pages/AiChat.tsx`:
  - [ ] Message list (scrollable, latest at bottom)
  - [ ] Message bubbles (user right, assistant left)
  - [ ] Typing indicator while Claude processes
  - [ ] Text input + send button
  - [ ] Image upload button
  - [ ] Suggested action buttons (Parse Receipt, Categorize, Show Budget)
  - [ ] Clear conversation button
- [ ] Data:
  - [ ] Chat history stored in component state (session)
  - [ ] Call parse-image.js API for image parsing
  - [ ] Call Claude API for conversational responses
- [ ] Interactions:
  - [ ] Type message → send
  - [ ] Upload image → call parse-image, show result
  - [ ] Click suggestion → populate input + send
  - [ ] Auto-scroll to latest message
- [ ] Test:
  - [ ] Send text message → response appears
  - [ ] Upload receipt image → parsed result
  - [ ] Typing indicator shows during processing
  - [ ] Scrolling works smoothly

### Image Parser Hook
- [ ] `hooks/useImageParser.ts`:
  - [ ] Call `frontend/api/parse-image.js` endpoint
  - [ ] Base64 encode image
  - [ ] Parse Claude response JSON
  - [ ] Return parsed transaction data
  - [ ] Handle errors
- [ ] Test:
  - [ ] Valid image → parsed output
  - [ ] Invalid image → error message
  - [ ] Timeout → error handling

### Verification
- [ ] Chat page loads
- [ ] Messages send/receive
- [ ] Image parsing works
- [ ] No console errors

---

## Phase 10: Navigation & Routing (2 hours)

### Router Setup
- [ ] `app/App.tsx`:
  - [ ] BrowserRouter wraps Routes
  - [ ] Protected routes use ProtectedRoute wrapper
  - [ ] Unprotected routes (Login, AuthCallback) outside wrapper
  - [ ] Fallback route → /
- [ ] Protected routes:
  - [ ] / → Home (Layout wrapper)
  - [ ] /pengeluaran → Pengeluaran
  - [ ] /tren → Tren
  - [ ] /budget → Budget + Goals
  - [ ] /ai → AiChat
  - [ ] /settings → Settings
- [ ] Unprotected:
  - [ ] /login → Login
  - [ ] /auth/callback → AuthCallback
  - [ ] /link-telegram → LinkTelegram

### Bottom Navigation
- [ ] `components/Layout.tsx` → BottomNav component
  - [ ] 5 tabs: Home, Pengeluaran, Tren, Anggaran, AI
  - [ ] Tab icons (emoji)
  - [ ] Active tab highlight
  - [ ] onClick → navigate to route
  - [ ] Safe area padding for notch
- [ ] Test:
  - [ ] Click tab → route changes
  - [ ] Active tab visually highlighted
  - [ ] Tab persists on page reload

### Providers & Context
- [ ] Wrap App with:
  - [ ] AuthProvider (if using context)
  - [ ] MonthFilterProvider
  - [ ] Sonner Toaster for notifications
- [ ] Test:
  - [ ] All contexts accessible from any page
  - [ ] No render errors

### Verification
- [ ] Navigation works end-to-end
- [ ] Protected routes guard against unauthenticated access
- [ ] Bottom nav visible on all pages
- [ ] Routing doesn't cause full page reloads

---

## Phase 11: Styling & Polish (3 hours)

### Responsive Design
- [ ] Test at breakpoints:
  - [ ] 375px (mobile baseline)
  - [ ] 480px (large mobile)
  - [ ] 600px (tablet)
  - [ ] 1024px (desktop)
- [ ] Check:
  - [ ] No horizontal scrolling
  - [ ] Touch targets ≥44px
  - [ ] Text readable without zooming
  - [ ] Bottom nav visible, clickable

### Dark Mode (Optional)
- [ ] Add `@media (prefers-color-scheme: dark)` to theme.css
- [ ] Test with DevTools forced dark mode
- [ ] Ensure colors meet WCAG AA contrast

### Animations
- [ ] Page transitions smooth
- [ ] Modal slide-up not janky
- [ ] Loading spinner visible
- [ ] No layout shift on element changes

### Typography
- [ ] Font files load (check DevTools > Network)
- [ ] DM Mono applies to amounts
- [ ] Heading scales correct
- [ ] Line heights match design

### Verification
- [ ] Run on real mobile device (or emulator)
- [ ] No console errors or warnings
- [ ] All text readable
- [ ] Colors match design tokens

---

## Phase 12: Testing & QA (4 hours)

### Unit Tests (Optional but Recommended)
- [ ] Test hooks in isolation:
  - [ ] useAuth login/logout flow
  - [ ] useTransactions add/delete
  - [ ] Aggregate computations
- [ ] Use Vitest + React Testing Library
- [ ] Aim for 60%+ coverage on critical paths

### Integration Tests
- [ ] Full user flow: login → add transaction → view on home
- [ ] Transaction appears in history after 1s (real-time)
- [ ] Budget page shows correct calculations
- [ ] Analytics charts display

### Manual QA Checklist

**Auth Flow:**
- [ ] Telegram ID login succeeds with valid ID
- [ ] Telegram ID login fails with invalid ID (shows error)
- [ ] Google OAuth redirects and creates session
- [ ] LinkTelegram associates Google with Telegram
- [ ] Logout clears session and redirects to /login
- [ ] Refresh page → session restored

**Data Entry:**
- [ ] Add transaction modal opens/closes
- [ ] Form validates all fields
- [ ] Category select filters by type
- [ ] Amount formatting works
- [ ] Submit adds transaction to list
- [ ] Transaction appears in history immediately

**Analytics:**
- [ ] Home dashboard shows correct totals
- [ ] Charts display data
- [ ] Change month → data updates
- [ ] Pengeluaran filter works
- [ ] Tren shows 3-month trend
- [ ] Budget progress bars correct
- [ ] Goals show countdown

**AI Chat:**
- [ ] Send message → response appears
- [ ] Upload receipt → parsed result shows
- [ ] Suggested actions work
- [ ] No API errors

**Mobile & Responsive:**
- [ ] 375px screen: no scrolling issues
- [ ] Bottom nav visible and clickable
- [ ] Safe area respected (notch)
- [ ] Touch targets ≥44px
- [ ] Text readable

**Performance:**
- [ ] Initial load < 3s
- [ ] Page transitions smooth
- [ ] No janky animations
- [ ] Network tab: <20 requests, <500KB initial

**Accessibility:**
- [ ] Tab navigation works
- [ ] Color contrast ≥4.5:1 (AA)
- [ ] Form labels associated with inputs
- [ ] Error messages clear

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Safari iOS 15+
- [ ] Firefox (latest)

### Deployment Checklist
- [ ] No hardcoded secrets
- [ ] Environment variables set in Vercel
- [ ] Build passes: `npm run build`
- [ ] Preview build works: `npm run preview`
- [ ] No console errors in production
- [ ] Lighthouse score ≥80

### Verification
- [ ] All manual tests pass
- [ ] Zero console errors/warnings
- [ ] Performance acceptable
- [ ] Ready for user testing

---

## Final Verification Checklist

Before declaring "complete":

### Code Quality
- [ ] TypeScript: `npm run type-check` passes (no `any`)
- [ ] No console.error or console.warn
- [ ] Imports organized (React → libs → hooks → components)
- [ ] Components use `cn()` for class merging
- [ ] No hardcoded colors or spacing

### Feature Completeness
- [ ] All 6 pages implemented
- [ ] All 5 navigation tabs work
- [ ] All CRUD operations functional
- [ ] Real-time updates working
- [ ] Auth flows (Telegram + Google + linking)
- [ ] Image parsing integration
- [ ] Responsive on mobile

### Design Compliance
- [ ] Colors match `theme.css` tokens
- [ ] Typography matches spec (font families, sizes)
- [ ] Spacing uses 4px grid (8, 12, 16, 24, 32, 40, 48px)
- [ ] Border radius consistent (4, 8, 12, 16, 20, 24px)
- [ ] Shadows match design tokens
- [ ] Icons and emoji used consistently

### Testing
- [ ] Telegram login tested
- [ ] Google OAuth flow tested
- [ ] Add/edit/delete transactions tested
- [ ] Charts display with real data
- [ ] Budget/goals calculations verified
- [ ] Image parsing tested
- [ ] Mobile layout tested on real device

### Documentation
- [ ] README.md with setup instructions
- [ ] Environment variables template (.env.example)
- [ ] Component storybook (optional)
- [ ] Deployment guide for Vercel

---

## Success Metrics

**Frontend is production-ready when:**

1. ✅ Zero console errors or warnings
2. ✅ All pages load in <2s on 4G
3. ✅ Lighthouse score ≥80
4. ✅ All manual QA tests pass
5. ✅ Mobile layout responsive 320–1024px
6. ✅ Auth flows 100% functional
7. ✅ Real-time updates confirmed
8. ✅ Image parsing integration works
9. ✅ Design tokens fully applied
10. ✅ Code review approved

---

## Troubleshooting Reference

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Tailwind classes not applying | CSS not linked | Check `main.tsx` imports `styles/globals.css` |
| Supabase queries fail | Wrong URL/key | Verify `.env` values match Supabase project |
| Images not uploading | API endpoint missing | Ensure `frontend/api/parse-image.js` exists on Vercel |
| Real-time updates not syncing | Subscriptions not active | Check `useTransactionsRealtime` in browser console |
| Modal animatio janky | Motion not installed | Verify `npm list motion` shows it |
| Fonts loading late | Font-face not loading | Check DevTools > Network for font files |
| Auth state lost on reload | localStorage key wrong | Verify `localStorage.setItem('gajian_aman_user', ...)` |

---

## Timeline Estimate

| Phase | Hours | Cumulative |
|-------|-------|-----------|
| 1. Project Setup | 2 | 2 |
| 2. Core Library | 3 | 5 |
| 3. State Management | 4 | 9 |
| 4. Auth Pages | 3 | 12 |
| 5. Dashboard | 4 | 16 |
| 6. Forms & Validation | 3 | 19 |
| 7. Analytics Pages | 3 | 22 |
| 8. Budget & Goals | 3 | 25 |
| 9. AI Chat | 4 | 29 |
| 10. Routing | 2 | 31 |
| 11. Styling & Polish | 3 | 34 |
| 12. Testing & QA | 4 | 38 |
| **Buffer (15%)** | **6** | **44** |

**Total: 40–50 engineering hours for one frontend engineer**

Working 8 hours/day = 5–6 days of focused development.

