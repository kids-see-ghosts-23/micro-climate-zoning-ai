"""
OSM-based city block loader using OSMnx.
Downloads building footprints and street networks for a given bounding box.
"""
import uuid
from typing import List, Dict, Any


def load_city_blocks(bbox: dict) -> List[Dict[str, Any]]:
    """
    Load building footprints from OpenStreetMap for a bounding box.

    Args:
        bbox: dict with keys min_lon, min_lat, max_lon, max_lat

    Returns:
        List of block dicts with geometry and metadata
    """
    try:
        import osmnx as ox
        import geopandas as gpd

        north = bbox["max_lat"]
        south = bbox["min_lat"]
        east = bbox["max_lon"]
        west = bbox["min_lon"]

        # Download building footprints
        tags = {"building": True}
        gdf = ox.features_from_bbox(north=north, south=south, east=east, west=west, tags=tags)
        gdf = gdf[gdf.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].copy()
        gdf = gdf.to_crs(epsg=4326)

        blocks = []
        for idx, row in gdf.iterrows():
            centroid = row.geometry.centroid
            geom = row.geometry.__geo_interface__

            # Extract building height / floors if available
            floors = None
            if "building:levels" in row and row["building:levels"] is not None:
                try:
                    floors = int(row["building:levels"])
                except (ValueError, TypeError):
                    pass

            blocks.append({
                "block_id": f"B-{str(uuid.uuid4())[:8].upper()}",
                "centroid": [centroid.y, centroid.x],
                "geometry": geom,
                "floors": floors,
                "building_type": row.get("building", "yes"),
                "area_m2": _calculate_area(row.geometry),
            })

        return blocks

    except ImportError:
        # Fallback: return synthetic blocks for testing without OSMnx installed
        return _synthetic_blocks(bbox)


def _calculate_area(geom) -> float:
    """Approximate area in m2 using local projection."""
    try:
        import pyproj
        from shapely.ops import transform
        from functools import partial

        proj = pyproj.Transformer.from_crs(
            "EPSG:4326", "EPSG:3857", always_xy=True
        ).transform
        projected = transform(proj, geom)
        return round(projected.area, 2)
    except Exception:
        return 0.0


def _synthetic_blocks(bbox: dict) -> List[Dict[str, Any]]:
    """Generate a grid of synthetic blocks for testing."""
    import numpy as np

    lon_range = bbox["max_lon"] - bbox["min_lon"]
    lat_range = bbox["max_lat"] - bbox["min_lat"]
    step = min(lon_range, lat_range) / 5

    blocks = []
    lon = bbox["min_lon"]
    while lon < bbox["max_lon"]:
        lat = bbox["min_lat"]
        while lat < bbox["max_lat"]:
            block_id = f"B-{str(uuid.uuid4())[:8].upper()}"
            blocks.append({
                "block_id": block_id,
                "centroid": [lat + step / 2, lon + step / 2],
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lon, lat],
                        [lon + step, lat],
                        [lon + step, lat + step],
                        [lon, lat + step],
                        [lon, lat],
                    ]],
                },
                "floors": int(np.random.randint(1, 10)),
                "building_type": "yes",
                "area_m2": (step * 111000) ** 2,
            })
            lat += step
        lon += step

    return blocks
