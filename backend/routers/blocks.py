from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models import CityBlock

router = APIRouter()


@router.get("/blocks/{block_id}")
async def get_block(block_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CityBlock).where(CityBlock.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    return {
        "block_id": block.id,
        "job_id": block.job_id,
        "centroid": [block.centroid_lat, block.centroid_lon],
        "geometry": block.geometry,
        "predicted_temp_c": block.predicted_temp_c,
        "baseline_temp_c": block.baseline_temp_c,
        "wind_speed_ms": block.wind_speed_ms,
        "uhi_intensity": block.uhi_intensity,
        "directives": block.directives,
        "predicted_temp_reduction_c": (
            round(block.baseline_temp_c - block.predicted_temp_c, 2)
            if block.baseline_temp_c and block.predicted_temp_c
            else None
        ),
        "created_at": block.created_at,
    }
