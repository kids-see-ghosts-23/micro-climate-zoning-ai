"""
Export zoning results to various formats.
Supports GeoJSON, CSV, and plain-text legislative report.
"""
import json
import csv
import io
from typing import List, Dict, Any


def to_geojson(blocks: List[Dict[str, Any]]) -> dict:
    """Export block results as GeoJSON FeatureCollection."""
    features = []
    for block in blocks:
        feature = {
            "type": "Feature",
            "geometry": block.get("geometry", {}),
            "properties": {
                "block_id": block["block_id"],
                "predicted_temp_c": block.get("predicted_temp_c"),
                "baseline_temp_c": block.get("baseline_temp_c"),
                "wind_speed_ms": block.get("wind_speed_ms"),
                "uhi_intensity": block.get("uhi_intensity"),
                "directive_codes": [d["code"] for d in block.get("directives", [])],
                "directives": block.get("directives", []),
            },
        }
        features.append(feature)

    return {"type": "FeatureCollection", "features": features}


def to_csv(blocks: List[Dict[str, Any]]) -> str:
    """Export summary CSV of block directives."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "block_id", "centroid_lat", "centroid_lon",
        "predicted_temp_c", "baseline_temp_c", "uhi_intensity",
        "wind_speed_ms", "directives",
    ])
    writer.writeheader()
    for block in blocks:
        writer.writerow({
            "block_id": block["block_id"],
            "centroid_lat": block["centroid"][0],
            "centroid_lon": block["centroid"][1],
            "predicted_temp_c": block.get("predicted_temp_c"),
            "baseline_temp_c": block.get("baseline_temp_c"),
            "uhi_intensity": block.get("uhi_intensity"),
            "wind_speed_ms": block.get("wind_speed_ms"),
            "directives": "; ".join(d["code"] for d in block.get("directives", [])),
        })
    return output.getvalue()


def to_legislative_report(blocks: List[Dict[str, Any]], city_name: str = "City") -> str:
    """Generate a plain-text legislative zoning report."""
    lines = [
        f"MICRO-CLIMATE ZONING DIRECTIVES",
        f"City: {city_name}",
        f"Blocks Analyzed: {len(blocks)}",
        "=" * 60,
        "",
    ]

    non_compliant = [b for b in blocks if not all(d["code"] == "COMPLIANT" for d in b.get("directives", []))]
    lines.append(f"Blocks Requiring Intervention: {len(non_compliant)}")
    lines.append("")

    for block in non_compliant:
        lines.append(f"Block {block['block_id']}")
        lines.append(f"  Location: {block['centroid'][0]:.4f}N, {block['centroid'][1]:.4f}E")
        lines.append(f"  UHI Intensity: {block.get('uhi_intensity', 0):.1f}°C")
        lines.append(f"  Wind Speed: {block.get('wind_speed_ms', 0):.1f} m/s")
        lines.append("  Directives:")
        for d in block.get("directives", []):
            lines.append(f"    [{d['code']}] {d['reason']}")
        lines.append("")

    return "\n".join(lines)
