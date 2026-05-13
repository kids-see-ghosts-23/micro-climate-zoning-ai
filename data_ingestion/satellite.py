"""
Satellite thermal imagery ingestion via Google Earth Engine.
Falls back to synthetic data if GEE credentials are not configured.
"""
from typing import Dict, Any, Optional
import os


def fetch_thermal_imagery(bbox: dict, date_range: tuple = ("2023-06-01", "2023-08-31")) -> Dict[str, Any]:
    """
    Fetch Landsat 8 TIRS Band 10 surface temperature data for a bounding box.

    Args:
        bbox: dict with min_lon, min_lat, max_lon, max_lat
        date_range: (start_date, end_date) in YYYY-MM-DD format

    Returns:
        dict with thermal metadata and pixel statistics
    """
    gee_key = os.getenv("GEE_KEY_FILE")
    gee_project = os.getenv("GEE_PROJECT")

    if gee_key and gee_project and os.path.exists(gee_key):
        return _fetch_from_gee(bbox, date_range, gee_key, gee_project)
    else:
        return _synthetic_thermal(bbox)


def _fetch_from_gee(bbox: dict, date_range: tuple, key_file: str, project: str) -> Dict[str, Any]:
    try:
        import ee

        credentials = ee.ServiceAccountCredentials(
            os.getenv("GEE_SERVICE_ACCOUNT"), key_file
        )
        ee.Initialize(credentials, project=project)

        region = ee.Geometry.Rectangle([
            bbox["min_lon"], bbox["min_lat"],
            bbox["max_lon"], bbox["max_lat"]
        ])

        # Landsat 8 Collection 2 Level 2 - Band ST_B10 = Surface Temperature
        collection = (
            ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            .filterDate(date_range[0], date_range[1])
            .filterBounds(region)
            .select(["ST_B10"])
            .map(lambda img: img.multiply(0.00341802).add(149.0).subtract(273.15))  # Kelvin to Celsius
        )

        mean_image = collection.mean()
        stats = mean_image.reduceRegion(
            reducer=ee.Reducer.mean().combine(
                ee.Reducer.stdDev(), sharedInputs=True
            ).combine(
                ee.Reducer.minMax(), sharedInputs=True
            ),
            geometry=region,
            scale=30,
            maxPixels=1e9,
        ).getInfo()

        return {
            "source": "landsat8_gee",
            "bbox": bbox,
            "date_range": date_range,
            "mean_temp_c": stats.get("ST_B10_mean"),
            "std_temp_c": stats.get("ST_B10_stdDev"),
            "min_temp_c": stats.get("ST_B10_min"),
            "max_temp_c": stats.get("ST_B10_max"),
        }

    except Exception as e:
        return {**_synthetic_thermal(bbox), "gee_error": str(e)}


def _synthetic_thermal(bbox: dict) -> Dict[str, Any]:
    """Synthetic thermal data for development/testing without GEE credentials."""
    import numpy as np

    mean_temp = np.random.uniform(28.0, 38.0)
    return {
        "source": "synthetic",
        "bbox": bbox,
        "date_range": ("synthetic", "synthetic"),
        "mean_temp_c": round(mean_temp, 2),
        "std_temp_c": round(np.random.uniform(1.5, 4.0), 2),
        "min_temp_c": round(mean_temp - 5, 2),
        "max_temp_c": round(mean_temp + 5, 2),
    }
