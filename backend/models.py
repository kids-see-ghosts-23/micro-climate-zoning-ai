from sqlalchemy import Column, String, Float, Integer, JSON, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
import enum
from backend.database import Base


class JobStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String, primary_key=True)
    status = Column(SAEnum(JobStatus), default=JobStatus.pending, nullable=False)
    bbox = Column(JSON, nullable=False)  # [min_lon, min_lat, max_lon, max_lat]
    city_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    error_message = Column(String, nullable=True)
    result_summary = Column(JSON, nullable=True)


class CityBlock(Base):
    __tablename__ = "city_blocks"

    id = Column(String, primary_key=True)
    job_id = Column(String, nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    geometry = Column(JSON, nullable=False)  # GeoJSON polygon
    predicted_temp_c = Column(Float, nullable=True)
    baseline_temp_c = Column(Float, nullable=True)
    wind_speed_ms = Column(Float, nullable=True)
    uhi_intensity = Column(Float, nullable=True)
    directives = Column(JSON, nullable=True)  # list of zoning directive objects
    created_at = Column(DateTime(timezone=True), server_default=func.now())
