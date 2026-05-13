import uuid
import asyncio
import traceback
import logging
from datetime import datetime, date
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db, AsyncSessionLocal
from backend.models import AnalysisJob, CityBlock
from backend.schemas import AnalyzeRequest, AnalyzeResponse, SimulateRequest, JobStatus

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    try:
        job_id = str(uuid.uuid4())

        # Default to today if no date provided
        analysis_date = request.analysis_date or date.today().isoformat()

        job = AnalysisJob(
            id=job_id,
            status="pending",
            bbox=request.bbox.model_dump(),
            city_name=request.city_name,
            analysis_date=analysis_date,
        )
        db.add(job)
        await db.commit()

        background_tasks.add_task(
            _run_analysis,
            job_id,
            request.bbox.model_dump(),
            request.city_name,
            analysis_date,
        )
        return AnalyzeResponse(job_id=job_id, status=JobStatus.pending, message="Analysis job queued.")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


async def _run_analysis(job_id: str, bbox: dict, city_name: str = None, analysis_date: str = None):
    async with AsyncSessionLocal() as db:
        try:
            job = await db.get(AnalysisJob, job_id)
            job.status = "running"
            await db.commit()

            from data_ingestion.osm_loader import load_city_blocks
            from data_ingestion.satellite import fetch_thermal_imagery
            from ai_model.pinn_inference import PINNInference
            from zoning_engine.code_generator import generate_zoning_codes

            loop = asyncio.get_running_loop()

            blocks = await loop.run_in_executor(None, load_city_blocks, bbox)
            logger.info(f"Loaded {len(blocks)} blocks for {city_name} on {analysis_date}")

            # Pass date range to satellite fetcher
            thermal = await loop.run_in_executor(
                None, fetch_thermal_imagery, bbox, _date_to_range(analysis_date)
            )
            logger.info(f"Thermal: {thermal.get('source')} mean={thermal.get('mean_temp_c')}°C")

            model = PINNInference()
            predictions = await loop.run_in_executor(None, model.predict, blocks, thermal)
            results = await loop.run_in_executor(None, generate_zoning_codes, predictions)

            for block in results:
                db.add(CityBlock(
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
                ))

            job = await db.get(AnalysisJob, job_id)
            job.status = "completed"
            job.result_summary = {
                "blocks_analyzed": len(results),
                "directives_generated": sum(len(b.get("directives", [])) for b in results),
                "analysis_date": analysis_date,
                "thermal_source": thermal.get("source"),
                "mean_temp_c": thermal.get("mean_temp_c"),
            }
            await db.commit()
            logger.info(f"Job {job_id} completed — {len(results)} blocks")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            traceback.print_exc()
            try:
                job = await db.get(AnalysisJob, job_id)
                if job:
                    job.status = "failed"
                    job.error_message = str(e)
                    await db.commit()
            except Exception:
                pass


def _date_to_range(analysis_date: str):
    """Convert a single date string to a 30-day window for satellite imagery."""
    try:
        d = datetime.strptime(analysis_date, "%Y-%m-%d")
        # Use a 30-day window ending on that date to maximize chance of cloud-free imagery
        from datetime import timedelta
        start = d - timedelta(days=30)
        return (start.strftime("%Y-%m-%d"), d.strftime("%Y-%m-%d"))
    except Exception:
        return ("2023-06-01", "2023-08-31")


@router.post("/simulate")
async def simulate(request: SimulateRequest):
    from data_ingestion.osm_loader import load_city_blocks
    from ai_model.pinn_inference import PINNInference
    loop = asyncio.get_running_loop()
    blocks = await loop.run_in_executor(None, load_city_blocks, request.bbox.model_dump())
    model = PINNInference()
    predictions = await loop.run_in_executor(None, model.predict, blocks, None)
    return {"blocks": len(predictions), "predictions": predictions[:10]}
