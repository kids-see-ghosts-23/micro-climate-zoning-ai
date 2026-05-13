# Micro-Climate Zoning AI

An AI system that analyzes hyperlocal urban heat islands and wind dynamics to automatically generate block-by-block zoning codes, optimizing city layouts for maximum natural cooling.

Instead of static grid zoning, this system treats the city as a living thermodynamic system — ingesting real spatial data, running Physics-Informed Neural Networks to simulate wind and heat flow, and outputting actionable legislative zoning logic.

---

## Architecture Overview

```
Raw Data (LIDAR, Satellite, OSM)
        |
        v
Data Ingestion Layer (GEE, OSMnx, PostGIS)
        |
        v
AI + Physics Simulation (NVIDIA Modulus / PINNs, trained on OpenFOAM CFD data)
        |
        v
Backend API (FastAPI + Celery + Redis)
        |
        v
3D Visualization Frontend (deck.gl + React)
```

---

## Stack

| Layer | Technology |
|---|---|
| Spatial Data | Google Earth Engine, OSMnx, PostgreSQL + PostGIS |
| AI / Simulation | NVIDIA Modulus (PINNs), PyTorch, JAX, OpenFOAM |
| Backend | FastAPI, Celery, Redis |
| Frontend | deck.gl, CesiumJS, React |

---

## Project Structure

```
micro-climate-zoning-ai/
├── data_ingestion/         # GEE, OSMnx, satellite thermal data pipelines
├── simulation/             # OpenFOAM baseline CFD config and scripts
├── ai_model/               # PINN model (NVIDIA Modulus / PyTorch)
├── backend/                # FastAPI app, Celery workers, Redis config
├── frontend/               # React + deck.gl dashboard
├── zoning_engine/          # Legislative code generation logic
├── docker/                 # Docker + docker-compose configs
├── tests/                  # Unit and integration tests
├── docs/                   # Architecture diagrams and API docs
└── requirements.txt
```

---

## Quickstart

### Prerequisites
- Docker + Docker Compose
- Python 3.10+
- Node.js 18+

### Run with Docker

```bash
git clone https://github.com/kids-see-ghosts-23/micro-climate-zoning-ai.git
cd micro-climate-zoning-ai
cp .env.example .env
docker-compose up --build
```

- API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`

### Run Locally (Dev)

```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# Task worker
celery -A backend.celery_app worker --loglevel=info
```

---

## Core Concepts

### Physics-Informed Neural Networks (PINNs)
Traditional CFD (Computational Fluid Dynamics) simulations via OpenFOAM take hours to days per city block. PINNs encode the governing equations (Navier-Stokes for wind, heat diffusion equations for thermal behavior) directly into the neural network's loss function. This enables near-instant inference once trained, reducing simulation time from days to seconds.

### Urban Heat Island (UHI) Effect
Cities run 1-3°C warmer than surrounding rural areas during the day and up to 7°C warmer at night. Primary drivers: dark impervious surfaces (low albedo), reduced vegetation (less evapotranspiration), urban canyon geometry trapping heat, and waste heat from vehicles and HVAC systems.

### Zoning Output Format
The model does not just produce heat maps. It generates structured zoning directives:

```json
{
  "block_id": "B-047",
  "centroid": [40.7128, -74.0060],
  "directives": [
    {
      "code": "HEIGHT-MAX-3",
      "reason": "Maintain eastern wind corridor at street level",
      "max_stories": 3
    },
    {
      "code": "GREEN-ROOF-60",
      "reason": "Disrupt local heat accumulation from impervious surfaces",
      "green_roof_coverage_pct": 60
    }
  ],
  "predicted_temp_reduction_c": 2.3
}
```

---

## Data Sources

- **Satellite Thermal**: Landsat 8/9 Band 10 (TIRS), Sentinel-3 SLSTR via Google Earth Engine
- **Building Geometry**: OpenStreetMap 3D buildings via OSMnx + LIDAR point clouds
- **Weather**: NOAA ISD weather station data, ERA5 reanalysis
- **Material Properties**: NLCD land cover + custom albedo lookup tables

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/analyze` | Submit city bounding box for analysis |
| GET | `/api/v1/jobs/{job_id}` | Poll simulation job status |
| GET | `/api/v1/results/{job_id}` | Retrieve zoning directives and heat map |
| GET | `/api/v1/blocks/{block_id}` | Get detailed analysis for a specific block |
| POST | `/api/v1/simulate` | Run custom wind/heat scenario |

---

## Development

### Running Tests
```bash
pytest tests/ -v
```

### Environment Variables
See `.env.example` for all required variables including GEE credentials, PostGIS connection string, and Redis URL.

---

## License
MIT
