"""
Satellite thermal imagery ingestion via Google Earth Engine.
Falls back to date-aware synthetic data if GEE credentials are not configured.
"""
from typing import Dict, Any, Optional, Tuple
import os


def fetch_thermal_imagery(
    bbox: dict,
    date_range: Tuple[str, str] = ("2023-06-01", "2023-08-31"),
) -> Dict[str, Any]:
    gee_key = os.getenv("GEE_KEY_FILE")
    gee_project = os.getenv("GEE_PROJECT")

    if gee_key and gee_project and os.path.exists(gee_key):
        return _fetch_from_gee(bbox, date_range, gee_key, gee_project)
    else:
        return _synthetic_thermal(bbox, date_range)


def _fetch_from_gee(bbox, date_range, key_file, project):
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

        collection = (
            ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            .filterDate(date_range[0], date_range[1])
            .filterBounds(region)
            .select(["ST_B10"])
            .map(lambda img: img.multiply(0.00341802).add(149.0).subtract(273.15))
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
        return {**_synthetic_thermal(bbox, date_range), "gee_error": str(e)}


def _synthetic_thermal(bbox: dict, date_range: Tuple[str, str]) -> Dict[str, Any]:
    """
    Date-aware synthetic thermal data.
    Simulates seasonal temperature variation using the month of the analysis date.
    Summer = hotter, Winter = cooler. Latitude also affects baseline.
    """
    import numpy as np
    from datetime import datetime

    # Parse date for seasonal simulation
    try:
        end_date = datetime.strptime(date_range[1], "%Y-%m-%d")
        month = end_date.month
    except Exception:
        month = 7  # default to July

    # Latitude-based baseline (equatorial = hotter, polar = cooler)
    center_lat = (bbox["min_lat"] + bbox["max_lat"]) / 2
    lat_factor = max(0, 1.0 - abs(center_lat) / 60.0)  # 0 at 60°, 1 at equator

    # Seasonal factor: peaks in July (NH) / January (SH)
    # Northern hemisphere
    if center_lat >= 0:
        seasonal = np.cos((month - 7) * np.pi / 6)  # peak at month 7
    else:
        seasonal = np.cos((month - 1) * np.pi / 6)  # peak at month 1

    # Base temp: 15–38°C range depending on lat + season
    base = 15 + 23 * lat_factor + 8 * seasonal
    mean_temp = float(np.clip(base + np.random.normal(0, 1.5), -5, 45))

    return {
        "source": "synthetic",
        "bbox": bbox,
        "date_range": date_range,
        "mean_temp_c": round(mean_temp, 2),
        "std_temp_c": round(abs(np.random.normal(2.5, 0.5)), 2),
        "min_temp_c": round(mean_temp - 5, 2),
        "max_temp_c": round(mean_temp + 5, 2),
        "month": month,
        "seasonal_note": _season_label(month, center_lat),
    }


def _season_label(month: int, lat: float) -> str:
    nh = lat >= 0
    seasons = {
        (True, 12): "Winter", (True, 1): "Winter", (True, 2): "Winter",
        (True, 3): "Spring", (True, 4): "Spring", (True, 5): "Spring",
        (True, 6): "Summer", (True, 7): "Summer", (True, 8): "Summer",
        (True, 9): "Autumn", (True, 10): "Autumn", (True, 11): "Autumn",
    }
    key = (True, month) if nh else (True, ((month + 5) % 12) + 1)
    return seasons.get(key, "Unknown")
