"""Tests for OSM / data ingestion loader."""
import pytest
from data_ingestion.osm_loader import load_city_blocks, _synthetic_blocks


BBOX = {
    "min_lon": -74.01,
    "min_lat": 40.705,
    "max_lon": -73.99,
    "max_lat": 40.715,
}


def test_synthetic_blocks_returns_list():
    blocks = _synthetic_blocks(BBOX)
    assert isinstance(blocks, list)
    assert len(blocks) > 0


def test_synthetic_blocks_have_required_keys():
    blocks = _synthetic_blocks(BBOX)
    required = {"block_id", "centroid", "geometry", "floors", "area_m2"}
    for block in blocks:
        assert required.issubset(block.keys())


def test_synthetic_blocks_centroid_in_bbox():
    blocks = _synthetic_blocks(BBOX)
    for block in blocks:
        lat, lon = block["centroid"]
        assert BBOX["min_lat"] <= lat <= BBOX["max_lat"]
        assert BBOX["min_lon"] <= lon <= BBOX["max_lon"]


def test_load_city_blocks_falls_back_to_synthetic():
    # OSMnx may not be available in all test envs — should always return something
    blocks = load_city_blocks(BBOX)
    assert isinstance(blocks, list)
    assert len(blocks) > 0
