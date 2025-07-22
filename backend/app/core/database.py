"""
Gestión de base de datos y sesiones
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator
import redis.asyncio as aioredis

from app.core.config import settings

# Base para modelos SQLAlchemy
Base = declarative_base()

# Engine síncrono (para migraciones)
sync_engine = create_engine(
    settings.database_url.replace("postgresql://", "postgresql://"),
    echo=settings.is_development,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Engine asíncrono (para la aplicación)
async_engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.is_development,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Redis connection
redis_client = None

async def get_redis() -> aioredis.Redis:
    """
    Obtener conexión a Redis
    """
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    return redis_client

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para obtener sesión de base de datos
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def get_sync_db() -> Session:
    """
    Obtener sesión síncrona (para migraciones)
    """
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

async def init_db():
    """
    Inicializar base de datos - crear tablas
    """
    async with async_engine.begin() as conn:
        # En desarrollo, recrear tablas
        if settings.is_development:
            await conn.run_sync(Base.metadata.drop_all)
        
        await conn.run_sync(Base.metadata.create_all)

async def close_db():
    """
    Cerrar conexiones de base de datos
    """
    if redis_client:
        await redis_client.close()
    
    await async_engine.dispose()
