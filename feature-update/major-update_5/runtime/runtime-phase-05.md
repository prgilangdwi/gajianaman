# Phase 5 Runtime Parameters — AI Insights Expansion & Production Audit

**Phase:** 05  
**Status:** 🔲 NOT STARTED  
**Batches:** 3  
**Critical Path:** Batch 1 → Batch 2 → Batch 3 (sequential)  
**Executor Model:** claude-sonnet-4-6  

---

## 1. Execution Constraints

### Anti-Bloat Model
- **Batch 1:** Max 2 files (Forecasting.tsx, ask-assistant.js — if changes needed)
- **Batch 2:** Max 2 files (Asisten.tsx, ask-assistant.js)
- **Batch 3:** Max 5 files (Lighthouse findings — document in recap before modifying)
- **Hard limit:** 5 files per batch in emergency (escalate to Architect first)

### Build Quality Gates
- ✅ `npm run build` must pass before commit (zero errors)
- ✅ No TypeScript errors in modified files
- ✅ No accessibility regressions (WCAG AAA from Phase 2 maintained)
- ✅ No console errors in browser DevTools
- ✅ Lighthouse ≥ 90 (Batch 3 final gate)

### Session Discipline
- **1 session = 1 batch maximum**
- After batch complete: Create recap, commit, stop, await Architect approval
- Do NOT start next batch in same session

---

## 2. DUAL-SESSION PROTOCOL

### How phases work
Each batch requires exactly 2 Claude Code sessions:
- **Session A — Architect:** Reviews previous batch, approves, generates Executor prompt
- **Session B — Executor:** Implements batch, submits recap for review

Sessions must NOT overlap. Executor never starts without Architect approval.

### Architect Session Responsibilities
1. Read: `feature-update/major-update_5/master-development-roadmap.md`
2. Read: `feature-update/major-update_5/staging/phase-05-ai-insights.md`
3. Read: `feature-update/major-update_5/runtime/runtime-phase-05.md` (this file)
4. Read: latest recap from `aether/session-recaps/`
5. Verify Phase 4 is 100% complete (all routes wired, build passes, onboarded works)
6. Review Executor's submitted files against batch spec
7. Check quality gates (TypeScript, a11y, AI integration, Lighthouse for Batch 3)
8. Generate precise Executor prompt for next batch
9. Approve or request changes — do NOT implement

### Executor Session Responsibilities
1. Read: Architect's batch prompt
2. Read: `staging/phase-05-ai-insights.md` → current batch section
3. Read: `runtime/runtime-phase-05.md` → sections 3–10
4. Read: latest recap from `aether/session-recaps/`
5. Implement ONLY the files listed in batch spec
6. Run `npm run build` before every commit
7. Create recap: `aether/session-recaps/YYYY-MM-DD-Phase05-Batch0X.md`
8. Commit, STOP, await Architect approval

### Architect Session Starter Prompt
```
ARCHITECT SESSION — Project AETHER v5, Phase 05

Role: Principal Architect & Prompt Engineer
Authority: Review Batch [X] submission and generate Batch [X+1] prompt

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/master-development-roadmap.md
2. feature-update/major-update_5/staging/phase-05-ai-insights.md
3. feature-update/major-update_5/runtime/runtime-phase-05.md
4. aether/session-recaps/ → latest recap

STANDING BY for Executor's Phase 05, Batch [X] submission.
```

### Executor Session Starter Prompt — Batch 1
```
EXECUTOR SESSION — Project AETHER v5, Phase 05, Batch 1
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-05-ai-insights.md → Batch 1 section
2. feature-update/major-update_5/runtime/runtime-phase-05.md
3. aether/session-recaps/ → latest recap (Phase 04 Batch 03)

TASK: Add AI insight blocks to Forecasting.tsx

IMPORTANT: ChartInsight component already exists at frontend/src/app/components/ChartInsight.tsx
Do NOT recreate it — import and reuse it. Mirror the exact pattern from Overview.tsx.

FILES TO MODIFY (max 2):
- frontend/src/app/pages/Forecasting.tsx (MODIFIED)
- frontend/api/ask-assistant.js (MODIFIED only if Forecasting needs different prompt format)

QUALITY GATES:
- npm run build (zero errors)
- ChartInsight renders below Forecasting chart
- Insight generates within 5s or gracefully skipped
- Mobile responsive, no layout shift
- Max 2 files modified

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase05-Batch01.md
- Commit: feat(forecasting): add ai insight block with chart context
- STOP and await Architect approval before Batch 2
```

### Executor Session Starter Prompt — Batch 2
```
EXECUTOR SESSION — Project AETHER v5, Phase 05, Batch 2
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-05-ai-insights.md → Batch 2 section
2. feature-update/major-update_5/runtime/runtime-phase-05.md
3. aether/session-recaps/ → latest recap (Phase 05 Batch 01)

TASK: Finalize multi-turn chat memory in Asisten.tsx

FILES TO MODIFY (max 2):
- frontend/src/app/pages/Asisten.tsx (MODIFIED)
- frontend/api/ask-assistant.js (MODIFIED — add messages array support)

REQUIREMENTS:
- ask-assistant.js must accept both messages[] array AND legacy message string (backward compatible)
- Asisten.tsx sends full message history on every API call
- History summarization when > 10 messages (prevent token overflow)
- Clear Chat button resets conversation
- Model: claude-sonnet-4-6

QUALITY GATES:
- npm run build (zero errors)
- AI responses reference earlier conversation turns
- No token overflow on long conversations
- Clear Chat resets correctly
- Max 2 files modified

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase05-Batch02.md
- Commit: feat(asisten): implement multi-turn chat memory and history summarization
- STOP and await Architect approval before Batch 3
```

### Executor Session Starter Prompt — Batch 3
```
EXECUTOR SESSION — Project AETHER v5, Phase 05, Batch 3
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-05-ai-insights.md → Batch 3 section
2. feature-update/major-update_5/runtime/runtime-phase-05.md
3. aether/session-recaps/ → latest recap (Phase 05 Batch 02)

TASK: Production audit — Lighthouse ≥ 90, bundle analysis, fix findings

WORKFLOW:
1. Run: npm run build && npm run preview
2. Open Chrome DevTools → Lighthouse → Run on /home/overview
3. Document findings in recap BEFORE making any code changes
4. Fix findings (max 5 files total)
5. Re-run Lighthouse to verify improvement

TARGET SCORES:
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 85

QUALITY GATES:
- npm run build (zero errors)
- Lighthouse ≥ 90 (Performance, Accessibility, Best Practices)
- No console errors or warnings on any page
- Max 5 files modified

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase05-Batch03.md
- Commit: perf(audit): improve lighthouse scores and production readiness
- STOP — Phase 5 complete, await Architect final approval
```

---

## 3. Tools & Environment

### Approved Tools
- ✅ `npm run build` — Build verification
- ✅ `npm run dev` / `npm run preview` — Local testing
- ✅ Chrome DevTools — Lighthouse, console, network
- ✅ React DevTools — Component profiling (Batch 3 if needed)
- ✅ Chrome Memory tab — Check for memory leaks in Asisten chat

---

## 4. Code Style & Patterns

### AI Insight Pattern (Batch 1 — mirrors Overview.tsx exactly)
```typescript
const [insight, setInsight] = useState<string>('');
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
      setInsight(data.reply ?? '');
    } catch {
      setInsight(''); // Silent graceful fallback
    } finally {
      setInsightLoading(false);
    }
  };
  fetchInsight();
}, [transactions, user?.userId]);
```

### Multi-Turn Chat Pattern (Batch 2)
```typescript
// Message type
type Message = { role: 'user' | 'assistant'; content: string };

// State
const [messages, setMessages] = useState<Message[]>([]);

// Send message — include full history
const sendMessage = async (userInput: string) => {
  const newHistory = [...messages, { role: 'user' as const, content: userInput }];
  setMessages(newHistory);

  const response = await fetch('/api/ask-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: newHistory, userId: user?.userId }),
  });
  const data = await response.json();
  setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
};
```

### ask-assistant.js Backward Compatibility (Batch 2)
```javascript
// Support both legacy message string and new messages array
const msgs = req.body.messages
  ? req.body.messages.map(m => ({ role: m.role, content: m.content }))
  : [{ role: 'user', content: req.body.message ?? '' }];
```

---

## 5. Lighthouse Optimization Patterns (Batch 3)

### Common findings and fixes:

**LCP (Largest Contentful Paint):**
- Preload key fonts: `<link rel="preload" as="font" ...>`
- Ensure hero images have explicit width/height

**CLS (Cumulative Layout Shift):**
- Add explicit dimensions to Chart containers
- Use `min-h-[Xpx]` on loading skeletons to reserve space

**Unused JavaScript:**
- Verify React.lazy() covers all page routes (Phase 9 did this — confirm it's still active)
- Check if any library is imported globally but only used on one page

**Image Optimization:**
- `loading="lazy"` on all non-critical images
- Explicit width/height attributes

**Font Loading:**
- `font-display: swap` in fonts.css

---

## 6. Mobile Testing Checklist

### Batch 1
- [ ] Forecasting AI insight renders below chart on mobile
- [ ] Loading skeleton doesn't shift chart position
- [ ] Insight text wraps correctly on 375px

### Batch 2
- [ ] Chat history scrolls correctly on mobile
- [ ] Clear Chat button accessible on mobile
- [ ] Keyboard doesn't push chat out of viewport

### Batch 3
- [ ] Lighthouse run on mobile emulation (375px in DevTools)
- [ ] No horizontal scroll on any page
- [ ] Touch targets ≥ 44px (WCAG)

---

## 7. Performance Constraints

- **Forecasting AI insight:** < 5s or skip gracefully
- **Chat message response:** < 5s typical
- **Lighthouse Performance score:** ≥ 90
- **Build time:** < 50s (lazy imports add some overhead)

---

## 8. Git & Commit Protocol

### Batch 1
```
feat(forecasting): add ai insight block with chart context

- Integrate ChartInsight component below forecast chart (reuse from Overview)
- Build forecast context from last 3 months transaction data
- 5s timeout with graceful fallback

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Batch 2
```
feat(asisten): implement multi-turn chat memory and history summarization

- Send full message history to Claude on every turn
- Add history summarization when > 10 messages
- Update ask-assistant.js to accept messages array (backward compatible)
- Add Clear Chat button to reset conversation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Batch 3
```
perf(audit): improve lighthouse scores and production readiness

- [List actual fixes after audit]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 9. Rollback Triggers (STOP IMMEDIATELY)

- ❌ `npm run build` fails
- ❌ TypeScript errors introduced
- ❌ WCAG AAA regression (accessibility broken)
- ❌ Lighthouse fix breaks existing functionality
- ❌ Multi-turn chat breaks single-turn fallback
- ❌ More than 5 files modified per batch

---

## 10. Success Criteria (Per Batch)

### Batch 1
- ✅ Forecasting shows ChartInsight below chart
- ✅ Insight generation gracefully skipped if API fails
- ✅ Mobile responsive
- ✅ Build passes

### Batch 2
- ✅ AI chat references earlier turns
- ✅ History summarization prevents token overflow
- ✅ ask-assistant.js backward compatible
- ✅ Clear Chat works
- ✅ Build passes

### Batch 3
- ✅ Lighthouse Performance ≥ 90
- ✅ Lighthouse Accessibility ≥ 90
- ✅ Lighthouse Best Practices ≥ 90
- ✅ No console errors on any page
- ✅ Build passes

---

## Approval Gate

✋ **RUNTIME PARAMETERS LOCKED**

Phase 4 must be 100% complete before Phase 5 Batch 1 begins.  
Architect generates batch-specific Executor prompts from Section 2 above.
