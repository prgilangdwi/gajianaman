// frontend/api/insights.ts
// Vercel serverless function to generate personalized financial insights using Claude Haiku
// Endpoint: GET /api/insights?month=5&year=2026

import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';
import { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
});

interface AIInsight {
  emoji: string;
  title: string;
  body: string;
  severity: 'critical' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate using Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: invalid token format' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: invalid token' });
    }

    // 2. Get month and year from query params
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Missing month or year parameter' });
    }

    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);

    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid month or year' });
    }

    // 3. Check cache in Supabase
    const cacheKey = `insights_${user.id}_${monthNum}_${yearNum}`;
    const { data: cachedInsights, error: cacheError } = await supabase
      .from('_cache')
      .select('data, expires_at')
      .eq('key', cacheKey)
      .single();

    if (!cacheError && cachedInsights) {
      const expiresAt = new Date(cachedInsights.expires_at);
      if (expiresAt > new Date()) {
        // Cache hit
        return res.status(200).json(cachedInsights.data as AIInsight[]);
      }
    }

    // 4. Cache miss — fetch user financial data
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${yearNum}-${String(monthNum).padStart(2, '0')}-01`)
      .lte('date', `${yearNum}-${String(monthNum).padStart(2, '0')}-31`)
      .order('date', { ascending: false });

    if (txError || !transactions) {
      console.error('Transaction fetch error:', txError);
      return res.status(200).json([]);
    }

    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', monthNum)
      .eq('year', yearNum);

    if (budgetError || !budgets) {
      console.error('Budget fetch error:', budgetError);
    }

    // 5. Analyze financial data
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const net = income - expenses;
    const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : '0';

    // Top spending categories
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
      });

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, total]) => `- ${cat}: Rp ${Math.round(total).toLocaleString('id-ID')}`)
      .join('\n');

    // Budget status
    const budgetStatus = (budgets || [])
      .map(b => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === b.category)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
        const status = pct <= 100 ? '✅' : '⚠️';
        return `- ${b.category}: Rp ${Math.round(spent).toLocaleString('id-ID')} / Rp ${b.amount.toLocaleString('id-ID')} (${pct}%) ${status}`;
      })
      .join('\n') || 'No budgets set';

    // 6. Call Claude Haiku to generate insights
    const prompt = `Analyze this Indonesian user's financial situation for ${monthNum}/${yearNum} and provide 2-3 SHORT, ACTIONABLE insights in Indonesian. Be specific, personal, and helpful.

Financial Summary:
- Total Income: Rp ${Math.round(income).toLocaleString('id-ID')}
- Total Expenses: Rp ${Math.round(expenses).toLocaleString('id-ID')}
- Net Savings: Rp ${Math.round(net).toLocaleString('id-ID')}
- Savings Rate: ${savingsRate}%

Top Spending Categories:
${topCategories}

Budget Status:
${budgetStatus}

IMPORTANT:
1. Provide exactly 2-3 insights in valid JSON array format
2. Each insight must have: emoji (single character), title (short), body (max 15 words), severity (critical|warning|info), priority (high|medium|low)
3. Severity guide:
   - critical: Over budget, major spending spike, savings goal at risk
   - warning: Trending over budget, moderate velocity, savings rate below 10%
   - info: Positive trends, good habits, helpful observations
4. Be conversational and avoid jargon
5. Focus on what the user should DO next
6. Return ONLY valid JSON array, no markdown, no text before/after

Example:
[
  {"emoji": "⚠️", "title": "Pengeluaran Meningkat", "body": "Belanja bulan ini 15% lebih dari minggu lalu.", "severity": "warning", "priority": "high"},
  {"emoji": "✅", "title": "Hemat Rutin", "body": "Anda konsisten nabung setiap minggu sejak 2 bulan.", "severity": "info", "priority": "medium"}
]`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // 7. Parse response
    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const insights = parseInsightsJson(rawText);

    // 8. Cache result for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('_cache').upsert({
      key: cacheKey,
      data: insights,
      expires_at: expiresAt,
    });

    return res.status(200).json(insights);

  } catch (error) {
    console.error('Insights API error:', error);
    // Return empty array on error to prevent frontend breakage
    return res.status(200).json([]);
  }
}

function parseInsightsJson(rawText: string): AIInsight[] {
  try {
    // Strip markdown fences if present
    let cleaned = rawText;
    if (rawText.includes('```')) {
      const parts = rawText.split('```');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('[')) {
          cleaned = trimmed;
          break;
        }
      }
    }

    const insights: AIInsight[] = JSON.parse(cleaned);

    // Validate structure and return max 3 insights
    return insights
      .filter(
        (i): i is AIInsight =>
          typeof i === 'object' &&
          typeof i.emoji === 'string' &&
          typeof i.title === 'string' &&
          typeof i.body === 'string' &&
          ['critical', 'warning', 'info'].includes(i.severity) &&
          ['high', 'medium', 'low'].includes(i.priority)
      )
      .slice(0, 3);
  } catch (e) {
    console.error('Failed to parse insights JSON:', e);
    return [];
  }
}
