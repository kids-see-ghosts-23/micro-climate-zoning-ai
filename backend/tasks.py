import uuid
import asyncio
from backend.celery_app import celery_app
from data_ingestion.osm_loader import load_city_blocks
from data_ingestion.satellite import fetch_thermal_imagery
from ai_model.pinn_inference import PINNInference
from zoning_engine.code_generator import generate_zoning_codes


@celery_app.task(bind=True, name="backend.tasks.run_analysis")
def run_analysis(self, job_id: str, bbox: dict, city_name: str = None):
    """
    Main analysis pipeline task.
    Runs: data ingestion -> PINN inference -> zoning code generation -> DB write
    """
    try:
        self.update_state(state="STARTED", meta={"step": "ingesting data"})

        # Load city block geometries from OSM
        blocks = load_city_blocks(bbox)

        self.update_state(state="PROGRESS", meta={"step": "fetching thermal imagery", "blocks": len(blocks)})

        # Fetch thermal data for the bounding box
        thermal_data = fetch_thermal_imagery(bbox)

        self.update_state(state="PROGRESS", meta={"step": "running PINN simulation"})

        # Run PINN inference
        model = PINNInference()
        predictions = model.predict(blocks, thermal_data)

        self.update_state(state="PROGRESS", meta={"step": "generating zoning codes"})

        # Generate zoning directives
        zoning_results = generate_zoning_codes(predictions)

        # Persist results
        _persist_results(job_id, zoning_results)

        return {
            "job_id": job_id,
            "status": "completed",
            "blocks_analyzed": len(zoning_results),
            "directives_generated": sum(len(r["directives"]) for r in zoning_results),
        }

    except Exception as exc:
        self.update_state(state="FAILURE", meta={"error": str(exc)})
        _mark_job_failed(job_id, str(exc))
        raise


def _persist_results(job_id: str, results: list):
    """Write results to DB synchronously (called from Celery worker)."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from backend.config import settings
    from backend.models import AnalysisJob, CityBlock, JobStatus

    sync_url = settings.db_url.replace("+asyncpg", "")
    engine = create_engine(sync_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
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
                directives=[d.dict() if hasattr(d, "dict") else d for d in block.get("directives", [])],
            )
            session.merge(db_block)

        job = session.query(AnalysisJob).filter_by(id=job_id).first()
        if job:
            job.status = JobStatus.completed
            job.result_summary = {
                "blocks_analyzed": len(results),
                "directives_generated": sum(len(b.get("directives", [])) for b in results),
            }
        session.commit()
    finally:
        session.close()
        engine.dispose()


def _mark_job_failed(job_id: str, error: str):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from backend.config import settings
    from backend.models import AnalysisJob, JobStatus

    sync_url = settings.db_url.replace("+asyncpg", "")
    engine = create_engine(sync_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        job = session.query(AnalysisJob).filter_by(id=job_id).first()
        if job:
            job.status = JobStatus.failed
            job.error_message = error
            session.commit()
    finally:
        session.close()
        engine.dispose()
