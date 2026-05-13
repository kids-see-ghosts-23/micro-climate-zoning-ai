from pydantic import BaseModel, Field
from typing import List, Optional, Any
from enum import Enum


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class BoundingBox(BaseModel):
    min_lon: float
    min_lat: float
    max_lon: float
    max_lat: float


class AnalyzeRequest(BaseModel):
    bbox: BoundingBox
    city_name: Optional[str] = None
    analysis_date: Optional[str] = None  # YYYY-MM-DD, defaults to latest available


class ZoningDirective(BaseModel):
    code: str
    reason: str
    max_stories: Optional[int] = None
    green_roof_coverage_pct: Optional[float] = None
    albedo_min: Optional[float] = None
    extra: Optional[dict] = None


class BlockResult(BaseModel):
    block_id: str
    centroid: List[float]
    geometry: dict
    predicted_temp_c: Optional[float]
    baseline_temp_c: Optional[float]
    wind_speed_ms: Optional[float]
    uhi_intensity: Optional[float]
    directives: List[ZoningDirective]
    predicted_temp_reduction_c: Optional[float]


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    city_name: Optional[str]
    bbox: dict
    analysis_date: Optional[str]
    created_at: Optional[Any]
    updated_at: Optional[Any]
    error_message: Optional[str]
    result_summary: Optional[dict]


class AnalyzeResponse(BaseModel):
    job_id: str
    status: JobStatus
    message: str


class SimulateRequest(BaseModel):
    bbox: BoundingBox
    wind_speed_ms: float = 3.0
    wind_direction_deg: float = 270.0
    ambient_temp_c: float = 30.0
    solar_radiation_wm2: float = 800.0
