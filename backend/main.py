from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from backend.database import init_db
# Models must be imported before init_db so SQLAlchemy registers them
import backend.models  # noqa: F401
from backend.routers import analysis, jobs, blocks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Micro-Climate Zoning AI",
    description="AI-powered block-by-block urban zoning code generation using Physics-Informed Neural Networks",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api/v1", tags=["analysis"])
app.include_router(jobs.router, prefix="/api/v1", tags=["jobs"])
app.include_router(blocks.router, prefix="/api/v1", tags=["blocks"])


@app.get("/health")
async def health():
    return {"status": "ok"}
