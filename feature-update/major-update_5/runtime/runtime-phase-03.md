# Phase 3 Runtime Parameters — UX Humanization, Mobile UI & Polish

**Phase:** 03  
**Status:** ✅ COMPLETE  
**Batches:** 3  
**Critical Path:** Batch 1 → Batch 2 → Batch 3 (sequential)  
**Commits:** `3d377ea` (Batch 1), `6fd178d` (Batch 2), `8903391` (Batch 3)  
**Model Used:** claude-haiku-4-5-20251001  

---

## 1. Execution Constraints

### Anti-Bloat Model
- **Batch 1:** Max 4 files (Riwayat, TransactionModal, ExpandableTransactionRow, Login)
- **Batch 2:** Max 3 files (Overview, Tren, ChartInsight NEW)
- **Batch 3:** Max 2 files (PolaWaktu NEW, DetailKategori NEW)
- **Hard limit:** 5 files per batch in emergency (escalate to Architect first)

### Build Quality Gates
- ✅ `npm run build` must pass before commit (zero errors)
- ✅ No TypeScript errors in modified files
- ✅ No accessibility regressions (WCAG AAA from Phase 2 maintained)
- ✅ No console errors in browser DevTools

### Session Discipline
- **1 session = 1 batch maximum**
- After batch complete: Create recap, commit, stop, await Architect approval
- Do NOT start next batch in same session

---

## 2. DUAL-SESSION PROTOCOL

### How phases work
Each batch requires exactly 2 Claude Code sessions:
- **Session A — Architect:** Reviews previous batch, approves, generates Executor prompt
- **Session B — Executor:** Reads Architect prompt, implements batch, submits recap

Sessions must NOT overlap. Executor never starts without Architect approval.

### Architect Session Responsibilities
1. Read: `feature-update/major-update_5/master-development-roadmap.md`
2. Read: `feature-update/major-update_5/staging/phase-03-ux-humanization.md`
3. Read: `feature-update/major-update_5/runtime/runtime-phase-03.md` (this file)
4. Read: latest recap from `aether/session-recaps/`
5. Verify previous batch build still passes: `npm run build`
6. Review Executor's submitted files against batch spec
7. Check all quality gates (TypeScript, a11y, mobile, build)
8. Generate precise Executor prompt for next batch
9. Approve or request changes — do NOT implement

### Executor Session Responsibilities
1. Read: Architect's batch prompt (provided at session start)
2. Read: `staging/phase-03-ux-humanization.md` → current batch section only
3. Read: `runtime/runtime-phase-03.md` → sections 3–11
4. Read: latest recap from `aether/session-recaps/`
5. Implement ONLY the files listed in the batch spec
6. Run `npm run build` before every commit
7. Create recap in `aether/session-recaps/YYYY-MM-DD-Phase03-Batch0X.md`
8. Commit with conventional format
9. STOP — do not proceed to next batch

### Architect Session Starter Prompt
```
ARCHITECT SESSION — Project AETHER v5, Phase 03

Role: Principal Architect & Prompt Engineer
Authority: Review Batch [X] submission and generate Batch [X+1] prompt

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/master-development-roadmap.md
2. feature-update/major-update_5/staging/phase-03-ux-humanization.md
3. feature-update/major-update_5/runtime/runtime-phase-03.md
4. aether/session-recaps/ → latest recap

STANDING BY for Executor's Phase 03, Batch [X] submission.
```

### Executor Session Starter Prompt Template
```
EXECUTOR SESSION — Project AETHER v5, Phase 03, Batch [X]
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-03-ux-humanization.md → Batch [X] section
2. feature-update/major-update_5/runtime/runtime-phase-03.md
3. aether/session-recaps/ → latest recap

TASK: [Architect fills in specific tasks]

FILES TO CREATE/MODIFY:
- [Batch-specific list — max 4 files]

QUALITY GATES:
- npm run build (zero errors)
- TypeScript strict, no errors in modified files
- WCAG AAA maintained (no contrast regressions)
- Mobile 375px responsive
- Animations respect prefers-reduced-motion
- Max [N] files modified

STOP CONDITIONS:
- Recap → commit → STOP
- Do NOT start next batch
```

---

## 3. Tools & Environment

### Approved Tools
- ✅ `npm run build` — Verify build
- ✅ `npm run dev` — Local development server (test on real mobile device if possible)
- ✅ Chrome DevTools — Console, network, performance profiling
- ✅ React DevTools — Component tree inspection
- ✅ Supabase dashboard — Verify data mutations (edit/delete)

### Approved Libraries (Already Installed)
- ✅ `@radix-ui/*` — UI primitives (Button, AlertDialog, DropdownMenu)
- ✅ `recharts` — Charts (Overview, Tren)
- ✅ `lucide-react` — Icons (TrendingUp, Edit, Trash, PenLine, Trash2)
- ✅ `react-hook-form` — Forms (TransactionModal)
- ✅ `@supabase/supabase-js` — Database client
- ✅ `motion` — Animations (motion/react)
- ✅ `sonner` — Toast notifications

### NOT Approved
- ❌ New animation libraries
- ❌ New charting libraries (use Recharts only)
- ❌ New state management (use existing hooks)

---

## 4. Code Style & Patterns

### TypeScript
- **Strict mode required** — All components must have full type annotations
- **Imports:** Use `@` alias (e.g., `@/hooks`, `@/components`)
- **No `any` type** — Explicitly type props, state, return values

### React Patterns
- **Hooks:** Use existing custom hooks (`useTransactions`, `useDompetFilter`, etc.)
- **Components:** Keep under 300 lines (split if needed)
- **useCallback** for event handlers passed as props (prevent re-renders)
- **Async:** Try-catch around all Supabase mutations

### Tailwind CSS
- ✅ Use existing theme tokens (`bgColorVar()`, `textColorVar()`, `borderColorVar()`)
- ❌ Do NOT hardcode hex colors
- ❌ Do NOT add custom CSS

---

## 5. Data Mutations (Batch 1 — Edit/Delete)

### Edit Flow
```
User clicks Edit → TransactionModal opens with transaction data pre-populated
  → User modifies form → Submits
  → Supabase UPDATE (not INSERT) → refetch()
  → Modal closes, toast "Transaksi diperbarui"
```

### Delete Flow
```
User clicks Delete → AlertDialog confirmation opens
  → User confirms
  → Supabase DELETE → refetch()
  → Toast "Transaksi dihapus"
```

### TransactionModal Edit Mode
```typescript
// TransactionModal accepts optional transaction prop
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  transaction?: Transaction; // edit mode when provided
}

// useEffect pre-populates form in edit mode
useEffect(() => {
  if (transaction) {
    setTransactionType(transaction.type === 'income' ? 'pemasukan' : 'pengeluaran');
    setManualAmount(String(transaction.amount));
    setManualCategory(transaction.category);
    setManualNote(transaction.note || '');
    setManualDate(transaction.date);
    setInputMethod('manual');
  }
}, [transaction]);
```

---

## 6. AI Insight Pattern (Batch 2)

```typescript
// In Overview.tsx and Tren.tsx — same pattern
const [insight, setInsight] = useState<string>('');
const [insightLoading, setInsightLoading] = useState(true);

useEffect(() => {
  if (transactions.length === 0) { setInsightLoading(false); return; }
  const fetchInsight = async () => {
    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: buildContext(transactions), userId: user?.userId }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      setInsight(data.reply ?? '');
    } catch {
      setInsight(''); // Silent fallback — chart still shows
    } finally {
      setInsightLoading(false);
    }
  };
  fetchInsight();
}, [transactions]);
```

---

## 7. Calendar Pattern (Batch 3 — PolaWaktu)

```typescript
// Daily aggregation using Date API
const dailyData = useMemo(() => {
  const map: Record<number, { total: number; count: number }> = {};
  transactions.forEach(tx => {
    const d = new Date(tx.date);
    if (d.getMonth() === calendarMonth.month && d.getFullYear() === calendarMonth.year) {
      const day = d.getDate();
      if (!map[day]) map[day] = { total: 0, count: 0 };
      map[day].total += Number(tx.amount);
      map[day].count += 1;
    }
  });
  return map;
}, [transactions, calendarMonth.month, calendarMonth.year]);
```

---

## 8. Mobile Testing Checklist

### Batch 1
- [ ] Edit button opens modal correctly on mobile (modal renders full-screen or bottom sheet)
- [ ] Delete confirmation dialog centered on mobile
- [ ] Login footer: `bgColorVar('sidebar-bg')` renders correctly in dark/light mode
- [ ] All buttons touch-friendly (min 44px height)

### Batch 2
- [ ] ChartInsight card wraps correctly on mobile
- [ ] Loading skeleton doesn't cause layout shift
- [ ] Chart renders at mobile width (no horizontal scroll)

### Batch 3
- [ ] Calendar 7-column grid readable on 375px
- [ ] Rupiah amounts + counts fit in day cells
- [ ] DetailKategori toggle buttons centered and touch-friendly
- [ ] Back navigation works on mobile

---

## 9. Performance Constraints

- **Edit/Delete mutation:** < 2s (Supabase roundtrip)
- **AI insight generation:** < 5s (with AbortSignal.timeout)
- **Build time:** < 40s (baseline 34.95s)
- **No memory leaks:** Test with DevTools Memory tab if doing complex state

---

## 10. Git & Commit Protocol

### Per Batch
- **1 atomic commit per batch**
- **Conventional commit format:**
  ```
  feat(riwayat): add edit and delete to transaction history

  - TransactionModal: add transaction prop for edit mode
  - Riwayat: wire AlertDialog + TransactionModal for edit/delete
  - ExpandableTransactionRow: add onEdit/onDelete action buttons
  - Login: fix hardcoded white footer to use sidebar-bg theme token

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```

---

## 11. Rollback Triggers (STOP IMMEDIATELY)

- ❌ `npm run build` fails (any error)
- ❌ TypeScript errors in modified files
- ❌ WCAG AAA regression (contrast ratio drops)
- ❌ Edit/Delete mutations don't persist to Supabase
- ❌ Console errors on target pages
- ❌ More than 5 files modified per batch

---

## Approval Gate

✅ **PHASE 3 COMPLETE — Runtime parameters for reference only.**

Carryover: PolaWaktu and DetailKategori routes must be wired in Phase 4 Batch 3.
