# Phase 3 Option C: Claude Haiku Backend Implementation

**Status:** Starting implementation  
**Approach:** Full AI-powered insights using Claude Haiku  
**Estimated Duration:** 5-7 days  
**Components to Build:**
1. Backend insights generator service (Python)
2. Vercel API endpoint for insights
3. Supabase integration for caching
4. Frontend hook to fetch API insights
5. E2E testing

---

## Implementation Roadmap

### Day 1: Backend Service Creation

#### Create `services/insights_generator.py`

New file that uses Claude Haiku to analyze user's financial data and generate personalized insights:

```python
# services/insights_generator.py

from anthropic import Anthropic
from datetime import datetime, timedelta
from typing import Optional
import json

client = Anthropic()

async def generate_ai_insights(
    user_id: int,
    transactions: list[dict],
    budgets: list[dict],
    month: int,
    year: int,
    health_metrics: dict,
) -> list[dict]:
    """
    Use Claude Haiku to generate 2-3 personalized financial insights.
    
    Returns:
        List of InsightFeedItem dicts: {emoji, title, body, severity, priority}
    """
    
    # 1. Summarize financial data
    current_month_expenses = sum(
        t['amount'] for t in transactions 
        if t['type'] == 'expense' and 
        datetime.fromisoformat(t['date']).month == month
    )
    
    current_month_income = sum(
        t['amount'] for t in transactions 
        if t['type'] == 'income' and 
        datetime.fromisoformat(t['date']).month == month
    )
    
    # Top categories
    category_spending = {}
    for t in transactions:
        if t['type'] == 'expense' and datetime.fromisoformat(t['date']).month == month:
            cat = t['category']
            category_spending[cat] = category_spending.get(cat, 0) + t['amount']
    
    top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # 2. Build context for Claude
    prompt = f"""Analyze this Indonesian user's financial situation and provide 2-3 SHORT, 
    ACTIONABLE insights in Indonesian. Be specific, personal, and helpful.
    
    Financial Data:
    - Month: {month}/{year}
    - Income: Rp {current_month_income:,}
    - Expenses: Rp {current_month_expenses:,}
    - Net: Rp {current_month_income - current_month_expenses:,}
    - Budget adherence: {health_metrics.get('budgetAdherence', 0)}%
    - Savings rate: {health_metrics.get('savingsRate', 0)}%
    - Health score: {health_metrics.get('score', 0)}/100
    - Top spending: {', '.join([f'{cat}: Rp {amt:,}' for cat, amt in top_categories])}
    
    Budget Status:
    {json.dumps(budgets[:3], indent=2, default=str)}
    
    Provide insights in this JSON format (2-3 items only):
    [
      {{
        "emoji": "📊",
        "title": "Category Name or Insight Title",
        "body": "Short actionable insight (max 15 words)",
        "severity": "critical|warning|info",
        "priority": "high|medium|low"
      }}
    ]
    
    Be conversational, avoid jargon, and focus on what the user should DO next."""
    
    # 3. Call Claude Haiku
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )
    
    # 4. Parse response
    try:
        response_text = message.content[0].text
        # Extract JSON from response (might be wrapped in markdown)
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            insights = json.loads(json_match.group(0))
            return insights
    except Exception as e:
        print(f"Error parsing Claude response: {e}")
        return []
    
    return []
```

#### Update database operations

Add function to fetch user data for insights generation in `db/operations.py`

---

### Day 2-3: Vercel API Endpoint

#### Create `frontend/api/insights.ts`

New Vercel serverless function that:
1. Authenticates request using Supabase JWT
2. Fetches user's transactions, budgets, health metrics
3. Calls Python backend or Claude directly
4. Caches results in Supabase for 24 hours
5. Returns InsightFeedItem[]

```typescript
// frontend/api/insights.ts

import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-sdk/sdk';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // 1. Authenticate
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });
  
  // 2. Get params
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'Missing month/year' });
  
  // 3. Check cache
  const cacheKey = `insights_${user.id}_${month}_${year}`;
  const { data: cachedInsights } = await supabase
    .from('_cache')
    .select('data, expires_at')
    .eq('key', cacheKey)
    .single();
  
  if (cachedInsights && new Date(cachedInsights.expires_at) > new Date()) {
    return res.status(200).json(cachedInsights.data);
  }
  
  // 4. Fetch user data
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', `${year}-${month}-01`)
    .lt('date', `${year}-${month}-32`);
  
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)
    .eq('year', year);
  
  // 5. Call Claude for insights
  const insights = await generateInsights(transactions, budgets, month, year);
  
  // 6. Cache result
  await supabase
    .from('_cache')
    .upsert({
      key: cacheKey,
      data: insights,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  
  return res.status(200).json(insights);
}

async function generateInsights(transactions, budgets, month, year) {
  // Implementation using Claude Haiku
  // (Similar to Python version above)
}
```

---

### Day 4: Frontend Integration

#### Create `frontend/src/hooks/data/useAIInsights.ts`

New hook that fetches insights from the API:

```typescript
// frontend/src/hooks/data/useAIInsights.ts

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface AIInsight {
  emoji: string;
  title: string;
  body: string;
  severity: 'critical' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
}

export function useAIInsights(month: number, year: number): {
  insights: AIInsight[];
  loading: boolean;
  error: Error | null;
} {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/insights?month=${month}&year=${year}`
        );
        if (!response.ok) throw new Error('Failed to fetch insights');
        const data = await response.json();
        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [user?.userId, month, year]);

  return { insights, loading, error };
}
```

#### Update Overview.tsx to use API insights

Replace client-side calculations with API data:

```typescript
// In Overview.tsx
const { insights: aiInsights } = useAIInsights(month, year);

// Use aiInsights in AI Insight Feed instead of buildInsightFeed()
```

---

### Day 5: Testing

#### E2E Testing Plan

1. **Unit Tests:** insights_generator.py
   - Test with various financial scenarios
   - Verify Claude response parsing
   - Test cache logic

2. **Integration Tests:** API endpoint
   - Test authentication
   - Test cache hit/miss
   - Test error handling

3. **Frontend Tests:** Overview screen
   - Insights load correctly
   - Fallback if API fails
   - Responsive at all breakpoints

4. **Manual Testing:**
   - Verify insights are personalized
   - Check that severity mapping works
   - Test with multiple users

---

## Implementation Order

1. ✅ Phase 3 Part 1: Fix buildInsightFeed() (DONE)
2. ⏳ Create insights_generator.py (TODAY)
3. ⏳ Create frontend/api/insights.ts (TODAY)
4. ⏳ Create useAIInsights hook (TOMORROW)
5. ⏳ Update Overview.tsx to use API (TOMORROW)
6. ⏳ Build and test (DAYS 4-5)
7. ⏳ E2E testing and fixes (DAYS 6-7)

---

## API Response Format

All Claude-generated insights must return as InsightFeedItem:

```typescript
interface InsightFeedItem {
  severity: 'critical' | 'warning' | 'info';
  emoji: string;
  title: string;
  body: string;
}
```

Claude will generate with: emoji, title, body, severity, priority
Frontend will transform to InsightFeedItem and display with AIInsightCard

---

## Rollback Plan

If Claude API integration fails:
1. Fall back to client-side calculations (useFinancialHealth, useBudgetRecommendations)
2. Keep existing buildInsightFeed() as fallback
3. API errors won't break the app (graceful degradation)

---

**Status: Ready to start implementation on Day 1** 🚀
