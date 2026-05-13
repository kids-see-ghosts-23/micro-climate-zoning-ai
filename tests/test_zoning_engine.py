"""Tests for zoning code generator."""
import pytest
from zoning_engine.code_generator import generate_zoning_codes, THRESHOLDS


def make_block(uhi=1.0, wind=3.0, floors=4, area_m2=4000):
    return {
        "block_id": "B-TEST01",
        "centroid": [40.71, -74.00],
        "geometry": {"type": "Polygon", "coordinates": []},
        "floors": floors,
        "area_m2": area_m2,
        "predicted_temp_c": 30.0 + uhi,
        "baseline_temp_c": 30.0,
        "wind_speed_ms": wind,
        "uhi_intensity": uhi,
    }


def test_compliant_block():
    blocks = [make_block(uhi=0.5, wind=4.0)]
    results = generate_zoning_codes(blocks)
    assert len(results) == 1
    codes = [d["code"] for d in results[0]["directives"]]
    assert "COMPLIANT" in codes


def test_high_uhi_triggers_green_roof():
    blocks = [make_block(uhi=3.0, wind=4.0)]
    results = generate_zoning_codes(blocks)
    codes = [d["code"] for d in results[0]["directives"]]
    assert any(c.startswith("GREEN-ROOF") for c in codes)


def test_critical_uhi_triggers_60pct_green_roof():
    blocks = [make_block(uhi=5.0, wind=4.0)]
    results = generate_zoning_codes(blocks)
    directives = results[0]["directives"]
    green_roof = next((d for d in directives if d["code"] == "GREEN-ROOF-60"), None)
    assert green_roof is not None
    assert green_roof["green_roof_coverage_pct"] == 60


def test_low_wind_triggers_height_limit():
    blocks = [make_block(uhi=0.5, wind=1.0, floors=8)]
    results = generate_zoning_codes(blocks)
    codes = [d["code"] for d in results[0]["directives"]]
    assert any(c.startswith("HEIGHT-MAX") for c in codes)


def test_height_limit_is_below_current_floors():
    blocks = [make_block(uhi=0.5, wind=1.0, floors=8)]
    results = generate_zoning_codes(blocks)
    height_directive = next(
        (d for d in results[0]["directives"] if d["code"].startswith("HEIGHT-MAX")), None
    )
    assert height_directive is not None
    assert height_directive["max_stories"] < 8


def test_multiple_directives_high_uhi_low_wind():
    blocks = [make_block(uhi=3.5, wind=1.2, floors=6, area_m2=9000)]
    results = generate_zoning_codes(blocks)
    codes = [d["code"] for d in results[0]["directives"]]
    assert len(codes) >= 3


def test_directives_have_reasons():
    blocks = [make_block(uhi=3.0, wind=1.0)]
    results = generate_zoning_codes(blocks)
    for d in results[0]["directives"]:
        assert "reason" in d
        assert len(d["reason"]) > 10


def test_batch_processing():
    blocks = [make_block(uhi=i * 0.8, wind=4 - i * 0.5, floors=i + 2) for i in range(10)]
    results = generate_zoning_codes(blocks)
    assert len(results) == 10
    for r in results:
        assert "directives" in r
        assert len(r["directives"]) >= 1
