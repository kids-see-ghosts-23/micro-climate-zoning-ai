import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models import AnalysisJob, JobStatus
from backend.schemas import AnalyzeRequest, AnalyzeResponse, SimulateRequest
from backend.tasks import run_analysis

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    job_id = str(uuid.uuid4())

    job = AnalysisJob(
        id=job_id,
        status=JobStatus.pending,
        bbox=request.bbox.model_dump(),
        city_name=request.city_name,
    )
    db.add(job)
    await db.commit()

    # Dispatch to Celery
    run_analysis.apply_async(
        args=[job_id, request.bbox.model_dump(), request.city_name],
        task_id=job_id,
    )

    return AnalyzeResponse(job_id=job_id, status=JobStatus.pending, message="Analysis job queued.")


@router.post("/simulate")
async def simulate(request: SimulateRequest):
    """
    Run a quick single-scenario wind/heat simulation without persisting to DB.
    Returns raw PINN predictions for the given bounding box and environmental conditions.
    """
    from data_ingestion.osm_loader import load_city_blocks
    from ai_model.pinn_inference import PINNInference

    blocks = load_city_blocks(request.bbox.model_dump())
    model = PINNInference()
    predictions = model.predict(
        blocks,
        thermal_data=None,
        wind_speed=request.wind_speed_ms,
        wind_dir=request.wind_direction_deg,
        ambient_temp=request.ambient_temp_c,
        solar_rad=request.solar_radiation_wm2,
    )
    return {"blocks": len(predictions), "predictions": predictions[:10]}  # cap preview
