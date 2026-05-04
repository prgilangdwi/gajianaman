# db/database.py

from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import create_engine
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

# statement_cache_size=0 disables asyncpg's own LRU cache.
# SQLAlchemy still calls asyncpg.Connection.prepare() directly for every
# parameterized query, which always creates NAMED prepared statements
# (__asyncpg_stmt_N__). PgBouncer in transaction mode keeps backend
# connections alive across app restarts, so old names persist and collide
# when the per-process counter resets to 0. Running DEALLOCATE ALL at the
# start of each session (see AsyncSessionLocal below) clears them.
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0},
)

_session_factory = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


@asynccontextmanager
async def AsyncSessionLocal():
    """Session context manager that clears stale PgBouncer prepared statements on entry.

    Uses the raw asyncpg connection to run DEALLOCATE ALL via the simple query
    protocol (no PARSE step), which cannot abort the transaction even on failure.
    session.execute(text(...)) would go through the extended protocol and a PARSE
    failure on a utility statement like DEALLOCATE would abort the transaction.
    """
    async with _session_factory() as session:
        try:
            conn = await session.connection()
            raw = await conn.get_raw_connection()
            # raw.driver_connection  → AsyncAdapt_asyncpg_connection (SQLAlchemy wrapper)
            # ._connection           → actual asyncpg.Connection
            # .execute(sql)          → simple query protocol when called with no args
            await raw.driver_connection._connection.execute("DEALLOCATE ALL")
        except Exception:
            try:
                await session.rollback()
            except Exception:
                pass
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
