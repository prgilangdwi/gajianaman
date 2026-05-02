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


async def get_user(session: AsyncSession, user_id: int):
    result = await session.execute(
        text("SELECT user_id, name FROM users WHERE user_id = :user_id"),
        {"user_id": user_id}
    )
    return result.fetchone()


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


async def get_last_transaction(session: AsyncSession, user_id: int):
    result = await session.execute(
        text("""
            SELECT id, amount, type, category, note
            FROM transactions
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"user_id": user_id}
    )
    return result.fetchone()


async def delete_transaction(session: AsyncSession, tx_id: int, user_id: int):
    await session.execute(
        text("DELETE FROM transactions WHERE id = :id AND user_id = :user_id"),
        {"id": tx_id, "user_id": user_id}
    )
    await session.commit()


async def update_transaction_category(session: AsyncSession, tx_id: int, category: str):
    await session.execute(
        text("UPDATE transactions SET category = :category WHERE id = :id"),
        {"category": category, "id": tx_id}
    )
    await session.commit()


async def get_today_stats(session: AsyncSession, user_id: int):
    result = await session.execute(
        text("""
            SELECT
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense,
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
                COUNT(*) as tx_count
            FROM transactions
            WHERE user_id = :user_id AND date = :today
        """),
        {"user_id": user_id, "today": date.today()}
    )
    return result.fetchone()


async def check_budget_alert(session: AsyncSession, user_id: int, category: str, month: int, year: int):
    result = await session.execute(
        text("""
            SELECT b.amount as budget, COALESCE(SUM(t.amount), 0) as actual
            FROM budgets b
            LEFT JOIN transactions t
                ON t.user_id = b.user_id
                AND t.category = b.category
                AND t.type = 'expense'
                AND EXTRACT(MONTH FROM t.date) = b.month
                AND EXTRACT(YEAR FROM t.date) = b.year
            WHERE b.user_id = :user_id AND b.category = :category
              AND b.month = :month AND b.year = :year
            GROUP BY b.amount
        """),
        {"user_id": user_id, "category": category, "month": month, "year": year}
    )
    return result.fetchone()


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


async def get_daily_summary(session: AsyncSession, user_id: int, target_date: date):
    result = await session.execute(
        text("""
            SELECT category, SUM(amount) as total, COUNT(*) as count
            FROM transactions
            WHERE user_id = :user_id
              AND type = 'expense'
              AND date = :target_date
            GROUP BY category
            ORDER BY total DESC
        """),
        {"user_id": user_id, "target_date": target_date}
    )
    return result.fetchall()


async def get_daily_income(session: AsyncSession, user_id: int, target_date: date):
    result = await session.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = :user_id
              AND type = 'income'
              AND date = :target_date
        """),
        {"user_id": user_id, "target_date": target_date}
    )
    return result.scalar() or 0


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


async def get_last_transactions(session: AsyncSession, user_id: int, limit: int = 20):
    result = await session.execute(
        text("""
            SELECT id, amount, type, category, note, date
            FROM transactions
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit
        """),
        {"user_id": user_id, "limit": limit}
    )
    return result.fetchall()


async def get_transactions_by_month(session: AsyncSession, user_id: int, month: int, year: int, limit: int = 20):
    result = await session.execute(
        text("""
            SELECT id, amount, type, category, note, date
            FROM transactions
            WHERE user_id = :user_id
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
            ORDER BY date DESC, id DESC
            LIMIT :limit
        """),
        {"user_id": user_id, "month": month, "year": year, "limit": limit}
    )
    return result.fetchall()


async def get_transactions_by_date(session: AsyncSession, user_id: int, target_date: date):
    result = await session.execute(
        text("""
            SELECT id, amount, type, category, note, date
            FROM transactions
            WHERE user_id = :user_id AND date = :target_date
            ORDER BY id DESC
        """),
        {"user_id": user_id, "target_date": target_date}
    )
    return result.fetchall()


async def get_transaction_by_id(session: AsyncSession, tx_id: int, user_id: int):
    result = await session.execute(
        text("""
            SELECT id, amount, type, category, note, date
            FROM transactions
            WHERE id = :id AND user_id = :user_id
        """),
        {"id": tx_id, "user_id": user_id}
    )
    return result.fetchone()


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
        text("SELECT id, name, target_amount, saved_amount, deadline FROM goals WHERE user_id = :user_id"),
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


async def add_to_savings_goal(session: AsyncSession, goal_id: int, user_id: int, amount: float):
    await session.execute(
        text("""
            UPDATE goals
            SET saved_amount = saved_amount + :amount
            WHERE id = :goal_id AND user_id = :user_id
        """),
        {"goal_id": goal_id, "user_id": user_id, "amount": amount}
    )
    await session.commit()


async def get_hourly_transaction_count(session: AsyncSession, user_id: int) -> int:
    result = await session.execute(
        text("""
            SELECT COUNT(*) as cnt
            FROM transactions
            WHERE user_id = :user_id
              AND created_at >= NOW() - INTERVAL '1 hour'
        """),
        {"user_id": user_id}
    )
    row = result.fetchone()
    return int(row.cnt) if row else 0
