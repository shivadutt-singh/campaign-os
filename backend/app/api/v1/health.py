from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)) -> Any:
    """
    Performs critical component health audits (Postgres database and Redis cache connection states).
    """
    errors = {}
    
    # 1. Test Database Connection
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        errors["database"] = f"Unreachable: {str(e)}"
        
    # 2. Test Redis Connection
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL)
        async with redis_client as client:
            await client.ping()
    except Exception as e:
        errors["redis"] = f"Unreachable: {str(e)}"
        
    if errors:
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "checks": errors}
        )
        
    return {"status": "healthy", "postgres": "ok", "redis": "ok"}


@router.get("/metrics")
def get_metrics() -> Any:
    """
    Exposes raw Prometheus metrics for infrastructure scrapers.
    """
    from fastapi.responses import Response
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
