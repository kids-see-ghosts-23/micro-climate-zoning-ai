"""
Zoning code generator.
Converts PINN prediction results into structured legislative zoning directives.

Each directive includes:
  - code: machine-readable zoning code string
  - reason: plain-language justification
  - parameters: numeric thresholds (stories, coverage %, albedo, etc.)
"""
from typing import List, Dict, Any


# Thresholds for directive triggers
THRESHOLDS = {
    "HIGH_UHI": 2.5,          # °C above baseline triggers cooling interventions
    "CRITICAL_UHI": 4.0,      # °C — stronger interventions
    "LOW_WIND": 1.5,          # m/s — blocks with low wind need height limits
    "MODERATE_WIND": 2.5,     # m/s — moderate wind corridors worth protecting
    "HIGH_BUILDING_AREA": 7000,  # m2 — dense blocks need green roof mandates
    "DENSE_FLOORS": 6,        # stories — threshold for green roof requirement
}


def generate_zoning_codes(predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate zoning directives for each predicted block.

    Args:
        predictions: List of block dicts from PINN inference, each containing:
            block_id, centroid, geometry, predicted_temp_c, baseline_temp_c,
            wind_speed_ms, uhi_intensity, floors, area_m2

    Returns:
        Same list with 'directives' key added to each block.
    """
    results = []
    for block in predictions:
        directives = _generate_directives_for_block(block)
        results.append({**block, "directives": directives})
    return results


def _generate_directives_for_block(block: Dict[str, Any]) -> List[Dict[str, Any]]:
    directives = []

    uhi = block.get("uhi_intensity", 0.0) or 0.0
    wind = block.get("wind_speed_ms", 3.0) or 3.0
    floors = block.get("floors") or 4
    area_m2 = block.get("area_m2", 5000) or 5000

    # --- Wind corridor protection ---
    if wind < THRESHOLDS["LOW_WIND"]:
        max_stories = max(2, floors - 2)
        directives.append({
            "code": f"HEIGHT-MAX-{max_stories}",
            "reason": (
                f"Wind speed at this block is {wind:.1f} m/s, well below the {THRESHOLDS['LOW_WIND']} m/s threshold. "
                f"Restricting to {max_stories} stories prevents further obstruction of street-level wind corridors."
            ),
            "max_stories": max_stories,
        })
    elif wind < THRESHOLDS["MODERATE_WIND"] and floors > 5:
        directives.append({
            "code": "SETBACK-UPPER-FLOORS",
            "reason": (
                f"Moderate wind speed ({wind:.1f} m/s) with tall structures present. "
                f"Upper-floor setbacks above level 5 will improve airflow at street level."
            ),
            "setback_above_floor": 5,
            "setback_meters": 3,
        })

    # --- Green roof mandates ---
    if uhi >= THRESHOLDS["HIGH_UHI"]:
        coverage = 60 if uhi >= THRESHOLDS["CRITICAL_UHI"] else 40
        directives.append({
            "code": f"GREEN-ROOF-{coverage}",
            "reason": (
                f"UHI intensity of {uhi:.1f}°C exceeds the {THRESHOLDS['HIGH_UHI']}°C threshold. "
                f"Mandating {coverage}% green roof coverage to disrupt local heat accumulation and restore evapotranspiration."
            ),
            "green_roof_coverage_pct": coverage,
        })

    # --- High-albedo surface requirement ---
    if uhi >= THRESHOLDS["HIGH_UHI"] or area_m2 >= THRESHOLDS["HIGH_BUILDING_AREA"]:
        directives.append({
            "code": "ALBEDO-MIN-0.45",
            "reason": (
                f"High thermal mass and low-reflectivity surfaces detected (area: {area_m2:.0f} m2, UHI: {uhi:.1f}°C). "
                f"New paving and roofing materials must achieve minimum albedo of 0.45."
            ),
            "albedo_min": 0.45,
        })

    # --- Street tree canopy ---
    if uhi >= THRESHOLDS["HIGH_UHI"] and wind < THRESHOLDS["MODERATE_WIND"]:
        directives.append({
            "code": "TREE-CANOPY-30PCT",
            "reason": (
                f"Combined low wind ({wind:.1f} m/s) and high UHI ({uhi:.1f}°C) creates a heat trap. "
                f"Minimum 30% street tree canopy coverage required to provide shade and evaporative cooling."
            ),
            "canopy_coverage_pct": 30,
        })

    # --- Dense block green infrastructure ---
    if area_m2 >= THRESHOLDS["HIGH_BUILDING_AREA"] and floors >= THRESHOLDS["DENSE_FLOORS"]:
        directives.append({
            "code": "VERTICAL-GARDEN-FACADE",
            "reason": (
                f"High-density block (area: {area_m2:.0f} m2, {floors} stories) with elevated heat load. "
                f"Vertical garden facades on south and west-facing walls required to reduce solar absorption."
            ),
            "facade_coverage_pct": 20,
        })

    # If no interventions triggered, mark block as compliant
    if not directives:
        directives.append({
            "code": "COMPLIANT",
            "reason": (
                f"Block meets current thermal and wind standards (UHI: {uhi:.1f}°C, wind: {wind:.1f} m/s). "
                f"No zoning changes required at this time."
            ),
        })

    return directives
