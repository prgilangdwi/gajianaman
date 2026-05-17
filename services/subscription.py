# services/subscription.py
# Plan-based feature gating with MVP override.
# To activate real gating when Midtrans is live: set MVP_OVERRIDE = False

from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

MVP_OVERRIDE = True  # All features free while payment is not set up

PLAN_FEATURES: dict[str, dict[str, object]] = {
    'gratis': {
        'max_wallets': 0,
        'split_bill_monthly': 0,
        'ai_features': False,
        'download_csv': False,
        'budget_categories': 3,
        'calendar': False,
    },
    'starter': {
        'max_wallets': 3,
        'split_bill_monthly': 5,
        'ai_features': True,
        'download_csv': True,
        'budget_categories': -1,  # unlimited
        'calendar': True,
    },
    'pro': {
        'max_wallets': -1,
        'split_bill_monthly': -1,
        'ai_features': True,
        'download_csv': True,
        'budget_categories': -1,
        'calendar': True,
    },
}


async def get_user_plan(session: AsyncSession, user_id: int) -> str:
    result = await session.execute(
        text("SELECT subscription_plan FROM users WHERE user_id = :uid"),
        {"uid": user_id}
    )
    row = result.fetchone()
    return (row[0] if row else None) or 'gratis'


async def check_feature_access(session: AsyncSession, user_id: int, feature: str) -> bool:
    """Returns True if the user can access the feature.

    While MVP_OVERRIDE is True, always returns True regardless of plan.
    """
    if MVP_OVERRIDE:
        return True
    plan = await get_user_plan(session, user_id)
    features = PLAN_FEATURES.get(plan, PLAN_FEATURES['gratis'])
    value = features.get(feature, False)
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value != 0  # -1 = unlimited, 0 = blocked, N = limited
    return False


def get_plan_limit(plan: str, feature: str) -> object:
    """Get the raw limit value for a feature. -1 means unlimited, 0 means blocked."""
    return PLAN_FEATURES.get(plan, PLAN_FEATURES['gratis']).get(feature, 0)
