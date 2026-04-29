# db/operations.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import date


async def ensure_user(session: AsyncSession, user_id: int, name: str, username: str):
    await session.execute(
        text("""
            INSERT INTO users (user_id, name, username)
            VALUES (:user_id, :name, :username)
            ON CONFLICT (user_id) DO NOTHING
        """),
        {"user_id": user_id, "name": name, "username": username}
    )
    await session.commit()


async def insert_transaction(
    session: AsyncSession,
    user_id: int,
    amount: float,
    tx_type: str,
    category: str,
    subcategory: str,
    note: str,
    confidence: str,
    tx_date: date = None
):
    result = await session.execute(
        text("""
            INSERT INTO transactions (user_id, amount, type, category, subcategory, note, ai_confidence, date)
            VALUES (:user_id, :amount, :type, :category, :subcategory, :note, :confidence, :date)
            RETURNING id
        """),
        {
            "user_id": user_id,
            "amount": amount,
            "type": tx_type,
            "category": category,
            "subcategory": subcategory,
            "note": note,
            "confidence": confidence,
            "date": tx_date or date.today()
        }
    )
    await session.commit()
    return result.scalar()


async def get_monthly_summary(session: AsyncSession, user_id: int, month: int, year: int):
    result = await session.execute(
        text("""
            SELECT category, SUM(amount) as total, COUNT(*) as count
            FROM transactions
            WHERE user_id = :user_id
              AND type = 'expense'
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
            GROUP BY category
            ORDER BY total DESC
        """),
        {"user_id": user_id, "month": month, "year": year}
    )
    return result.fetchall()


async def get_monthly_income(session: AsyncSession, user_id: int, month: int, year: int):
    result = await session.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = :user_id
              AND type = 'income'
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
        """),
        {"user_id": user_id, "month": month, "year": year}
    )
    return result.scalar() or 0


async def get_last_transactions(session: AsyncSession, user_id: int, limit: int = 10):
    result = await session.execute(
        text("""
            SELECT amount, type, category, note, date
            FROM transactions
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit
        """),
        {"user_id": user_id, "limit": limit}
    )
    return result.fetchall()


async def upsert_budget(session: AsyncSession, user_id: int, category: str, amount: float, month: int, year: int):
    await session.execute(
        text("""
            INSERT INTO budgets (user_id, category, amount, month, year)
            VALUES (:user_id, :category, :amount, :month, :year)
            ON CONFLICT (user_id, category, month, year)
            DO UPDATE SET amount = EXCLUDED.amount
        """),
        {"user_id": user_id, "category": category, "amount": amount, "month": month, "year": year}
    )
    await session.commit()


async def get_budget_vs_actual(session: AsyncSession, user_id: int, month: int, year: int):
    result = await session.execute(
        text("""
            SELECT
                b.category,
                b.amount as budget,
                COALESCE(SUM(t.amount), 0) as actual
            FROM budgets b
            LEFT JOIN transactions t
                ON t.user_id = b.user_id
                AND t.category = b.category
                AND t.type = 'expense'
                AND EXTRACT(MONTH FROM t.date) = b.month
                AND EXTRACT(YEAR FROM t.date) = b.year
            WHERE b.user_id = :user_id
              AND b.month = :month
              AND b.year = :year
            GROUP BY b.category, b.amount
        """),
        {"user_id": user_id, "month": month, "year": year}
    )
    return result.fetchall()


async def get_goals(session: AsyncSession, user_id: int):
    result = await session.execute(
        text("SELECT name, target_amount, saved_amount, deadline FROM goals WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    return result.fetchall()


async def upsert_goal(session: AsyncSession, user_id: int, name: str, target: float, deadline: str = None):
    await session.execute(
        text("""
            INSERT INTO goals (user_id, name, target_amount, deadline)
            VALUES (:user_id, :name, :target, :deadline)
        """),
        {"user_id": user_id, "name": name, "target": target, "deadline": deadline}
    )
    await session.commit()
