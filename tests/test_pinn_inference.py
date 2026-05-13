"""Tests for PINN inference engine."""
import pytest
from ai_model.pinn_inference import PINNInference


SAMPLE_BLOCKS = [
    {
        "block_id": "B-TEST01",
        "centroid": [40.71, -74.00],
        "geometry": {"type": "Polygon", "coordinates": []},
        "floors": 5,
        "area_m2": 6000,
    },
    {
        "block_id": "B-TEST02",
        "centroid": [40.72, -74.01],
        "geometry": {"type": "Polygon", "coordinates": []},
        "floors": 2,
        "area_m2": 3000,
    },
]

THERMAL_DATA = {
    "source": "synthetic",
    "mean_temp_c": 32.0,
    "std_temp_c": 2.5,
    "min_temp_c": 27.0,
    "max_temp_c": 37.0,
}


def test_inference_returns_all_blocks():
    model = PINNInference()
    results = model.predict(SAMPLE_BLOCKS, THERMAL_DATA)
    assert len(results) == len(SAMPLE_BLOCKS)


def test_inference_adds_temp_fields():
    model = PINNInference()
    results = model.predict(SAMPLE_BLOCKS, THERMAL_DATA)
    for r in results:
        assert "predicted_temp_c" in r
        assert "baseline_temp_c" in r
        assert "wind_speed_ms" in r
        assert "uhi_intensity" in r


def test_inference_temp_is_numeric():
    model = PINNInference()
    results = model.predict(SAMPLE_BLOCKS, THERMAL_DATA)
    for r in results:
        assert isinstance(r["predicted_temp_c"], (int, float))
        assert isinstance(r["wind_speed_ms"], (int, float))


def test_inference_wind_is_positive():
    model = PINNInference()
    results = model.predict(SAMPLE_BLOCKS, THERMAL_DATA)
    for r in results:
        assert r["wind_speed_ms"] >= 0


def test_inference_handles_no_thermal_data():
    model = PINNInference()
    results = model.predict(SAMPLE_BLOCKS, None, ambient_temp=28.0)
    assert len(results) == len(SAMPLE_BLOCKS)
    for r in results:
        assert r["predicted_temp_c"] is not None
