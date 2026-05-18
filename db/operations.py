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
            "items": json.dumps(items) if items else None,
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


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN OPERATIONS (Section 2: License & Admin Access)
# ─────────────────────────────────────────────────────────────────────────────


async def is_admin(session: AsyncSession, user_id: int) -> bool:
    """Check if user has admin privileges"""
    result = await session.execute(
        text("SELECT is_admin FROM users WHERE user_id = :uid"),
        {"uid": user_id}
    )
    row = result.fetchone()
    return bool(row[0]) if row else False


async def set_admin(session: AsyncSession, user_id: int, is_admin_flag: bool) -> dict:
    """Grant or revoke admin privileges"""
    result = await session.execute(
        text("""
            UPDATE users SET is_admin = :is_admin
            WHERE user_id = :uid
            RETURNING user_id, is_admin, email
        """),
        {"uid": user_id, "is_admin": is_admin_flag}
    )
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else {}


async def set_admin_by_email(session: AsyncSession, email: str, is_admin_flag: bool) -> dict:
    """Grant or revoke admin privileges by email address"""
    result = await session.execute(
        text("""
            UPDATE users SET is_admin = :is_admin
            WHERE email = :email
            RETURNING user_id, is_admin, email
        """),
        {"email": email, "is_admin": is_admin_flag}
    )
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else {}


async def log_admin_action(
    session: AsyncSession,
    admin_user_id: int,
    action: str,
    affected_user_id: int = None,
    details: dict = None
) -> dict:
    """Log an admin action for audit trail"""
    result = await session.execute(
        text("""
            INSERT INTO admin_audit_log (admin_user_id, action, affected_user_id, details)
            VALUES (:admin_user_id, :action, :affected_user_id, :details)
            RETURNING id, admin_user_id, action, affected_user_id, created_at
        """),
        {
            "admin_user_id": admin_user_id,
            "action": action,
            "affected_user_id": affected_user_id,
            "details": json.dumps(details) if details else None
        }
    )
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else {}


async def get_admin_audit_log(session: AsyncSession, limit: int = 50, offset: int = 0) -> list:
    """Retrieve admin audit log"""
    result = await session.execute(
        text("""
            SELECT id, admin_user_id, action, affected_user_id, details, created_at
            FROM admin_audit_log
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"limit": limit, "offset": offset}
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def get_user_by_email(session: AsyncSession, email: str) -> dict | None:
    """Get user by email address"""
    result = await session.execute(
        text("""
            SELECT user_id, name, email, is_admin, tier, created_at
            FROM users WHERE email = :email
        """),
        {"email": email}
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def get_all_admins(session: AsyncSession) -> list:
    """Get all users with admin privileges"""
    result = await session.execute(
        text("""
            SELECT user_id, name, email, is_admin, created_at
            FROM users WHERE is_admin = true
            ORDER BY created_at
        """)
    )
    return [dict(row._mapping) for row in result.fetchall()]


# ─────────────────────────────────────────────────────────────────────────────
# TRANSACTION ANALYSIS & DATA STRUCTURE (Section 4)
# ─────────────────────────────────────────────────────────────────────────────


async def get_netting_summary(
    session: AsyncSession,
    user_id: int,
    year: int = None,
    month: int = None,
    category: str = None
) -> dict | None:
    """Get net income - expense summary (netting analysis)"""
    query = """
        SELECT
          category,
          DATE_TRUNC('month', date)::DATE as month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
          SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_amount,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE user_id = :user_id
          AND type IN ('income', 'expense')
    """

    params = {"user_id": user_id}

    if category:
        query += " AND category = :category"
        params["category"] = category

    if year and month:
        query += " AND EXTRACT(YEAR FROM date) = :year AND EXTRACT(MONTH FROM date) = :month"
        params["year"] = year
        params["month"] = month

    query += " GROUP BY category, DATE_TRUNC('month', date) ORDER BY month DESC"

    result = await session.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]


async def get_multi_month_comparison(
    session: AsyncSession,
    user_id: int,
    category: str = None,
    months: int = 6
) -> list:
    """Get multi-month trend comparison for category or all"""
    query = f"""
        WITH monthly_data AS (
          SELECT
            category,
            DATE_TRUNC('month', date)::DATE as month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
          FROM transactions
          WHERE user_id = :user_id
            AND date >= CURRENT_DATE - INTERVAL '{months} months'
            {f"AND category = :category" if category else ""}
          GROUP BY category, DATE_TRUNC('month', date)
        )
        SELECT
          *,
          LAG(expense) OVER (PARTITION BY category ORDER BY month) as prev_month_expense,
          LAG(net) OVER (PARTITION BY category ORDER BY month) as prev_month_net
        FROM monthly_data
        ORDER BY category, month DESC
    """

    params = {"user_id": user_id}
    if category:
        params["category"] = category

    result = await session.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]


async def detect_recurring_patterns(
    session: AsyncSession,
    user_id: int,
    category: str = None,
    min_occurrences: int = 3
) -> list:
    """Detect recurring transaction patterns (same amount/merchant within date ranges)"""
    query = f"""
        WITH recurring_candidates AS (
          SELECT
            category,
            amount,
            merchant_name,
            COUNT(*) as occurrence_count,
            AVG(amount) as avg_amount,
            STDDEV(amount) as amount_stddev,
            MAX(date) as last_date,
            MIN(date) as first_date,
            MAX(date) - MIN(date) as date_range_days
          FROM transactions
          WHERE user_id = :user_id
            AND merchant_name IS NOT NULL
            {f"AND category = :category" if category else ""}
          GROUP BY category, amount, merchant_name
          HAVING COUNT(*) >= :min_occurrences
        )
        SELECT
          *,
          CASE
            WHEN occurrence_count >= 12 THEN 'monthly'
            WHEN occurrence_count >= 4 THEN 'quarterly'
            WHEN occurrence_count >= 2 THEN 'biweekly'
            ELSE 'unknown'
          END as likely_frequency
        FROM recurring_candidates
        ORDER BY occurrence_count DESC
    """

    params = {"user_id": user_id, "min_occurrences": min_occurrences}
    if category:
        params["category"] = category

    result = await session.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]


async def get_transaction_aggregates(
    session: AsyncSession,
    user_id: int,
    period: str = 'monthly',
    category: str = None,
    year: int = None,
    month: int = None
) -> list:
    """Get aggregated transaction statistics by period"""
    query = f"""
        SELECT
          category,
          type,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          STDDEV(amount) as volatility
        FROM transactions
        WHERE user_id = :user_id
          {f"AND category = :category" if category else ""}
          {f"AND EXTRACT(YEAR FROM date) = :year" if year else ""}
          {f"AND EXTRACT(MONTH FROM date) = :month" if month else ""}
        GROUP BY category, type
        ORDER BY total_amount DESC NULLS LAST
    """

    params = {"user_id": user_id}
    if category:
        params["category"] = category
    if year:
        params["year"] = year
    if month:
        params["month"] = month

    result = await session.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]


async def update_transaction_metadata(
    session: AsyncSession,
    transaction_id: int,
    merchant_name: str = None,
    payment_method: str = None,
    receipt_url: str = None,
    custom_properties: dict = None
) -> dict:
    """Update transaction with additional metadata"""
    updates = []
    params = {"tx_id": transaction_id}

    if merchant_name is not None:
        updates.append("merchant_name = :merchant_name")
        params["merchant_name"] = merchant_name

    if payment_method is not None:
        updates.append("payment_method = :payment_method")
        params["payment_method"] = payment_method

    if receipt_url is not None:
        updates.append("receipt_url = :receipt_url")
        params["receipt_url"] = receipt_url

    if custom_properties is not None:
        updates.append("custom_properties = :custom_properties")
        params["custom_properties"] = json.dumps(custom_properties)

    if not updates:
        return {}

    query = f"UPDATE transactions SET {', '.join(updates)} WHERE id = :tx_id RETURNING *"
    result = await session.execute(text(query), params)
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else {}


# ── Subscription Management ────────────────────────────────────────────────────

async def set_subscription_plan(
    session: AsyncSession,
    user_id: int,
    plan: str,
    expires_at: str = None
) -> dict:
    """Update user's subscription plan and expiry date"""
    result = await session.execute(
        text("""
            UPDATE users
            SET subscription_plan = :plan,
                subscription_expires_at = :expires_at
            WHERE user_id = :user_id
            RETURNING user_id, subscription_plan, subscription_expires_at
        """),
        {"user_id": user_id, "plan": plan, "expires_at": expires_at}
    )
    await session.commit()
    row = result.fetchone()
    return dict(row._mapping) if row else {}


async def confirm_payment(
    session: AsyncSession,
    user_id: int,
    plan: str,
    period: str,
    price_paid: float,
    payment_ref: str,
    expires_at: str
) -> dict:
    """Record a successful payment in subscriptions audit log and update user plan"""
    result = await session.execute(
        text("""
            INSERT INTO subscriptions (user_id, plan, period, price_paid, payment_ref, expires_at, is_active)
            VALUES (:user_id, :plan, :period, :price_paid, :payment_ref, :expires_at, true)
            RETURNING id, user_id, plan, expires_at, started_at
        """),
        {
            "user_id": user_id,
            "plan": plan,
            "period": period,
            "price_paid": price_paid,
            "payment_ref": payment_ref,
            "expires_at": expires_at
        }
    )
    subscription = dict(result.fetchone()._mapping) if result.fetchone() else None

    if subscription:
        await set_subscription_plan(session, user_id, plan, expires_at)

    return subscription


async def check_subscription_expiry(session: AsyncSession, user_id: int) -> dict:
    """Check if user's subscription has expired; return plan status"""
    result = await session.execute(
        text("""
            SELECT
              subscription_plan,
              subscription_expires_at,
              CASE
                WHEN subscription_expires_at IS NULL THEN 'unlimited'
                WHEN subscription_expires_at > NOW() THEN 'active'
                ELSE 'expired'
              END as status,
              EXTRACT(DAY FROM (subscription_expires_at - NOW())) as days_left
            FROM users
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    )
    row = result.fetchone()
    return dict(row._mapping) if row else {"subscription_plan": "gratis", "status": "active"}


async def get_subscription_history(
    session: AsyncSession,
    user_id: int,
    limit: int = 10
) -> list:
    """Get payment history for a user"""
    result = await session.execute(
        text("""
            SELECT
              id,
              plan,
              period,
              price_paid,
              payment_ref,
              started_at,
              expires_at,
              is_active
            FROM subscriptions
            WHERE user_id = :user_id
            ORDER BY started_at DESC
            LIMIT :limit
        """),
        {"user_id": user_id, "limit": limit}
    )
    return [dict(row._mapping) for row in result.fetchall()]
