# db/database.py

from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL      = os.getenv("DATABASE_URL")
DATABASE_URL_SYNC = os.getenv("DATABASE_URL_SYNC")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL env var is not set. "
        "Add it in Railway → Variables (postgresql+asyncpg://...)."
    )

# Supabase PgBouncer runs in transaction mode: each SQL transaction can be
# routed to a different Postgres backend. asyncpg's extended query protocol
# sends Parse (prepare) and Bind (execute) in separate Sync batches, so
# PgBouncer can send them to different backends → InvalidSQLStatementNameError.
#
# Fix 1 — NullPool: SQLAlchemy creates a brand-new asyncpg connection for
# every AsyncSessionLocal() context. No connection reuse means no stale
# prepared-statement state leaking across sessions.
#
# Fix 2 — statement_cache_size=0: asyncpg uses unnamed prepared statements
# and bundles Parse+Bind+Execute in one Sync batch, so PgBouncer routes
# them atomically to the same backend.
#
# If the error persists after deploying, switch DATABASE_URL from the
# PgBouncer port (6543) to the direct Postgres port (5432) so there is
# no statement-routing issue at all.
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    poolclass=NullPool,
    connect_args={"statement_cache_size": 0},
)

_session_factory = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


@asynccontextmanager
async def AsyncSessionLocal():
    async with _session_factory() as session:
        yield session


# Sync engine (for Streamlit dashboard)
if DATABASE_URL_SYNC:
    sync_engine = create_engine(DATABASE_URL_SYNC, pool_pre_ping=True)
else:
    sync_engine = None
    logger.warning("DATABASE_URL_SYNC not set — sync engine unavailable.")


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
