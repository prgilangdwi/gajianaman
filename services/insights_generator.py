# services/insights_generator.py
# Uses Claude Haiku to generate personalized financial insights
# Async service — call from Vercel API endpoints or scheduled jobs

import anthropic
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession

from db import operations as db

load_dotenv()

anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

INSIGHTS_PROMPT_TEMPLATE = """Analyze this Indonesian user's financial situation for {month}/{year} and provide 2-3 SHORT, ACTIONABLE insights in Indonesian. Be specific, personal, and helpful.

Financial Summary:
- Total Income: Rp {income:,}
- Total Expenses: Rp {expenses:,}
- Net Savings: Rp {net:,}
- Budget Adherence: {budget_adherence}%
- Savings Rate: {savings_rate}%
- Financial Health Score: {health_score}/100

Top Spending Categories:
{top_categories}

Budget Status:
{budget_status}

Spending Anomalies:
{anomalies}

IMPORTANT:
1. Provide exactly 2-3 insights in valid JSON array format
2. Each insight must have: emoji (single character), title (short), body (max 15 words), severity (critical|warning|info), priority (high|medium|low)
3. Severity guide:
   - critical: Over budget, major spending spike, savings goal at risk
   - warning: Trending over budget, moderate velocity, budget adherence below 70%
   - info: Positive trends, good habits, helpful observations
4. Be conversational and avoid jargon
5. Focus on what the user should DO next
6. Return ONLY valid JSON array, no markdown, no text before/after

Example format:
[
  {{"emoji": "⚠️", "title": "Pengeluaran Meningkat", "body": "Belanja bulan ini 15% lebih dari minggu lalu.", "severity": "warning", "priority": "high"}},
  {{"emoji": "✅", "title": "Hemat Rutin", "body": "Anda konsisten nabung setiap minggu sejak 2 bulan.", "severity": "info", "priority": "medium"}}
]"""


async def generate_ai_insights(
    session: AsyncSession,
    user_id: int,
    month: int,
    year: int,
) -> list[dict]:
    """
    Generate personalized financial insights using Claude Haiku.

    Args:
        session: SQLAlchemy async session
        user_id: User ID
        month: Month number (1-12)
        year: Year number

    Returns:
        List of insight dicts: {emoji, title, body, severity, priority}
        Empty list if generation fails
    """
    try:
        # 1. Fetch financial data
        monthly_summary = await db.get_monthly_summary(session, user_id, month, year)
        if not monthly_summary:
            return []

        income, expenses = monthly_summary[0], monthly_summary[1]
        net = income - expenses

        # Get transactions for detailed analysis
        transactions = await db.get_transactions_by_month(session, user_id, month, year, limit=200)
        if not transactions:
            return []

        # Get budget vs actual
        budget_data = await db.get_budget_vs_actual(session, user_id, month, year)

        # 2. Calculate metrics
        budget_adherence = _calculate_budget_adherence(budget_data)
        savings_rate = _calculate_savings_rate(income, expenses) if income > 0 else 0
        health_score = _calculate_health_score(income, expenses, budget_adherence, savings_rate)

        # 3. Analyze spending patterns
        top_categories = _get_top_categories(transactions)
        budget_status = _format_budget_status(budget_data)
        anomalies = _detect_anomalies(transactions, month, year)

        # 4. Build context for Claude
        prompt = INSIGHTS_PROMPT_TEMPLATE.format(
            month=month,
            year=year,
            income=int(income),
            expenses=int(expenses),
            net=int(net),
            budget_adherence=int(budget_adherence),
            savings_rate=int(savings_rate),
            health_score=int(health_score),
            top_categories=_format_top_categories(top_categories),
            budget_status=budget_status,
            anomalies=anomalies or "No significant anomalies detected."
        )

        # 5. Call Claude Haiku
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # 6. Parse response
        raw_text = response.content[0].text.strip()
        insights = _parse_insights_json(raw_text)

        return insights if insights else []

    except Exception as e:
        print(f"Error generating AI insights: {e}")
        return []


def _calculate_budget_adherence(budget_data: list) -> float:
    """Calculate what % of budget was used across all categories."""
    if not budget_data:
        return 0.0

    total_budget = 0.0
    total_actual = 0.0

    for row in budget_data:
        # Assuming budget_data rows: (category, budget_amount, actual_spent)
        if len(row) >= 3:
            budget, actual = row[1], row[2]
            total_budget += budget if budget else 0
            total_actual += actual if actual else 0

    if total_budget == 0:
        return 0.0

    return min(100.0, (total_actual / total_budget) * 100)


def _calculate_savings_rate(income: float, expenses: float) -> float:
    """Calculate savings as % of income."""
    if income <= 0:
        return 0.0
    return ((income - expenses) / income) * 100


def _calculate_health_score(income: float, expenses: float, budget_adherence: float, savings_rate: float) -> int:
    """
    Calculate overall financial health score (0-100).
    Factors: expense ratio, budget discipline, savings rate.
    """
    score = 50  # baseline

    # Income coverage (max +30 points)
    if income > 0:
        expense_ratio = expenses / income
        if expense_ratio < 0.7:
            score += 30
        elif expense_ratio < 0.85:
            score += 20
        elif expense_ratio < 1.0:
            score += 10

    # Budget adherence (max +20 points)
    if budget_adherence < 100:
        score += int(20 * (1 - (budget_adherence / 100)))

    # Savings rate (max +15 points)
    if savings_rate > 0.2:  # 20%+
        score += 15
    elif savings_rate > 0.1:  # 10%+
        score += 10
    elif savings_rate > 0:
        score += 5

    return min(100, max(0, int(score)))


def _get_top_categories(transactions: list) -> list[tuple]:
    """Get top 3 expense categories by total amount."""
    category_totals = {}

    for tx in transactions:
        if len(tx) >= 4:  # Assuming: (id, user_id, amount, type, category, ...)
            tx_type, category, amount = tx[3], tx[4], tx[2]
            if tx_type == "expense":
                if category not in category_totals:
                    category_totals[category] = 0.0
                category_totals[category] += amount

    sorted_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    return sorted_cats[:3]


def _format_top_categories(top_cats: list[tuple]) -> str:
    """Format top categories for the prompt."""
    if not top_cats:
        return "No expense data available."

    lines = []
    for cat, total in top_cats:
        lines.append(f"- {cat}: Rp {int(total):,}")
    return "\n".join(lines)


def _format_budget_status(budget_data: list) -> str:
    """Format budget vs actual status for the prompt."""
    if not budget_data:
        return "No budget data set."

    lines = []
    for row in budget_data:
        if len(row) >= 3:
            category, budget, actual = row[0], row[1], row[2]
            if budget and actual is not None:
                pct = (actual / budget) * 100 if budget > 0 else 0
                status = "✅ On track" if pct <= 100 else "⚠️ Over budget"
                lines.append(f"- {category}: Rp {int(actual):,} / Rp {int(budget):,} ({int(pct)}%) {status}")

    return "\n".join(lines) if lines else "No budget data set."


def _detect_anomalies(transactions: list, month: int, year: int) -> str:
    """Detect unusual spending patterns (large single transactions, category spikes)."""
    if not transactions or len(transactions) < 2:
        return ""

    # Get all expense amounts
    expenses = [tx[2] for tx in transactions if len(tx) >= 4 and tx[3] == "expense"]

    if not expenses:
        return ""

    avg = sum(expenses) / len(expenses)
    max_expense = max(expenses)

    anomalies = []

    # Single large transaction
    if max_expense > avg * 2:
        anomalies.append(f"Satu transaksi besar: Rp {int(max_expense):,} (2x rata-rata)")

    # Category velocity check
    category_counts = {}
    for tx in transactions:
        if len(tx) >= 5 and tx[3] == "expense":
            cat = tx[4]
            category_counts[cat] = category_counts.get(cat, 0) + 1

    high_freq_cats = [cat for cat, count in category_counts.items() if count > 15]
    if high_freq_cats:
        anomalies.append(f"Kategori tinggi frekuensi: {', '.join(high_freq_cats[:2])}")

    return "\n".join([f"- {a}" for a in anomalies]) if anomalies else ""


def _parse_insights_json(raw_text: str) -> list[dict]:
    """Extract and parse JSON array from Claude response."""
    try:
        # Strip markdown fences if present
        if "```" in raw_text:
            parts = raw_text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("["):
                    raw_text = part
                    break

        # Parse JSON
        insights = json.loads(raw_text)

        # Validate structure
        if not isinstance(insights, list):
            return []

        valid_insights = []
        for insight in insights:
            if isinstance(insight, dict) and all(k in insight for k in ["emoji", "title", "body", "severity", "priority"]):
                # Validate severity and priority values
                if insight["severity"] in ["critical", "warning", "info"] and insight["priority"] in ["high", "medium", "low"]:
                    valid_insights.append(insight)

        return valid_insights[:3]  # Max 3 insights

    except json.JSONDecodeError as e:
        print(f"Failed to parse insights JSON: {e}")
        return []
