# Micro-Climate Zoning AI

An AI system that analyzes hyperlocal urban heat islands and wind dynamics to automatically generate block-by-block zoning codes, optimizing city layouts for maximum natural cooling.

Instead of static grid zoning, this system treats the city as a living thermodynamic system — ingesting real spatial data, running Physics-Informed Neural Networks to simulate wind and heat flow, and outputting actionable legislative zoning logic.

---

## Quickstart (No Docker needed)

### Prerequisites
- [Python 3.10+](https://python.org)
- [Node.js 18+](https://nodejs.org)

### Windows

```bat
# 1. Clone the repo
git clone https://github.com/kids-see-ghosts-23/micro-climate-zoning-ai.git
cd micro-climate-zoning-ai

# 2. Run setup (only once)
setup.bat

# 3. Start the app
start.bat
```

Then open:
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

### Mac / Linux

```bash
git clone https://github.com/kids-see-ghosts-23/micro-climate-zoning-ai.git
cd micro-climate-zoning-ai

# Install Python deps
python3 -m venv venv && source venv/bin/activate
pip install -r requirements-dev.txt

# Start API (terminal 1)
python run.py

# Start frontend (terminal 2)
cd frontend && npm install && npm run dev
```

---

## How to Use

1. Open http://localhost:5173
2. Enter a city name and bounding box (default is New York)
3. Click **Run Analysis**
4. The map populates with 3D blocks colored by UHI intensity (green = cool, red = hot)
5. Click any block to see its generated zoning directives

---

## Architecture Overview

```
Raw Data (OSM Buildings + Satellite Thermal)
        |
        v
Data Ingestion (OSMnx + synthetic GEE fallback)
        |
        v
PINN Inference (physics-based heuristic + trained model support)
        |
        v
Zoning Code Generator (HEIGHT-MAX, GREEN-ROOF, ALBEDO-MIN, TREE-CANOPY)
        |
        v
FastAPI Backend (SQLite, BackgroundTasks)
        |
        v
React + deck.gl Frontend (3D UHI heatmap)
```

---

## Stack

| Layer | Technology |
|---|---|
| Spatial Data | OSMnx, synthetic thermal fallback (GEE when configured) |
| AI / Simulation | PINN (PyTorch), physics heuristic fallback, OpenFOAM CFD support |
| Backend | FastAPI, SQLAlchemy, SQLite (aiosqlite) |
| Frontend | React, deck.gl, MapLibre GL |

---

## Project Structure

```
micro-climate-zoning-ai/
├── run.py                  # One-command API launcher
├── setup.bat               # Windows setup script
├── start.bat               # Windows start script
├── requirements-dev.txt    # Minimal Python deps (no Docker/Redis/Postgres)
├── data_ingestion/         # OSMnx + satellite thermal pipelines
├── ai_model/               # PINN model + inference + trainer
├── simulation/             # OpenFOAM CFD config and runner
├── zoning_engine/          # Zoning directive generator + exporters
├── backend/                # FastAPI app, routes, models, schemas
├── frontend/               # React + deck.gl dashboard
├── tests/                  # Test suite
└── docs/                   # Architecture docs
```

---

## Zoning Directive Examples

```json
{
  "block_id": "B-047A3F",
  "uhi_intensity": 3.2,
  "directives": [
    {
      "code": "GREEN-ROOF-60",
      "reason": "UHI intensity of 3.2°C exceeds threshold. Mandating 60% green roof coverage.",
      "green_roof_coverage_pct": 60
    },
    {
      "code": "HEIGHT-MAX-4",
      "reason": "Wind speed at 1.2 m/s. Restricting to 4 stories to maintain wind corridor.",
      "max_stories": 4
    }
  ]
}
```

---

## Core Concepts

### Physics-Informed Neural Networks (PINNs)
Traditional CFD (OpenFOAM) takes hours per city block. PINNs encode Navier-Stokes and heat diffusion equations directly into the loss function, enabling near-instant inference once trained. Falls back to physics heuristics until a checkpoint is trained.

### Urban Heat Island (UHI) Effect
Cities run 1–3°C warmer than surrounding rural areas during the day and up to 7°C warmer at night due to dark impervious surfaces, reduced vegetation, and urban canyon geometry trapping heat.

---

## License
MIT
