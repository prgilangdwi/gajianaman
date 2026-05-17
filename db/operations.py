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
    tx_date: date = None,
    wallet_id: str = None
):
    result = await session.execute(
        text("""
            INSERT INTO transactions (user_id, amount, type, category, subcategory, note, ai_confidence, date, wallet_id)
            VALUES (:user_id, :amount, :type, :category, :subcategory, :note, :confidence, :date, :wallet_id)
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
            "date": tx_date or date.today(),
            "wallet_id": wallet_id
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


# ── Wallet operations ─────────────────────────────────────────────────────────

async def get_wallets(session: AsyncSession, user_id: int) -> list:
    result = await session.execute(
        text("SELECT id, user_id, name, type, icon, is_primary, initial_balance, created_at "
             "FROM wallets WHERE user_id = :uid ORDER BY is_primary DESC, created_at ASC"),
        {"uid": user_id}
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def create_wallet(
    session: AsyncSession,
    user_id: int,
    name: str,
    wallet_type: str,
    is_primary: bool = False,
    initial_balance: float = 0.0
) -> dict:
    result = await session.execute(
        text("""
            INSERT INTO wallets (user_id, name, type, is_primary, initial_balance)
            VALUES (:uid, :name, :type, :primary, :balance)
            RETURNING id, user_id, name, type, icon, is_primary, initial_balance, created_at
        """),
        {"uid": user_id, "name": name, "type": wallet_type,
         "primary": is_primary, "balance": initial_balance}
    )
    await session.commit()
    return dict(result.fetchone()._mapping)


async def get_wallet_by_name(session: AsyncSession, user_id: int, name_fragment: str) -> dict | None:
    """Case-insensitive partial match — used by bot wallet= parsing."""
    result = await session.execute(
        text("SELECT id, name, type FROM wallets "
             "WHERE user_id = :uid AND LOWER(name) LIKE LOWER(:frag) LIMIT 1"),
        {"uid": user_id, "frag": f"%{name_fragment}%"}
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def get_transactions_by_wallet(
    session: AsyncSession,
    user_id: int,
    wallet_id: str,
    month: int,
    year: int
) -> list:
    result = await session.execute(
        text("""
            SELECT id, amount, type, category, note, date
            FROM transactions
            WHERE user_id = :uid
              AND wallet_id = :wid
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
            ORDER BY date DESC
        """),
        {"uid": user_id, "wid": wallet_id, "month": month, "year": year}
    )
    return [dict(row._mapping) for row in result.fetchall()]


# ── Subscription operations ───────────────────────────────────────────────────

async def get_user_subscription_plan(session: AsyncSession, user_id: int) -> str:
    result = await session.execute(
        text("SELECT subscription_plan FROM users WHERE user_id = :uid"),
        {"uid": user_id}
    )
    row = result.fetchone()
    return (row[0] if row else None) or 'gratis'


async def update_user_subscription(
    session: AsyncSession,
    user_id: int,
    plan: str,
    expires_at: str
) -> None:
    await session.execute(
        text("""
            UPDATE users
            SET subscription_plan = :plan, subscription_expires_at = :expires
            WHERE user_id = :uid
        """),
        {"plan": plan, "expires": expires_at, "uid": user_id}
    )
    await session.commit()


async def create_subscription_record(
    session: AsyncSession,
    user_id: int,
    plan: str,
    period: str,
    price_paid: float,
    expires_at: str,
    payment_ref: str | None = None
) -> dict:
    result = await session.execute(
        text("""
            INSERT INTO subscriptions (user_id, plan, period, price_paid, expires_at, payment_ref)
            VALUES (:uid, :plan, :period, :price, :expires, :ref)
            RETURNING id, plan, period, started_at, expires_at
        """),
        {"uid": user_id, "plan": plan, "period": period,
         "price": price_paid, "expires": expires_at, "ref": payment_ref}
    )
    await session.commit()
    return dict(result.fetchone()._mapping)


# ── Gajian / Risk Profile operations ─────────────────────────────────────────

async def save_payday_date(session: AsyncSession, user_id: int, payday_date: int) -> None:
    await session.execute(
        text("UPDATE users SET payday_date = :day WHERE user_id = :uid"),
        {"day": payday_date, "uid": user_id}
    )
    await session.commit()


async def save_risk_profile(session: AsyncSession, user_id: int, profile: dict) -> None:
    import json
    await session.execute(
        text("UPDATE users SET risk_profile = :profile::jsonb WHERE user_id = :uid"),
        {"profile": json.dumps(profile), "uid": user_id}
    )
    await session.commit()


async def save_ai_budget_recommendation(session: AsyncSession, user_id: int, recommendation: dict) -> None:
    import json
    from datetime import datetime, timezone
    recommendation['generated_at'] = datetime.now(timezone.utc).isoformat()
    await session.execute(
        text("UPDATE users SET ai_budget_recommendation = :rec::jsonb WHERE user_id = :uid"),
        {"rec": json.dumps(recommendation), "uid": user_id}
    )
    await session.commit()


async def get_payday_users(session: AsyncSession, day: int) -> list:
    """Returns users whose payday_date matches today's day of month."""
    result = await session.execute(
        text("SELECT user_id, name FROM users WHERE payday_date = :day"),
        {"day": day}
    )
    return [dict(row._mapping) for row in result.fetchall()]


# ── Split Bill operations ─────────────────────────────────────────────────────

async def create_split_bill(
    session: AsyncSession,
    user_id: int,
    session_name: str,
    total_amount: float,
    participants: list,
    items: list | None = None
) -> dict:
    import json
    result = await session.execute(
        text("""
            INSERT INTO split_bills (user_id, session_name, total_amount, participants, items)
            VALUES (:uid, :name, :total, :participants::jsonb, :items::jsonb)
            RETURNING id, share_token, session_name, total_amount, participants, items, created_at
        """),
        {
            "uid": user_id,
            "name": session_name,
            "total": total_amount,
            "participants": json.dumps(participants),
            "items": json.dumps(items) if items else "null",
        }
    )
    await session.commit()
    return dict(result.fetchone()._mapping)


async def get_split_bill_by_token(session: AsyncSession, token: str) -> dict | None:
    result = await session.execute(
        text("""
            SELECT id, session_name, total_amount, participants, items, share_token, created_at
            FROM split_bills WHERE share_token = :token
        """),
        {"token": token}
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def get_split_bill_history(session: AsyncSession, user_id: int, limit: int = 10) -> list:
    result = await session.execute(
        text("""
            SELECT id, session_name, total_amount, share_token, created_at
            FROM split_bills WHERE user_id = :uid
            ORDER BY created_at DESC LIMIT :limit
        """),
        {"uid": user_id, "limit": limit}
    )
    return [dict(row._mapping) for row in result.fetchall()]
