# Phase 3: Backend Integration & AI Insights — PLAN

**Status:** Ready to Start  
**Estimated Duration:** 5-7 days  
**Date:** Starting 2026-05-20

---

## Executive Summary

Phase 3 integrates the frontend "Sekilas Hari Ini" dashboard with a backend that provides intelligent financial insights. The **good news**: most frontend hooks are already implemented with smart client-side calculations. **The work**: fix a small integration issue in `buildInsightFeed()`, then extend the backend to provide AI-generated personalized recommendations via Claude Haiku.

**Current State:**
- ✅ `useFinancialHealth()` — DONE (client-side calculations)
- ✅ `useBudgetRecommendations()` — DONE (client-side calculations)
- ✅ `useInsights()` — DONE (anomaly detection)
- ❌ `buildInsightFeed()` — NEEDS FIX (incorrect data mapping)

**Phase 3 Deliverables:**
1. Fix `buildInsightFeed()` integration issue
2. Verify all insight feeds render correctly
3. (Optional) Add Claude Haiku backend for AI-generated insights
4. E2E testing of insight generation

---

## Part 1: Fix Frontend Integration (Day 1)

### Issue: `buildInsightFeed()` Data Mapping

Current code tries to map wrong structures:

```typescript
// WRONG — healthData.insights is a string[], not an object array
healthData.insights?.slice(0, 2).forEach((insight) => {
  items.push({
    severity: insight.severity === 'critical' ? 'critical' : ...,
    emoji: insight.emoji || '💡',
    title: insight.title,
    body: insight.body,
  });
});

// WRONG — budgetRecs items have 'reason' + 'impact', not 'title' + 'body'
{
  category: string;
  reason: string;     // NOT 'title'
  impact: string;     // NOT 'body'
  priority: 'critical' | 'high' | 'medium' | 'low';
  isIncrease: boolean;
}
```

### Solution: Correct the Mapping

**Step 1:** Update `buildInsightFeed()` to properly extract and transform data:

```typescript
function buildInsightFeed(
  insights: ReturnType<typeof useInsights>,
  healthData: ReturnType<typeof useFinancialHealth>,
  budgetRecs: ReturnType<typeof useBudgetRecommendations>,
): InsightFeedItem[] {
  const items: InsightFeedItem[] = [];

  // 1. Add anomalies from useInsights (these already have correct structure)
  insights.anomalies.slice(0, 2).forEach((anomaly) => {
    items.push({
      severity: anomaly.severity === 'high' ? 'critical' : 'warning',
      emoji: '⚠️',
      title: anomaly.title,
      body: anomaly.description,
    });
  });

  // 2. Add insights from useFinancialHealth (healthData.insights is string[])
  // Convert each string insight into an InsightFeedItem
  healthData.insights?.slice(0, 2).forEach((insightText) => {
    // Parse emoji from insight string (format: "✅ Message text")
    const match = insightText.match(/^([\p{Emoji}]+)\s+(.+)$/u);
    if (match) {
      const [, emoji, text] = match;
      items.push({
        severity: 'info',
        emoji,
        title: 'Insight',
        body: text,
      });
    }
  });

  // 3. Add first budget recommendation if space
  if (items.length < 4 && budgetRecs.length > 0) {
    const rec = budgetRecs[0];
    items.push({
      severity: rec.priority === 'critical' ? 'critical' : 
                rec.priority === 'high' ? 'warning' : 'info',
      emoji: rec.isIncrease ? '📈' : '📉',
      title: rec.category,
      body: rec.reason,
    });
  }

  return items.slice(0, 4);
}
```

### Step 2: Verify Rendering

Test at http://localhost:5178/overview to confirm:
- [ ] AI Insight Feed card loads with proper insights
- [ ] Severities render correct colors (critical=red, warning=yellow, info=blue)
- [ ] Emojis display correctly
- [ ] Staggered animation works
- [ ] No console errors

---

## Part 2: Backend Structure (Days 2-4)

### Current Backend State

**Python Bot:** `bot/main.py` + handlers
- Handles Telegram commands
- Writes transactions to Supabase
- Uses Claude Haiku for receipt parsing

**Database:** Supabase PostgreSQL
- Schema: `users`, `transactions`, `budgets`, `goals`, `categories`
- No dedicated "insights" or "recommendations" tables

**Missing:** API endpoints for frontend to fetch pre-computed or AI-generated insights

### Phase 3 Backend Scope

#### Option A: Client-Side Only (Fastest — 1 day)
Keep all calculations client-side (current state). Just fix the `buildInsightFeed()` mapping.
- **Pros:** No backend changes needed, instant feedback
- **Cons:** Heavy computation on frontend, no persistent recommendations

#### Option B: Backend API + Pre-computed (Moderate — 3-4 days)
Add Vercel serverless functions to compute insights server-side and cache them.
- **Pros:** Offload computation, can cache for performance
- **Cons:** Need to set up API endpoints

#### Option C: Full AI Backend (Comprehensive — 5-7 days)
Use Claude Haiku to generate personalized, context-aware recommendations server-side.
- **Pros:** Truly intelligent insights, best UX
- **Cons:** Requires building backend API, testing integration, API costs

### Recommended: Option A → Option B

**Phase 3a (This week):** Fix integration + test with Option A (client-side)
**Phase 3b (Later):** Extend with Option B (backend API) if needed

---

## Part 3: Testing Plan (Day 5)

### Test All 4 Screens with Live Insights

#### Overview Screen
- [ ] AI Insight Feed shows 1-4 insights from financial health
- [ ] Budget recommendations appear if applicable
- [ ] Severities (critical/warning/info) color-coded correctly
- [ ] Staggered animation is smooth
- [ ] Clicking insights doesn't error

#### Pengeluaran Screen
- [ ] Top category shows correctly
- [ ] Spending breakdown chart renders
- [ ] Category expansion works

#### Riwayat Screen
- [ ] Transactions list shows all filters working
- [ ] Export functionality works

#### Tren Screen
- [ ] 3+ months of trend data displays correctly
- [ ] Charts are responsive and readable

### Edge Cases to Test

1. **No insights (new user):**
   - [ ] Overview shows: "Tambah lebih banyak transaksi untuk mendapatkan rekomendasi AI"
   - [ ] User can still navigate normally

2. **Only 1 insight:**
   - [ ] Single insight card displays without extra padding
   - [ ] Animation still works

3. **Budget overrun:**
   - [ ] "Sisa Budget" card shows red color if < 20%
   - [ ] Budget recommendations prioritize high/critical

4. **Payday not set:**
   - [ ] "Hari Gajian" card shows "Belum diatur"
   - [ ] No errors or null values

---

## Part 4: (Optional) Backend Enhancement (Days 6-7)

### If Time Permits: Add Claude Haiku Insights

```python
# bot/services/insights_generator.py

async def generate_personalized_insights(
    user_id: int,
    month: int,
    year: int,
    session: AsyncSession
) -> list[dict]:
    """
    Use Claude Haiku to generate personalized financial insights.
    
    Input: User's transactions, budgets, spending patterns
    Output: List of 2-3 actionable, personalized insights
    """
    
    # 1. Fetch user data
    transactions = await get_user_transactions(user_id, month, year, session)
    budgets = await get_user_budgets(user_id, session)
    
    # 2. Summarize for Claude
    summary = f"""
    User {user_id}'s financial data for {month}/{year}:
    - Income: {total_income} IDR
    - Expenses: {total_expenses} IDR ({categories breakdown})
    - Budget adherence: {adherence}%
    - Savings rate: {savings_rate}%
    
    Top spending categories: {top_categories}
    Budget overruns: {overruns}
    Anomalies detected: {anomalies}
    """
    
    # 3. Call Claude Haiku for insights
    response = anthropic.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""Analyze this user's finances and provide 2-3 SHORT, 
            actionable insights in Indonesian. Focus on:
            1. Immediate actions they can take
            2. Spending patterns to watch
            3. Budget recommendations
            
            {summary}
            
            Format each insight as JSON:
            {{"emoji": "📊", "title": "...", "body": "...", "priority": "high"}}
            """
        }]
    )
    
    # 4. Parse and return
    insights = parse_json_insights(response.content[0].text)
    return insights
```

**API Endpoint:**
```
GET /api/insights/{user_id}?month=5&year=2026
  → Returns: [InsightFeedItem, ...]
```

**Integration in Frontend:**
```typescript
// frontend/api/insights.ts
async function fetchAIInsights(month: number, year: number): Promise<InsightFeedItem[]> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Not authenticated");
  
  const response = await fetch(
    `/api/insights?month=${month}&year=${year}`,
    {
      headers: { Authorization: `Bearer ${data.session.access_token}` }
    }
  );
  
  return response.json();
}
```

---

## Daily Breakdown

### Day 1: Integration Fix
- [ ] Fix `buildInsightFeed()` data mapping
- [ ] Test at localhost:5178
- [ ] Verify no console errors
- [ ] All 4 screens show insights correctly

### Day 2-3: Testing & Documentation
- [ ] Test all 4 screens with live data
- [ ] Test edge cases (no insights, budget overrun, payday not set)
- [ ] Verify responsive at 3 breakpoints
- [ ] Document any issues found

### Day 4-5: (Optional) Backend Enhancement
- [ ] Design API endpoint for Claude Haiku insights
- [ ] Implement insights_generator.py
- [ ] Create Vercel serverless function
- [ ] Test API integration

### Day 5-7: Final Testing & Deployment
- [ ] E2E tests for entire flow
- [ ] Performance testing (insight load time)
- [ ] Security review (API auth, rate limiting)
- [ ] Deploy to staging, test in production-like environment
- [ ] Prepare Phase 4 planning docs

---

## Success Criteria

### Minimum (Option A: Client-Side)
- [x] `buildInsightFeed()` correctly maps all data sources
- [ ] AI Insight Feed displays 1-4 insights per screen
- [ ] All severities (critical/warning/info) render correctly
- [ ] No console errors or warnings
- [ ] Animations smooth on all breakpoints
- [ ] Edge cases handled (no insights, budget overrun, etc.)

### Complete (Option B: Backend API)
- All minimum criteria PLUS:
- [ ] Vercel serverless function computes insights server-side
- [ ] API endpoint returns valid InsightFeedItem[] structure
- [ ] Frontend uses API data instead of client calculations
- [ ] Insights are cached for performance
- [ ] API has proper error handling and rate limiting

### Ideal (Option C: Claude Haiku)
- All complete criteria PLUS:
- [ ] Claude Haiku generates 2-3 personalized insights per month
- [ ] Insights are actionable and contextual
- [ ] Insights stored in database for historical tracking
- [ ] User can mark insights as "read" or "helpful"
- [ ] Insights improve user engagement (tracking)

---

## Known Unknowns / Risks

1. **Emoji regex in buildInsightFeed():** The emoji extraction regex might fail on some emoji formats. Solution: Simplify by using a fixed emoji per insight type.

2. **Performance with large datasets:** If user has 5+ years of transaction history, client-side calculations might slow down. Solution: Move to backend API.

3. **API rate limits:** If building Claude Haiku backend, need to respect API rate limits. Solution: Cache insights for 24 hours.

4. **Supabase auth flow:** Need to ensure frontend API calls are authenticated properly. Solution: Use existing `useAuth()` hook and Supabase JWT.

---

## Handoff Notes

**For Implementation:**
1. Start with Part 1 (fix `buildInsightFeed()`) — should take < 30 min
2. Test thoroughly on all 4 screens
3. Decide on Option A/B/C based on time/resources
4. Document any deviations from this plan

**For Code Review:**
- Ensure all InsightFeedItem structures have: severity, emoji, title, body
- Verify no null/undefined values in insight rendering
- Check that buildInsightFeed() handles empty arrays gracefully
- Confirm animations respect useReducedMotion()

**For QA Testing:**
- Test each screen at 375px, 768px, 1024px+
- Verify insights update when filtering by month/year
- Test with users who have 0, 1, 2, 3+ insights
- Check console for any warnings

---

## Related Files

- `frontend/src/app/pages/Overview.tsx` — Contains `buildInsightFeed()` needing fix
- `frontend/src/hooks/data/useFinancialHealth.ts` — Already implemented ✅
- `frontend/src/hooks/data/useBudgetRecommendations.ts` — Already implemented ✅
- `frontend/src/hooks/data/useInsights.ts` — Already implemented ✅
- `frontend/src/app/components/AIInsightCard.tsx` — Ready to display insights ✅

---

**Status: Ready to begin Part 1** 🚀
