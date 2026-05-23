# Phase 4 Runtime Parameters — The Gajian USP

**Phase:** 04  
**Status:** 🔄 IN PROGRESS — Batch 1 pending Sonnet re-execution  
**Batches:** 3  
**Critical Path:** Batch 1 → Batch 2 → Batch 3 (sequential, no parallelization)  
**Executor Model:** claude-sonnet-4-6 (all batches)  

---

## 1. Execution Constraints

### Anti-Bloat Model
- **Batch 1:** Max 2 files (Gajian.tsx NEW, GajianWizard.tsx NEW)
- **Batch 2:** Max 3 files (generate-budget.js NEW, useBudgetRecommendation.ts NEW, GajianWizard.tsx modified)
- **Batch 3:** Max 4 files (BudgetConfirmation.tsx NEW, useBudgets.ts modified, App.tsx — 4 routes)
- **Hard limit:** 5 files per batch in emergency (escalate to Architect first)

### Build Quality Gates
- ✅ `npm run build` must pass before commit (zero errors)
- ✅ No TypeScript errors in modified files
- ✅ No accessibility regressions (WCAG AAA from Phase 2 maintained)
- ✅ No console errors in browser DevTools

### Session Discipline
- **1 session = 1 batch maximum**
- **Executor model: claude-sonnet-4-6** (NOT Haiku — upgraded for code quality)
- After batch complete: Create recap, commit, stop, await Architect approval
- Do NOT start next batch in same session

---

## 2. DUAL-SESSION PROTOCOL

### How phases work
Each batch requires exactly 2 Claude Code sessions:
- **Session A — Architect (this session type):** Reviews previous batch, generates Executor prompt
- **Session B — Executor:** Implements the batch, submits recap for review

Sessions must NOT overlap. Executor never starts without Architect approval.

### Architect Session Responsibilities
1. Read: `feature-update/major-update_5/master-development-roadmap.md`
2. Read: `feature-update/major-update_5/staging/phase-04-gajian-usp.md`
3. Read: `feature-update/major-update_5/runtime/runtime-phase-04.md` (this file)
4. Read: latest recap from `aether/session-recaps/`
5. Verify previous batch build still passes: `npm run build`
6. Review Executor's submitted files against batch spec
7. Check all quality gates (TypeScript, a11y, mobile, build)
8. Generate precise Executor prompt for next batch
9. Approve or request changes — do NOT implement

### Executor Session Responsibilities
1. Read: Architect's batch prompt (provided at session start)
2. Read: `staging/phase-04-gajian-usp.md` → current batch section only
3. Read: `runtime/runtime-phase-04.md` → sections 3–12
4. Read: latest recap from `aether/session-recaps/`
5. Implement ONLY the files listed in the batch spec
6. Run `npm run build` before every commit
7. Create recap in `aether/session-recaps/YYYY-MM-DD-Phase04-Batch0X.md`
8. Commit with conventional format
9. STOP — do not proceed to next batch

### Architect Session Starter Prompt
```
ARCHITECT SESSION — Project AETHER v5, Phase 04

Role: Principal Architect & Prompt Engineer
Authority: Review Batch [X] submission and generate Batch [X+1] prompt

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/master-development-roadmap.md
2. feature-update/major-update_5/staging/phase-04-gajian-usp.md
3. feature-update/major-update_5/runtime/runtime-phase-04.md
4. aether/session-recaps/ → latest recap

STANDING BY for Executor's Phase 04, Batch [X] submission.
```

### Executor Session Starter Prompt — Batch 1
```
EXECUTOR SESSION — Project AETHER v5, Phase 04, Batch 1
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-04-gajian-usp.md → Batch 1 section
2. feature-update/major-update_5/runtime/runtime-phase-04.md
3. aether/session-recaps/2026-05-23-Phase03-Batch03.md (last Phase 3 recap)

TASK: Build the Gajian Wizard UI (3-step onboarding form)

FILES TO CREATE (max 2):
- frontend/src/app/pages/Gajian.tsx (NEW)
- frontend/src/app/components/GajianWizard.tsx (NEW)

KEY REQUIREMENTS:
- Step 1: Salary amount (Rupiah) + salary date (1-28)
- Step 2: Fixed expenses (add/remove entries, category + amount + description)
- Step 3: Risk profile radio (Conservative / Moderate / Aggressive)
- Progress bar: animated, shows "Langkah X dari 3"
- Navigation: Previous (disabled Step 1), Next (disabled until step valid), "Hasilkan Anggaran" on Step 3
- Types defined in GajianWizard.tsx: GajianInput, FixedExpense, GajianWizardProps
- All animations respect prefers-reduced-motion
- All colors via CSS variables (no hardcoded hex)
- Mobile responsive 375px+

QUALITY GATES:
- npm run build (zero errors)
- TypeScript strict, no errors in new files
- WCAG AAA maintained (semantic HTML, proper labels, prefers-reduced-motion)
- Mobile responsive 375px+
- Exactly 2 files created, no other files touched
- No route wiring (App.tsx untouched — deferred to Batch 3)

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase04-Batch01.md
- Commit: feat(gajian): build wizard ui with step navigation and form validation
- STOP and await Architect approval before Batch 2
```

### Executor Session Starter Prompt — Batch 2
```
EXECUTOR SESSION — Project AETHER v5, Phase 04, Batch 2
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-04-gajian-usp.md → Batch 2 section
2. feature-update/major-update_5/runtime/runtime-phase-04.md
3. aether/session-recaps/ → latest recap (Phase 04 Batch 01)

TASK: Integrate Claude AI budget recommendation engine

CRITICAL NOTE: frontend/api/budget-recommendation.js ALREADY EXISTS with a different schema.
Do NOT modify it. Create frontend/api/generate-budget.js as a SEPARATE new file.

FILES TO CREATE/MODIFY (max 3):
- frontend/api/generate-budget.js (NEW)
- frontend/src/hooks/useBudgetRecommendation.ts (NEW)
- frontend/src/app/components/GajianWizard.tsx (MODIFIED — wire submit button)

AI MODEL FOR generate-budget.js: claude-sonnet-4-6

QUALITY GATES:
- npm run build (zero errors)
- TypeScript strict, no errors
- Claude API returns valid BudgetRecommendation JSON
- Loading state shows during generation
- Fallback budget shown if API fails
- Max 3 files modified

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase04-Batch02.md
- Commit: feat(gajian): integrate claude sonnet budget recommendation engine
- STOP and await Architect approval before Batch 3
```

### Executor Session Starter Prompt — Batch 3
```
EXECUTOR SESSION — Project AETHER v5, Phase 04, Batch 3
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-04-gajian-usp.md → Batch 3 section
2. feature-update/major-update_5/runtime/runtime-phase-04.md
3. aether/session-recaps/ → latest recap (Phase 04 Batch 02)

TASK: Build BudgetConfirmation, wire Supabase persistence, add ALL missing routes to App.tsx

FILES TO CREATE/MODIFY (max 4):
- frontend/src/app/components/BudgetConfirmation.tsx (NEW)
- frontend/src/hooks/useBudgets.ts (MODIFIED — add saveBudgets + setOnboarded)
- frontend/src/app/App.tsx (MODIFIED — wire 4 new routes)

App.tsx MUST add these 4 routes (inside protected Layout block):
- /gajian → Gajian (Phase 4)
- /gajian/confirm → BudgetConfirmation (Phase 4)
- /analytics/pola-waktu → PolaWaktu (Phase 3 carryover)
- /analytics/detail/:category → DetailKategori (Phase 3 carryover)

QUALITY GATES:
- npm run build (zero errors)
- Budget saves to Supabase budgets table correctly
- User.onboarded set to true after save
- All 4 routes accessible and rendering
- Max 4 files modified

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase04-Batch03.md
- Commit: feat(gajian): add budget confirmation, persistence, and route wiring
- STOP and await Architect approval → Phase 05 initiation
```

---

## 3. Tools & Environment

### Approved Tools
- ✅ `npm run build` — Build verification
- ✅ `npm run dev` — Local development server
- ✅ Chrome DevTools — Console, network tab (verify API calls)
- ✅ React DevTools — Component tree inspection
- ✅ Supabase dashboard — Verify budget inserts + onboarded flag
- ✅ Network tab — Verify `/api/generate-budget` POST payload and response

### Approved Libraries (Already Installed)
- ✅ `@radix-ui/*` — UI primitives (RadioGroup, Progress, etc.)
- ✅ `react-hook-form` — Forms (optional — can use controlled state)
- ✅ `@supabase/supabase-js` — Database client
- ✅ `motion` — Animations
- ✅ `lucide-react` — Icons
- ✅ `@anthropic-ai/sdk` — Anthropic SDK (via existing API files pattern)
- ✅ `sonner` — Toast notifications

---

## 4. Code Style & Patterns

### TypeScript
- **Strict mode required** — No `any` type, all props typed explicitly
- **Imports:** Use `@` alias (`@/hooks`, `@/components`, `@/lib/supabase`)
- **Type definitions:** Define in the file that owns them, export if shared

### React Patterns
- **Hooks:** Use `useBudgets`, `useTransactions`, `useAuth` (existing)
- **Components:** Keep under 300 lines — split if larger
- **State:** `useState` for local state, hooks for shared state
- **Async:** Try-catch around all API and Supabase calls
- **Navigation:** Use `useNavigate()` from `react-router` for redirects

### Tailwind CSS
- ✅ Theme tokens via utility functions: `bgColorVar()`, `textColorVar()`, `borderColorVar()`
- ❌ No hardcoded colors
- ❌ No custom CSS additions

### Error Handling
- ✅ Try-catch around all async calls
- ✅ User-facing error messages via `toast.error()`
- ✅ Graceful degradation: fallback budget if AI API fails
- ❌ Silent error swallowing

---

## 5. Wizard Form Patterns (Batch 1)

```typescript
const [step, setStep] = useState<1 | 2 | 3>(1);
const [formData, setFormData] = useState<GajianInput>({
  salaryAmount: 0,
  salaryDate: 1,
  fixedExpenses: [],
  riskProfile: 'moderate',
});

const canProceedStep1 = () => formData.salaryAmount > 0 && formData.salaryDate >= 1 && formData.salaryDate <= 28;
const canProceedStep2 = () => formData.fixedExpenses.length > 0 && formData.fixedExpenses.every(e => e.amount > 0 && e.category.trim() !== '');
const canProceedStep3 = () => !!formData.riskProfile;

const handleNext = () => {
  const canProceed = step === 1 ? canProceedStep1() : step === 2 ? canProceedStep2() : canProceedStep3();
  if (canProceed) setStep(prev => Math.min(prev + 1, 3) as 1 | 2 | 3);
};

const handlePrevious = () => setStep(prev => Math.max(prev - 1, 1) as 1 | 2 | 3);
```

---

## 6. API Integration (Batch 2)

### generate-budget.js Pattern

> ⚠️ **DO NOT MODIFY `budget-recommendation.js`** — different schema, different use case.
> Create `generate-budget.js` as a completely new file.

```javascript
// generate-budget.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { salaryAmount, salaryDate, fixedExpenses, riskProfile } = req.body;

  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const discretionary = salaryAmount - totalFixed;

  const prompt = `Buat rekomendasi anggaran bulanan untuk pengguna Indonesia:
- Penghasilan: Rp ${salaryAmount.toLocaleString('id-ID')}/bulan
- Gaji diterima tanggal: ${salaryDate}
- Pengeluaran tetap: ${JSON.stringify(fixedExpenses)} (total Rp ${totalFixed.toLocaleString('id-ID')})
- Dana tersisa: Rp ${discretionary.toLocaleString('id-ID')}
- Profil risiko: ${riskProfile}

Return ONLY valid JSON (no markdown):
{"budgetItems":[{"category":"Food & Dining","amount":800000,"confidence":0.9}],"totalRecommended":${discretionary},"savingsRate":0.2,"explanation":"..."}`;

  try {
    const { content } = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'Kamu financial advisor Indonesia. Return ONLY valid JSON, no markdown, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = content[0]?.text ?? '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response');

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('Budget generation error:', err);
    // Return fallback budget (never fail the user)
    return res.status(200).json({
      budgetItems: [
        { category: 'Food & Dining', amount: Math.round(discretionary * 0.35), confidence: 0.5 },
        { category: 'Transport', amount: Math.round(discretionary * 0.15), confidence: 0.5 },
        { category: 'Entertainment', amount: Math.round(discretionary * 0.10), confidence: 0.5 },
        { category: 'Savings', amount: Math.round(discretionary * 0.20), confidence: 0.5 },
      ],
      totalRecommended: discretionary,
      savingsRate: 0.2,
      explanation: 'Budget default. Sesuaikan dengan kondisi keuangan Anda.',
    });
  }
}
```

---

## 7. Database Mutations (Batch 3)

```typescript
// useBudgets.ts additions
const saveBudgets = async (items: BudgetItem[]) => {
  if (!user) throw new Error('Not authenticated');
  const inserts = items.map(item => ({
    user_id: user.userId,
    category: item.category,
    amount: item.amount,
    period: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  }));
  const { error } = await supabase
    .from('budgets')
    .upsert(inserts, { onConflict: 'user_id,category,month,year' });
  if (error) throw error;
};

const setOnboarded = async () => {
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('users')
    .update({ onboarded: true })
    .eq('user_id', user.userId);
  if (error) throw error;
};
```

---

## 8. Mobile Testing Checklist

### Batch 1
- [ ] Wizard steps render correctly on mobile (375px width)
- [ ] Form inputs are touch-friendly (min 44px touch target)
- [ ] Progress bar "Langkah X dari 3" visible
- [ ] Previous/Next buttons positioned correctly at bottom
- [ ] No horizontal scroll
- [ ] Text wraps properly on small screens

### Batch 2
- [ ] Loading spinner shows during budget generation
- [ ] Button disabled + spinner visible during API call
- [ ] Error toast shows if API fails (no crash)
- [ ] Navigation to /gajian/confirm works (even if page not yet wired)

### Batch 3
- [ ] BudgetConfirmation displays budget items readably on mobile
- [ ] Edit amounts: input accessible on mobile keyboard
- [ ] "Terapkan & Simpan" button clearly positioned
- [ ] Redirect to /home/overview on success
- [ ] All 4 new routes load on mobile

---

## 9. Performance Constraints

- **Budget generation:** < 3s typical, 5s max (AbortSignal.timeout)
- **Budget save to DB:** < 2s (Supabase upsert)
- **User onboarded update:** < 1s
- **Build time target:** < 45s (adding lazy imports)

---

## 10. Git & Commit Protocol

### Batch 1 Commit
```
feat(gajian): build wizard ui with step navigation and form validation

- Create Gajian.tsx landing page with hero section, benefits, CTA
- Create GajianWizard.tsx 3-step form (salary → expenses → risk profile)
- Implement step validation and state management
- Add motion animations with prefers-reduced-motion support
- Define GajianInput, FixedExpense TypeScript interfaces

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Batch 2 Commit
```
feat(gajian): integrate claude sonnet budget recommendation engine

- Create generate-budget.js Vercel serverless function (separate from budget-recommendation.js)
- Create useBudgetRecommendation.ts hook with loading/error state
- Wire Hasilkan Anggaran button in GajianWizard to call API
- Add loading spinner and fallback budget on API failure

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Batch 3 Commit
```
feat(gajian): add budget confirmation, persistence, and complete route wiring

- Create BudgetConfirmation.tsx with editable budget items and save action
- Add saveBudgets() and setOnboarded() to useBudgets hook
- Wire 4 routes in App.tsx: /gajian, /gajian/confirm, /analytics/pola-waktu, /analytics/detail/:category
- Budget saves to Supabase budgets table (upsert)
- User.onboarded set to true on accept

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 11. Rollback Triggers (STOP IMMEDIATELY)

- ❌ `npm run build` fails (any error)
- ❌ TypeScript errors in modified files
- ❌ WCAG AAA regression (accessibility broken)
- ❌ Budget save mutations don't persist to Supabase
- ❌ Console errors on wizard pages
- ❌ More than allowed files modified per batch
- ❌ `budget-recommendation.js` accidentally modified

---

## 12. Timeline & Scheduling

| Batch | Est. Duration | Model | Blocker? |
|-------|---|---|---|
| Batch 1 | 1 session (~2 hrs) | claude-sonnet-4-6 | No |
| Batch 2 | 1 session (~2 hrs) | claude-sonnet-4-6 | Yes (Claude API) |
| Batch 3 | 1 session (~2 hrs) | claude-sonnet-4-6 | No (Supabase) |

**Critical path:** Batch 1 → Batch 2 → Batch 3 → Architect approval → Phase 5.

---

## Approval Gate

✋ **RUNTIME PARAMETERS LOCKED**

Executor must read this before starting each batch.  
Architect generates batch-specific prompts (Section 2 above) for each Executor session.
