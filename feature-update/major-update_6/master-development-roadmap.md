# Project AETHER — Major Update v6 (The "Power User Update")

## 1. Context Sync & Current State

**Previous State:** Major Update v5 ("The Human Companion Update") closed 2026-05-24 at 6 phases complete. The app is stable, accessible (WCAG AAA), has Dark Mode, a full Gajian wizard, and AI insights throughout. React Doctor score: 60/100 (structural ceiling — not a regression).

**v6 Objective:** Give users control and visibility they didn't have before. Four targeted feature expansions that deepen the app's utility for Indonesian salaried workers: custom category management, transaction export, savings goal automation, and web push notifications.

---

## 2. The 4-Phase Execution Plan (Micro-Batched)

### Phase 01: Category Customization
*Goal: Full CRUD UI for custom categories — create, rename, delete, reorder, assign icon/color.*

**Foundation:** `categories` table already in Supabase (`id`, `user_id`, `name`, `icon`, `type`, `is_default`). The `CategoryManager.tsx` component exists but may not be fully wired. Verify before implementing.

**Target Files:**
- `frontend/src/app/pages/Categories.tsx` — Main categories management page (enhance or rebuild if needed)
- `frontend/src/app/components/CategoryManager.tsx` — CRUD modal/panel for add/rename/delete
- `frontend/src/hooks/useCategoryManager.ts` — New hook: fetch, create, update, delete, reorder
- `frontend/src/lib/supabase.ts` — Add TypeScript types if missing
- `db/operations.py` — Add `create_category()`, `update_category()`, `delete_category()` async functions

**Constraints:**
- `is_default = true` categories can be renamed but NOT deleted (guard in UI + backend)
- Deleting a category with existing transactions must prompt: reassign or archive transactions
- Custom categories must propagate to the Gajian wizard category selector
- Reorder persists to a `sort_order` column (may need schema migration)

**Batch breakdown:**
- Batch 1: Hook + backend operations + TypeScript types
- Batch 2: Categories page UI (list, add, rename, delete with confirmation)
- Batch 3: Reorder drag-and-drop + icon/color picker + Gajian wizard integration

---

### Phase 02: Export (CSV + PDF)
*Goal: Let users download their transaction history and monthly summary reports.*

**Target Files:**
- `frontend/src/hooks/useExport.ts` — New hook: generate CSV blob, trigger download
- `frontend/src/app/pages/Riwayat.tsx` — Add "Export CSV" button to header actions
- `frontend/src/app/pages/Settings.tsx` — Add "Export Data" section (CSV + PDF options)
- `frontend/api/export-report.js` — New Vercel serverless function for PDF generation

**CSV export (client-side, no backend):**
- Fields: Date, Type, Category, Subcategory, Amount, Note, AI Confidence
- Filtered by current month filter (respects global MonthFilter context)
- Filename: `gajian-aman-{YYYY-MM}.csv`

**PDF export (Vercel serverless):**
- Monthly summary: total income, total expenses, net savings, top 5 categories
- Uses `pdfkit` or `puppeteer` (evaluate size constraints on Vercel)
- Alternative: client-side `jsPDF` + `html2canvas` — no backend cost but larger bundle
- Decision: prefer client-side unless PDF quality is unacceptable

**Batch breakdown:**
- Batch 1: CSV export hook + Riwayat button
- Batch 2: PDF export (evaluate and implement chosen approach) + Settings entry point

---

### Phase 03: Savings Goal Automation
*Goal: Link goals to wallets, auto-suggest monthly transfers, track contribution history.*

**Foundation:** `goals` table (`id`, `user_id`, `name`, `target_amount`, `saved_amount`, `deadline`), `Goals.tsx` page exists, `useGoals.ts` hook exists.

**Target Files:**
- `frontend/src/app/pages/Goals.tsx` — Add contribution flow + ETA recalculation
- `frontend/src/hooks/useGoalAutomation.ts` — New hook: surplus calculation, suggestions
- `frontend/src/app/components/GoalContributionModal.tsx` — New: manual + AI-suggested contribution
- `db/operations.py` — Add `add_goal_contribution()`, `get_goal_contributions()` functions
- `db/schema.sql` — Document new `goal_contributions` table (or `transactions` FK approach)

**New capabilities:**
- Link a goal to a specific dompet (wallet) — `wallet_id` FK on `goals` table
- Monthly surplus calculation: `total_income - total_expenses` for current month
- AI suggestion card: "You have Rp X surplus this month — consider adding Rp Y to [goal]?"
  - Calls `/api/ask-assistant` with spending context + goal state
- Contribution history per goal (either new `goal_contributions` table or `transactions` with `goal_id` FK)
- ETA recalculation: `(target - saved) / avg_monthly_contribution` → display "On track" / "Behind"
- Progress bar updated live after each contribution

**Schema decision (required before Batch 1):**
- Option A: New `goal_contributions(id, goal_id, user_id, amount, date, note)` table — clean separation
- Option B: Extend `transactions` table with nullable `goal_id FK` — reuses existing infrastructure
- Recommendation: Option A (avoids muddying the transactions schema)

**Batch breakdown:**
- Batch 1: Schema migration + backend operations + `useGoalAutomation` hook
- Batch 2: Contribution modal + Goals page UI update (history, ETA)
- Batch 3: AI suggestion card + wallet linking

---

### Phase 04: Push Notifications
*Goal: Budget limit alerts, salary day reminders, and weekly summaries via Web Push API.*

**Foundation:** Telegram bot APScheduler already sends weekly summaries (`scheduler/weekly_report.py`). Service worker placeholder may or may not exist — verify `frontend/public/`.

**Target Files:**
- `frontend/public/sw.js` — Service worker: push event handler, notification display
- `frontend/api/push-subscribe.js` — Vercel function: store/delete push subscriptions in Supabase
- `frontend/src/app/pages/Settings.tsx` — Notification opt-in UI (per-type toggles)
- `frontend/src/hooks/usePushNotifications.ts` — New hook: request permission, subscribe, store endpoint
- `scheduler/push_notifications.py` — New Railway scheduler: send Web Push payloads
- `db/schema.sql` — New `push_subscriptions(id, user_id, endpoint, p256dh, auth, created_at)` table

**Implementation details:**
- VAPID key pair: generate once with `web-push` npm package, store in `.env` + Railway env vars
- Notification types:
  - **Budget alert:** when any category reaches ≥80% of monthly budget. Triggered on new transaction save.
  - **Salary day reminder:** configurable day-of-month (stored in `users.salary_day` column, or Settings localStorage). Fires day before.
  - **Weekly summary:** Monday 08:00 WIB — extends existing `weekly_report.py` logic to send Web Push alongside Telegram.
- Opt-in UI: Settings page section "Notifikasi" with per-type toggles (persists to Supabase `user_settings`)
- Permission flow: browser permission prompt triggered only after user opts in, not on page load

**Constraints:**
- iOS Safari Web Push requires iOS 16.4+ and PWA installation — document as known limitation
- Push subscription endpoints must be invalidated on 410/404 response (standard Web Push spec)
- Do NOT send push AND Telegram for the same event without a user preference to choose

**Batch breakdown:**
- Batch 1: VAPID setup + `push_subscriptions` table + `push-subscribe.js` Vercel function
- Batch 2: Service worker + `usePushNotifications.ts` hook + Settings opt-in UI
- Batch 3: Budget alert trigger (on transaction save) + weekly summary Web Push in scheduler
- Batch 4: Salary day reminder scheduler job + end-to-end test all notification types

---

## 3. Execution Model

Same AETHER governance rules as v5:
- **Dual-session protocol:** Architect session → Executor session per batch
- **Anti-bloat:** 3–5 files per session
- **Build gates:** `npm run build` zero errors before every commit
- **Recap required:** `aether/session-recaps/YYYY-MM-DD-Phase[XX]-Batch[Y].md` after every batch

### Session starter sequence for each phase:
```
1. /gsd:discuss-phase [N]          ← capture implementation decisions
2. /gsd:plan-phase [N]             ← generate executor plan
3. /gsd:execute-phase [N]          ← micro-batched execution
```

---

## 4. Complexity & Risk Register

| Phase | Complexity | Primary Risk |
|-------|------------|-------------|
| 01 Category Customization | Medium | Supabase migration (sort_order column), transaction reassignment on category delete |
| 02 Export | Low–Medium | PDF library bundle size on Vercel (mitigated by client-side fallback) |
| 03 Goal Automation | Medium–High | Schema design (goal_contributions vs transactions FK), surplus calc accuracy |
| 04 Push Notifications | High | VAPID key management, Railway + Vercel dual-deployment coordination, iOS Safari limitations |

---

## 5. Prerequisites

Before Phase 01 Batch 1:
- [ ] Verify `categories` table schema in Supabase (confirm `sort_order` column exists or plan migration)
- [ ] Verify current state of `Categories.tsx` and `CategoryManager.tsx`
- [ ] Confirm `useCategoryManager.ts` or equivalent hook does/doesn't exist

Before Phase 04 Batch 1:
- [ ] Generate VAPID key pair and store in `.env.example` (without actual values)
- [ ] Confirm Railway environment supports `web-push` Python equivalent (`pywebpush`)

---

## 6. Branch Strategy

- Feature branches off `main`: `feature/phase-[NN]-[slug]`
- Examples:
  - `feature/phase-01-category-crud`
  - `feature/phase-02-export`
  - `feature/phase-03-goal-automation`
  - `feature/phase-04-push-notifications`
- Merge to `main` after each phase passes build + smoke test

---

## 7. Success Criteria

| Phase | Definition of Done |
|-------|-------------------|
| 01 | Users can create, rename, delete (with reassignment guard), and reorder custom categories. is_default protected. |
| 02 | Users can download a filtered CSV from Riwayat. Users can download a PDF monthly summary from Settings. |
| 03 | Users can link a goal to a wallet, log contributions, see ETA, and receive an AI surplus suggestion. |
| 04 | Users can opt in to push notifications. Budget alerts fire at ≥80%. Weekly summary sent via Web Push on Mondays. |
