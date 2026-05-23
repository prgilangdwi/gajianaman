# Phase 4 Execution Plan — The "Gajian" USP (Core Feature)

**Status:** 🔄 IN PROGRESS — Batch 1 pending re-execution with Sonnet  
**Priority:** Critical (flagship feature)  
**Date Created:** 2026-05-23  
**Architect:** AETHER v5 Principal Architect  
**Executor Model:** claude-sonnet-4-6 (upgraded from Haiku)  

---

## 1. Phase Goal

Build the flagship **"Gajian" USP** — an intelligent onboarding wizard that collects user financial
profile data and generates an AI-recommended budget tailored to their risk profile and spending
patterns. This differentiates Gajian Aman from other Indonesian finance trackers.

**Success Criteria:**
- ✅ Gajian wizard UI complete (3-step: Salary Date → Fixed Expenses → Risk Profile)
- ✅ AI recommendation engine generates budget JSON from wizard inputs
- ✅ Budget recommendations persist to Supabase
- ✅ User can apply or customize recommended budget
- ✅ All missing routes wired in App.tsx (Gajian + PolaWaktu + DetailKategori carryovers)
- ✅ Build passes with zero errors

---

## 2. Batch Breakdown

### Batch 1 — Gajian Wizard UI & Flow
**Anti-Bloat Limit:** 2 files  
**Status:** 🔄 PENDING — reverted Haiku implementation, awaiting Sonnet re-execution  
**Executor Model:** claude-sonnet-4-6

**Task List:**

1. **Gajian.tsx (NEW)** — Landing page for the Gajian feature:
   - Route: `/gajian` (protected, RequireAuth + ErrorBoundary — wired in Batch 3)
   - Hero section with animated icon and value proposition
   - 3 benefit cards (Analisis Cepat, Personal, Optimal) with staggered animations
   - CTA button ("Mulai Wizard") → renders GajianWizard inline (showWizard state)
   - Info section: what data is needed (4 items)
   - All animations respect `prefers-reduced-motion`
   - Uses existing theme tokens (no hardcoded colors)

2. **GajianWizard.tsx (NEW)** — Multi-step form component:
   - **State:** `useState<1 | 2 | 3>(1)` for step, `useState<GajianInput>({...})` for formData
   - **Progress:** animated progress bar + "Langkah X dari 3" indicator
   - **Step 1 — Salary Details:**
     - Input: Monthly salary amount (Rupiah), salary date (1–28)
     - Display formatted Rupiah as user types
     - Validation: `salaryAmount > 0 && salaryDate >= 1 && salaryDate <= 28`
   - **Step 2 — Fixed Expenses:**
     - Add/remove expense entries dynamically
     - Fields per entry: category (text), amount (Rupiah), description (optional)
     - Validation: at least 1 entry, all amounts > 0, all categories filled
     - Shows total fixed expenses when valid
   - **Step 3 — Risk Profile:**
     - Radio selection: Conservative / Moderate / Aggressive
     - Each option shows label + description of implications
   - **Navigation:** Previous (disabled on Step 1), Next (disabled until step valid),
     "Hasilkan Anggaran" on Step 3 (placeholder for Batch 2 API call)
   - **useCallback** for all handlers to prevent re-renders

**TypeScript Types (define in GajianWizard.tsx):**
```typescript
interface GajianInput {
  salaryAmount: number;
  salaryDate: number; // 1-28
  fixedExpenses: FixedExpense[];
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

interface FixedExpense {
  category: string;
  amount: number;
  description?: string;
}

interface GajianWizardProps {
  onBack: () => void;
}
```

**Validation helpers:**
```typescript
const canProceedStep1 = () => formData.salaryAmount > 0 && formData.salaryDate >= 1 && formData.salaryDate <= 28;
const canProceedStep2 = () => formData.fixedExpenses.length > 0 && formData.fixedExpenses.every(e => e.amount > 0 && e.category.trim() !== '');
const canProceedStep3 = () => !!formData.riskProfile;
```

**Success Criteria:**
- ✅ All 3 steps render correctly
- ✅ Form validation works (can't proceed without data)
- ✅ formData updates as user inputs
- ✅ Navigation buttons work (previous/next/submit)
- ✅ Mobile responsive (375px+)
- ✅ Motion animations present and accessible
- ✅ Build passes

---

### Batch 2 — AI Budget Recommendation Engine
**Anti-Bloat Limit:** 3 files  
**Status:** 🔲 NOT STARTED

> ⚠️ **IMPORTANT:** `frontend/api/budget-recommendation.js` already exists with a **different
> interface** (uses `risk_profile`, `monthly_income`, `answers` and returns percentage-based
> categories). Do NOT modify it. Create `generate-budget.js` as a **NEW, separate file**.

**Files Modified:**
- `frontend/api/generate-budget.js` (NEW) — Vercel serverless function
- `frontend/src/hooks/useBudgetRecommendation.ts` (NEW) — React hook
- `frontend/src/app/components/GajianWizard.tsx` (MODIFIED — wire submit)

**Task List:**

1. **generate-budget.js (NEW):**
   - Endpoint: `POST /api/generate-budget`
   - Input payload:
     ```json
     {
       "salaryAmount": 5000000,
       "salaryDate": 15,
       "fixedExpenses": [
         { "category": "Sewa", "amount": 1500000 },
         { "category": "Listrik & Air", "amount": 300000 }
       ],
       "riskProfile": "moderate"
     }
     ```
   - Processing: build context string → call Claude (`claude-sonnet-4-6`) → parse JSON response
   - System prompt: `"Kamu adalah financial advisor Indonesia. Return ONLY valid JSON, no markdown."`
   - User prompt: structured budget request with salary, fixed expenses, risk profile
   - Output:
     ```json
     {
       "budgetItems": [
         { "category": "Food & Dining", "amount": 800000, "confidence": 0.9 },
         { "category": "Transport", "amount": 400000, "confidence": 0.85 }
       ],
       "totalRecommended": 4000000,
       "savingsRate": 0.2,
       "explanation": "Berdasarkan penghasilan dan pengeluaran tetap Anda..."
     }
     ```
   - Error handling: network error / API error / timeout (>5s) / invalid JSON → return fallback budget
   - Fallback budget:
     ```json
     {
       "budgetItems": [
         { "category": "Food & Dining", "amount": 800000, "confidence": 0.5 },
         { "category": "Transport", "amount": 400000, "confidence": 0.5 },
         { "category": "Entertainment", "amount": 300000, "confidence": 0.5 }
       ],
       "totalRecommended": 1500000,
       "savingsRate": 0.3,
       "explanation": "Budget default. Sesuaikan dengan kondisi keuangan Anda."
     }
     ```

2. **useBudgetRecommendation.ts (NEW):**
   ```typescript
   export function useBudgetRecommendation() {
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null);

     const generateBudget = async (input: GajianInput): Promise<BudgetRecommendation> => { ... };
     return { isLoading, error, recommendation, generateBudget };
   }
   ```
   - Calls `POST /api/generate-budget` with 5s timeout (AbortController)
   - Sets `isLoading` true during call
   - On success: sets `recommendation`, returns it
   - On error: logs, returns fallback budget

3. **GajianWizard.tsx (MODIFIED):**
   - Import `useBudgetRecommendation`
   - Step 3 "Hasilkan Anggaran" button: on click → call `generateBudget(formData)`
   - Show loading spinner during generation (disable button)
   - On success: navigate to `/gajian/confirm` via `useNavigate`, pass recommendation via state
   - On error: show error toast with "Coba Lagi" retry button

**TypeScript Types (add to useBudgetRecommendation.ts):**
```typescript
interface BudgetItem {
  category: string;
  amount: number;
  confidence: number; // 0-1
}

interface BudgetRecommendation {
  budgetItems: BudgetItem[];
  totalRecommended: number;
  savingsRate: number;
  explanation: string;
}
```

**Success Criteria:**
- ✅ `generate-budget.js` receives GajianInput and calls Claude
- ✅ Budget JSON generated with correct schema
- ✅ `useBudgetRecommendation` hook calls API and manages state
- ✅ Wizard shows loading spinner during generation
- ✅ Navigation to `/gajian/confirm` with recommendation state
- ✅ Error toast with retry on failure
- ✅ Build passes

---

### Batch 3 — Budget Confirmation, Persistence & Route Wiring
**Anti-Bloat Limit:** 4 files (3 Gajian files + App.tsx)  
**Status:** 🔲 NOT STARTED

> ⚠️ **CRITICAL CARRYOVER FROM PHASE 3:** Wire PolaWaktu and DetailKategori routes HERE.

**Files Modified:**
- `frontend/src/app/components/BudgetConfirmation.tsx` (NEW)
- `frontend/src/hooks/useBudgets.ts` (MODIFIED — add save mutation)
- `frontend/src/app/App.tsx` (MODIFIED — wire ALL missing routes)

**Task List:**

1. **BudgetConfirmation.tsx (NEW):**
   - Receives `BudgetRecommendation` via `useLocation().state`
   - Displays: total salary, fixed expenses, discretionary budget, savings rate
   - Budget items in card format: category emoji + name + recommended amount
   - **Edit mode:** user can adjust individual category amounts inline
   - **Action buttons:**
     - "Terapkan & Simpan" → save to Supabase + mark onboarded + redirect to `/home/overview`
     - "Ubah Sendiri" → inline edit mode toggle
     - "Lewati" → redirect to `/spend/budget` for manual entry
   - Shows savings rate visual ("Target tabungan: 20%")
   - Error handling: toast on save failure with retry

2. **useBudgets.ts (MODIFIED):**
   - Add `saveBudgets(items: BudgetItem[])` async function:
     ```typescript
     const inserts = items.map(item => ({
       user_id: user.userId,
       category: item.category,
       amount: item.amount,
       period: 'monthly',
       month: new Date().getMonth() + 1,
       year: new Date().getFullYear(),
     }));
     await supabase.from('budgets').upsert(inserts, { onConflict: 'user_id,category,month,year' });
     ```
   - Add `setOnboarded()` function:
     ```typescript
     await supabase.from('users').update({ onboarded: true }).eq('user_id', user.userId);
     ```

3. **App.tsx (MODIFIED — ALL missing routes):**
   ```typescript
   // Gajian routes (Phase 4)
   const Gajian = lazy(() => import('./pages/Gajian'));
   const BudgetConfirmation = lazy(() => import('./components/BudgetConfirmation'));

   // Phase 3 carryovers
   const PolaWaktu = lazy(() => import('./pages/PolaWaktu'));
   const DetailKategori = lazy(() => import('./pages/DetailKategori'));
   ```
   Routes to add (inside protected Layout block):
   - `/gajian` → Gajian
   - `/gajian/confirm` → BudgetConfirmation
   - `/analytics/pola-waktu` → PolaWaktu
   - `/analytics/detail/:category` → DetailKategori

**Success Criteria:**
- ✅ BudgetConfirmation displays recommendation clearly
- ✅ User can edit amounts before saving
- ✅ Budget saves to Supabase (budgets table)
- ✅ User marked onboarded (users table)
- ✅ Redirect to Overview on success
- ✅ All 4 new routes accessible (Gajian, BudgetConfirmation, PolaWaktu, DetailKategori)
- ✅ Error handling graceful
- ✅ Build passes

---

## 3. Touch List

### ✅ CAN MODIFY
- `frontend/src/app/pages/Gajian.tsx` (NEW)
- `frontend/src/app/components/GajianWizard.tsx` (NEW → modified in Batch 2)
- `frontend/api/generate-budget.js` (NEW)
- `frontend/src/hooks/useBudgetRecommendation.ts` (NEW)
- `frontend/src/app/components/BudgetConfirmation.tsx` (NEW)
- `frontend/src/app/App.tsx` (routes only)
- `frontend/src/hooks/useBudgets.ts` (add save/onboarded mutations only)

### ❌ CANNOT MODIFY
- `frontend/api/budget-recommendation.js` — existing endpoint, different schema, do NOT touch
- `frontend/src/styles/theme.css` — locked (Phase 2)
- `frontend/src/hooks/useDarkMode.ts` — locked (Phase 2)
- `frontend/src/app/pages/Settings.tsx` — locked (Phase 2)
- All Phase 3 pages (Riwayat, Overview, Tren, PolaWaktu, DetailKategori, etc.)
- Database schema (no migrations)

---

## 4. Dependencies & Prerequisites

### Batch 1
- ✅ Phase 3 complete (all pages, routing structure understood)
- ✅ Theme tokens available (theme.css from Phase 2)
- ✅ shadcn/ui components: Button, Input, Card, RadioGroup, Progress
- ✅ motion animations available
- ✅ formatRupiah() utility in utils.ts

### Batch 2
- ✅ Batch 1 complete (GajianWizard has submit button placeholder)
- ✅ Anthropic SDK available (pattern: follow ask-assistant.js)
- ✅ `ANTHROPIC_API_KEY` in Vercel env vars

### Batch 3
- ✅ Batch 2 complete (generate-budget.js works, recommendation JSON confirmed)
- ✅ `useBudgets` hook available
- ✅ Supabase client configured
- ✅ `users` table has `onboarded` boolean column

---

## 5. Rollback Procedures

### If Batch 1 fails:
- Revert Gajian.tsx and GajianWizard.tsx
- Check TypeScript types, fix validation logic

### If Batch 2 fails:
- Verify `/api/generate-budget` receives payload (check network tab)
- Check `ANTHROPIC_API_KEY` is set in Vercel env
- If API fails consistently, implement fallback budget only (static template)

### If Batch 3 fails:
- Verify `budgets` table schema matches insert fields
- Check if `users.onboarded` column exists (may need migration if missing)
- Test redirect to Overview separately

---

## 6. Quality Gates

**Per Batch:**
- ✅ `npm run build` must pass (zero errors)
- ✅ No TypeScript errors in modified files
- ✅ No accessibility regressions (WCAG AAA maintained)
- ✅ No console errors on wizard pages

**Final (Phase 4):**
- ✅ Full wizard flow: input → generate → confirm → save
- ✅ Budget saves to Supabase correctly
- ✅ User marked onboarded
- ✅ All 4 new routes accessible from App.tsx
- ✅ Build passes
- ✅ Mobile tested (375px)

---

## 7. Known Issues / Carryovers → Phase 5

- `useGajianSetupStatus` hook exists — verify it reads the `onboarded` flag set in Batch 3
- Phase 5 will expand AI insights to Forecasting.tsx

---

## 8. Success Metrics

| Metric | Target | Batch |
|--------|--------|-------|
| Wizard steps render | 3/3 | 1 |
| Form validation works | 100% | 1 |
| Budget generation | < 3s | 2 |
| Recommendation JSON | Correct schema | 2 |
| Budget save to DB | Success rate 100% | 3 |
| User onboarded status | Set correctly | 3 |
| Routes wired | 4 new routes | 3 |
| Build errors | 0 | All |

---

## Approval Gate

✋ **PHASE 4 IN PROGRESS**

Batch 1 pending Executor (claude-sonnet-4-6) re-execution.  
Batch 2 and 3 await sequential Architect approval.
