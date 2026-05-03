# db/database.py

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

# Async engine (for bot)
# statement_cache_size=0 is required for Supabase/PgBouncer in transaction pooling mode
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0},
)
AsyncSessionLocal = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

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
