# Phase 5 Execution Plan — AI Insights Expansion & Production Audit

**Status:** 🔲 NOT STARTED  
**Priority:** High (AI omnipresence + production readiness)  
**Date Created:** 2026-05-24  
**Architect:** AETHER v5 Principal Architect  
**Executor Model:** claude-sonnet-4-6  

---

## 1. Phase Goal

Make AI feel omnipresent throughout the app by adding contextual insights to the Forecasting page,
finalizing multi-turn chat memory in the Asisten page, and ensuring the app is production-ready
with Lighthouse scores ≥ 90 across all categories.

**Success Criteria:**
- ✅ Forecasting.tsx has AI insight blocks (same ChartInsight pattern as Overview/Tren)
- ✅ Asisten chat has persistent multi-turn memory (context carries across messages)
- ✅ Lighthouse ≥ 90: Performance, Accessibility, Best Practices, SEO
- ✅ No console errors or warnings in production build
- ✅ Build passes with zero errors

---

## 2. Batch Breakdown

### Batch 1 — Forecasting AI Insights
**Anti-Bloat Limit:** 2 files  
**Status:** 🔲 NOT STARTED  
**Executor Model:** claude-sonnet-4-6

**Task List:**

1. **Forecasting.tsx (MODIFIED):**
   - Integrate `ChartInsight` component (already exists at `frontend/src/app/components/ChartInsight.tsx`)
   - Do NOT recreate ChartInsight — import and reuse it directly
   - Add AI insight below the forecast chart(s)
   - Context to send to AI: last 3 months transaction data + forecast projection
   - Prompt context (Indonesian): "Berdasarkan tren pengeluaran [X bulan terakhir], berikan
     analisis singkat dan saran untuk bulan depan."
   - Loading state: skeleton placeholder while insight generates
   - Graceful fallback: chart still shows if AI fails (insight is bonus)
   - Timeout: 5s max, skip gracefully if exceeded

2. **ask-assistant.js (MODIFIED — if needed):**
   - If Forecasting requires a different prompt format, add a `forecasting` mode parameter
   - Keep backward compatibility (existing modes must still work)
   - Only modify if strictly necessary — may be a no-op if existing endpoint is flexible enough

**Implementation Pattern (mirror Overview.tsx exactly):**
```typescript
const [forecastInsight, setForecastInsight] = useState<string>('');
const [insightLoading, setInsightLoading] = useState(true);

useEffect(() => {
  if (transactions.length === 0) { setInsightLoading(false); return; }
  const fetchInsight = async () => {
    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: buildForecastContext(transactions),
          userId: user?.userId,
        }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      setForecastInsight(data.reply ?? '');
    } catch {
      setForecastInsight(''); // silent fallback
    } finally {
      setInsightLoading(false);
    }
  };
  fetchInsight();
}, [transactions, user?.userId]);
```

**Success Criteria:**
- ✅ Forecasting.tsx shows ChartInsight below forecast chart
- ✅ Insight generates within 5s or gracefully skipped
- ✅ Mobile responsive, no layout shift during loading
- ✅ Build passes

---

### Batch 2 — Asisten Multi-Turn Memory
**Anti-Bloat Limit:** 2 files  
**Status:** 🔲 NOT STARTED

**Task List:**

1. **Asisten.tsx (MODIFIED):**
   - Ensure conversation history is passed to every API call (not just the latest message)
   - Local state: `messages: Array<{ role: 'user' | 'assistant', content: string }>`
   - On each new message: append to history, send full history to `/api/ask-assistant`
   - Display: conversational bubbles showing full thread (already likely implemented — verify)
   - Add summary injection: if history > 10 messages, summarize earlier context to reduce tokens
   - "Bersihkan Chat" (Clear Chat) button: resets message history

2. **ask-assistant.js (MODIFIED):**
   - Accept `messages: Array<{ role, content }>` array instead of single `message` string
   - Pass full messages array to Anthropic SDK `messages.create()`
   - Backward compatible: if `message` string provided (old format), wrap as single-turn
   - Add system prompt: "Kamu adalah asisten keuangan pribadi untuk pengguna Indonesia."
   - Max tokens: 1000 (sufficient for conversational replies)

**Multi-turn Format:**
```javascript
// ask-assistant.js — updated messages handling
const msgs = req.body.messages
  ? req.body.messages.map(m => ({ role: m.role, content: m.content }))
  : [{ role: 'user', content: req.body.message }];

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1000,
  system: 'Kamu adalah asisten keuangan pribadi untuk pengguna Indonesia. Berikan saran yang praktis dan spesifik.',
  messages: msgs,
});
```

**Success Criteria:**
- ✅ Chat sends full message history to API on each turn
- ✅ AI responses feel contextually aware (references earlier messages)
- ✅ Clear Chat button resets conversation
- ✅ No token overflow (history summarized after 10 messages)
- ✅ Build passes

---

### Batch 3 — Production Audit & Lighthouse
**Anti-Bloat Limit:** Depends on Lighthouse findings (document in recap)  
**Status:** 🔲 NOT STARTED

**Task List:**

1. **Run Lighthouse audit:**
   ```bash
   npm run build && npm run preview
   # Then open Chrome → DevTools → Lighthouse → Run on /home/overview
   ```
   Target scores:
   - Performance: ≥ 90
   - Accessibility: ≥ 90 (Phase 2 WCAG AAA should already ensure this)
   - Best Practices: ≥ 90
   - SEO: ≥ 85

2. **Fix Lighthouse findings** (common issues to expect):
   - **LCP (Largest Contentful Paint):** Optimize largest image/font on initial load
   - **CLS (Cumulative Layout Shift):** Fix any elements that shift after load
   - **Unused JavaScript:** Verify React.lazy() is splitting all pages (Phase 9 did this)
   - **Image optimization:** Add `loading="lazy"` to any remaining images
   - **Font loading:** Ensure fonts use `font-display: swap`

3. **Bundle analysis:**
   ```bash
   npm run build -- --analyze  # or check dist/stats.html
   ```
   - Target: no single chunk > 200KB
   - Verify Phase 9 lazy-loading is still effective

4. **Final build verification:**
   - `npm run build` with zero errors, zero warnings
   - `npm run typecheck` (if available)
   - Check browser console for any remaining warnings

**Files Modified:** Depends on audit findings. Document in recap.
**Maximum:** 5 files (anti-bloat still applies)

**Success Criteria:**
- ✅ Lighthouse ≥ 90 (Performance, Accessibility, Best Practices)
- ✅ No console errors or warnings on any page
- ✅ Bundle size healthy (no chunk > 200KB)
- ✅ Build passes with zero errors

---

## 3. Touch List

### ✅ CAN MODIFY
- `frontend/src/app/pages/Forecasting.tsx`
- `frontend/src/app/pages/Asisten.tsx`
- `frontend/api/ask-assistant.js`
- Any files flagged by Lighthouse audit (Batch 3 only)

### ❌ CANNOT MODIFY
- `frontend/src/app/components/ChartInsight.tsx` — reuse as-is (do NOT recreate)
- `frontend/src/styles/theme.css` — locked (Phase 2)
- `frontend/src/hooks/useDarkMode.ts` — locked (Phase 2)
- Phase 4 Gajian files (Batch 3 scope, handled by Phase 4)
- Database schema

---

## 4. Dependencies & Prerequisites

### Batch 1
- ✅ Phase 4 complete (all Gajian routes wired, app fully functional)
- ✅ `ChartInsight.tsx` exists and is proven working (Overview, Tren)
- ✅ `/api/ask-assistant.js` endpoint working

### Batch 2
- ✅ Batch 1 complete
- ✅ Asisten.tsx has existing message state (verify before modifying)
- ✅ `/api/ask-assistant.js` modified in Batch 1 if needed

### Batch 3
- ✅ Batch 2 complete
- ✅ Local build works (`npm run build` + `npm run preview`)
- ✅ Chrome DevTools Lighthouse available

---

## 5. AI Context Builders

### Forecasting Context (Batch 1)
```typescript
const buildForecastContext = (transactions: Transaction[]): string => {
  const last3Months = // filter last 90 days
  const totalSpend = // sum expenses
  const avgMonthly = totalSpend / 3;
  return `Pengguna memiliki rata-rata pengeluaran Rp ${formatRupiah(avgMonthly)}/bulan selama 3 bulan terakhir. Berikan analisis tren dan prediksi bulan depan dalam 2-3 kalimat.`;
};
```

### Chat Memory Summary (Batch 2)
```typescript
// When history > 10 messages, summarize first N messages
const summarizeHistory = async (messages: Message[]): Promise<Message[]> => {
  const toSummarize = messages.slice(0, -6); // keep last 6 verbatim
  const summary = await callAI(`Rangkum percakapan ini dalam 1 paragraf: ${JSON.stringify(toSummarize)}`);
  return [{ role: 'user', content: `[Ringkasan percakapan sebelumnya]: ${summary}` }, ...messages.slice(-6)];
};
```

---

## 6. Rollback Procedures

### If Batch 1 AI insights fail:
- Remove ChartInsight from Forecasting.tsx
- Forecasting chart must still render without insight
- No functional regression

### If Batch 2 multi-turn chat fails:
- Revert Asisten.tsx to single-turn (pass only latest message)
- Revert ask-assistant.js if modified
- Chat still works, just loses memory

### If Batch 3 Lighthouse fixes cause regressions:
- Revert specific optimization that broke functionality
- Document failing score in recap — a 89 is acceptable over a broken feature

---

## 7. Quality Gates

- ✅ `npm run build` must pass after each batch (zero errors)
- ✅ No TypeScript errors in modified files
- ✅ WCAG AAA maintained from Phase 2
- ✅ Mobile responsive (375px+)
- ✅ No console errors on any page
- ✅ Lighthouse ≥ 90 (final batch)

---

## 8. Known Issues / Carryovers → Production

- After Phase 5, the app is considered production-ready for v5.0
- Remaining backlog items (if any) become Phase 6 candidates

---

## 9. Success Metrics

| Metric | Target | Batch |
|--------|--------|-------|
| Forecasting AI insight | < 5s | 1 |
| Multi-turn memory | 10+ message context | 2 |
| Lighthouse Performance | ≥ 90 | 3 |
| Lighthouse Accessibility | ≥ 90 | 3 |
| Lighthouse Best Practices | ≥ 90 | 3 |
| Build errors | 0 | All |

---

## Approval Gate

✋ **PHASE 5 AWAITING INITIATION**

Phase 4 must be 100% complete before Phase 5 begins.  
Architect approval required before Executor starts Batch 1.
