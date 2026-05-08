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

# NullPool disables SQLAlchemy's own connection pool entirely.
# Supabase routes through PgBouncer in transaction mode, which does not
# support named prepared statements. With SQLAlchemy's default pool,
# reused connections carry stale statement names and collide on the next
# request. NullPool creates a fresh asyncpg connection per session and
# delegates all pooling to PgBouncer, which is designed for this.
# statement_cache_size=0 turns off asyncpg's own prepared-statement LRU
# so no Parse messages with named statements are ever sent.
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
