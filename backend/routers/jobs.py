from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models import AnalysisJob
from backend.schemas import JobResponse

router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse(
        job_id=job.id,
        status=job.status,
        city_name=job.city_name,
        bbox=job.bbox,
        created_at=job.created_at,
        updated_at=job.updated_at,
        error_message=job.error_message,
        result_summary=job.result_summary,
    )


@router.get("/results/{job_id}")
async def get_results(job_id: str, db: AsyncSession = Depends(get_db)):
    from backend.models import CityBlock
    from sqlalchemy import select as sa_select

    result = await db.execute(sa_select(AnalysisJob).where(AnalysisJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(status_code=202, detail=f"Job status: {job.status}")

    blocks_result = await db.execute(sa_select(CityBlock).where(CityBlock.job_id == job_id))
    blocks = blocks_result.scalars().all()

    return {
        "job_id": job_id,
        "city_name": job.city_name,
        "summary": job.result_summary,
        "blocks": [
            {
                "block_id": b.id,
                "centroid": [b.centroid_lat, b.centroid_lon],
                "geometry": b.geometry,
                "predicted_temp_c": b.predicted_temp_c,
                "baseline_temp_c": b.baseline_temp_c,
                "wind_speed_ms": b.wind_speed_ms,
                "uhi_intensity": b.uhi_intensity,
                "directives": b.directives,
                "predicted_temp_reduction_c": (
                    round(b.baseline_temp_c - b.predicted_temp_c, 2)
                    if b.baseline_temp_c and b.predicted_temp_c
                    else None
                ),
            }
            for b in blocks
        ],
    }
