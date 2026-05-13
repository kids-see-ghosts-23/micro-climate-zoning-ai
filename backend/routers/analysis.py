import uuid
import asyncio
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models import AnalysisJob, CityBlock
from backend.schemas import AnalyzeRequest, AnalyzeResponse, SimulateRequest
from backend.schemas import JobStatus

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    job_id = str(uuid.uuid4())

    job = AnalysisJob(
        id=job_id,
        status="pending",
        bbox=request.bbox.model_dump(),
        city_name=request.city_name,
    )
    db.add(job)
    await db.commit()

    # Run in background (no Celery needed)
    background_tasks.add_task(_run_analysis, job_id, request.bbox.model_dump(), request.city_name)

    return AnalyzeResponse(job_id=job_id, status=JobStatus.pending, message="Analysis job queued.")


async def _run_analysis(job_id: str, bbox: dict, city_name: str = None):
    from backend.database import AsyncSessionLocal
    from data_ingestion.osm_loader import load_city_blocks
    from data_ingestion.satellite import fetch_thermal_imagery
    from ai_model.pinn_inference import PINNInference
    from zoning_engine.code_generator import generate_zoning_codes

    async with AsyncSessionLocal() as db:
        try:
            # Mark running
            job = await db.get(AnalysisJob, job_id)
            job.status = "running"
            await db.commit()

            # Run pipeline in thread pool to avoid blocking the event loop
            loop = asyncio.get_event_loop()

            blocks = await loop.run_in_executor(None, load_city_blocks, bbox)
            thermal = await loop.run_in_executor(None, fetch_thermal_imagery, bbox)

            model = PINNInference()
            predictions = await loop.run_in_executor(None, model.predict, blocks, thermal)
            results = await loop.run_in_executor(None, generate_zoning_codes, predictions)

            # Persist blocks
            for block in results:
                db_block = CityBlock(
                    id=block["block_id"],
                    job_id=job_id,
                    centroid_lat=block["centroid"][0],
                    centroid_lon=block["centroid"][1],
                    geometry=block["geometry"],
                    predicted_temp_c=block.get("predicted_temp_c"),
                    baseline_temp_c=block.get("baseline_temp_c"),
                    wind_speed_ms=block.get("wind_speed_ms"),
                    uhi_intensity=block.get("uhi_intensity"),
                    directives=block.get("directives", []),
                )
                db.add(db_block)

            job = await db.get(AnalysisJob, job_id)
            job.status = "completed"
            job.result_summary = {
                "blocks_analyzed": len(results),
                "directives_generated": sum(len(b.get("directives", [])) for b in results),
            }
            await db.commit()

        except Exception as e:
            async with AsyncSessionLocal() as err_db:
                job = await err_db.get(AnalysisJob, job_id)
                if job:
                    job.status = "failed"
                    job.error_message = str(e)
                    await err_db.commit()


@router.post("/simulate")
async def simulate(request: SimulateRequest):
    from data_ingestion.osm_loader import load_city_blocks
    from ai_model.pinn_inference import PINNInference
    import asyncio

    loop = asyncio.get_event_loop()
    blocks = await loop.run_in_executor(None, load_city_blocks, request.bbox.model_dump())
    model = PINNInference()
    predictions = await loop.run_in_executor(
        None, model.predict, blocks, None,
    )
    return {"blocks": len(predictions), "predictions": predictions[:10]}
