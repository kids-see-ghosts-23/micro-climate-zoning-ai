# Architecture

## Data Flow

```
1. User submits bounding box via /api/v1/analyze
2. FastAPI creates an AnalysisJob record (status: pending) and returns job_id
3. Celery worker picks up the task:
   a. data_ingestion/osm_loader.py -> downloads OSM building footprints
   b. data_ingestion/satellite.py  -> fetches Landsat thermal imagery via GEE
   c. ai_model/pinn_inference.py   -> runs PINN predictions per block
   d. zoning_engine/code_generator.py -> generates legislative directives
   e. Results written to city_blocks table, job status -> completed
4. Frontend polls /api/v1/jobs/{job_id} until completed
5. Frontend fetches /api/v1/results/{job_id} -> renders 3D deck.gl map
```

## PINN Architecture

- Input features: (x, y, z, building_density, albedo) — 5D
- Output: (u_wind, v_wind, w_wind, T_surface) — 4D
- Network: 8-layer residual MLP, 128 hidden units, Tanh activations
- Loss: L_total = L_data + 0.1 * L_physics
  - L_data: MSE against OpenFOAM CFD ground truth
  - L_physics: Navier-Stokes continuity + momentum residuals + heat advection-diffusion

## Zoning Directive Logic

| Condition | Directive |
|---|---|
| wind < 1.5 m/s | HEIGHT-MAX-N (restrict stories) |
| wind < 2.5 m/s AND floors > 5 | SETBACK-UPPER-FLOORS |
| UHI > 2.5°C | GREEN-ROOF-40 |
| UHI > 4.0°C | GREEN-ROOF-60 |
| UHI > 2.5°C OR area > 7000m2 | ALBEDO-MIN-0.45 |
| UHI > 2.5°C AND wind < 2.5 m/s | TREE-CANOPY-30PCT |
| area > 7000m2 AND floors > 6 | VERTICAL-GARDEN-FACADE |
| None triggered | COMPLIANT |
