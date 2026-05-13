"""
LIDAR point cloud loader for 3D building geometry extraction.
Supports LAS/LAZ files from USGS 3DEP or OpenTopography.
"""
from typing import List, Dict, Any, Optional
import os


def load_lidar_heights(bbox: dict, lidar_file: Optional[str] = None) -> Dict[str, float]:
    """
    Extract building heights from LIDAR point cloud data.

    Args:
        bbox: dict with min_lon, min_lat, max_lon, max_lat
        lidar_file: path to .las or .laz file (optional)

    Returns:
        dict mapping block_id prefix to estimated height in meters
    """
    if lidar_file and os.path.exists(lidar_file):
        return _extract_from_las(lidar_file, bbox)
    else:
        return {}


def _extract_from_las(filepath: str, bbox: dict) -> Dict[str, float]:
    """
    Extract max Z (height) values within bounding box from LAS/LAZ file.
    Requires laspy to be installed: pip install laspy lazrs-python
    """
    try:
        import laspy
        import numpy as np

        with laspy.open(filepath) as f:
            las = f.read()

        x = np.array(las.x)
        y = np.array(las.y)
        z = np.array(las.z)

        mask = (
            (x >= bbox["min_lon"]) & (x <= bbox["max_lon"]) &
            (y >= bbox["min_lat"]) & (y <= bbox["max_lat"])
        )

        x_filtered = x[mask]
        y_filtered = y[mask]
        z_filtered = z[mask]

        # Bin into a rough grid to get per-cell max heights
        cell_size = 0.0005  # ~50m at equator
        heights = {}
        if len(x_filtered) == 0:
            return heights

        x_bins = ((x_filtered - bbox["min_lon"]) / cell_size).astype(int)
        y_bins = ((y_filtered - bbox["min_lat"]) / cell_size).astype(int)

        for xi, yi, zi in zip(x_bins, y_bins, z_filtered):
            key = f"{xi}_{yi}"
            if key not in heights or zi > heights[key]:
                heights[key] = float(zi)

        return heights

    except ImportError:
        return {}
    except Exception as e:
        return {}
