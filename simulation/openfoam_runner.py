"""
OpenFOAM CFD baseline runner.
Generates training data for the PINN model by running buoyantSimpleFoam
on a parameterized urban canyon geometry.
"""
import os
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any


OPENFOAM_BASE_CASE = Path("simulation/base_case")


def run_cfd_case(
    case_dir: str,
    wind_speed: float = 3.0,
    wind_direction_deg: float = 270.0,
    ambient_temp_c: float = 30.0,
    n_processors: int = 4,
) -> Dict[str, Any]:
    """
    Run an OpenFOAM case and return path to results.

    Args:
        case_dir: directory containing the OpenFOAM case
        wind_speed: inlet wind speed in m/s
        wind_direction_deg: wind direction in degrees (270 = westerly)
        ambient_temp_c: ambient temperature in Celsius
        n_processors: number of MPI processors

    Returns:
        dict with case_dir, status, and result paths
    """
    case_path = Path(case_dir)

    if not case_path.exists():
        raise FileNotFoundError(f"OpenFOAM case directory not found: {case_dir}")

    # Patch boundary conditions with current parameters
    _patch_initial_conditions(case_path, wind_speed, wind_direction_deg, ambient_temp_c)

    try:
        # Run blockMesh to generate the mesh
        _run_of_command(case_path, "blockMesh")

        # Decompose for parallel run
        if n_processors > 1:
            _run_of_command(case_path, f"decomposePar -force")
            _run_of_command(case_path, f"mpirun -np {n_processors} buoyantSimpleFoam -parallel")
            _run_of_command(case_path, "reconstructPar -latestTime")
        else:
            _run_of_command(case_path, "buoyantSimpleFoam")

        return {
            "case_dir": str(case_path),
            "status": "completed",
            "result_dir": str(case_path / "postProcessing"),
        }

    except subprocess.CalledProcessError as e:
        return {
            "case_dir": str(case_path),
            "status": "failed",
            "error": str(e),
        }


def _run_of_command(case_path: Path, command: str):
    result = subprocess.run(
        command.split(),
        cwd=str(case_path),
        check=True,
        capture_output=True,
        text=True,
    )
    return result


def _patch_initial_conditions(
    case_path: Path,
    wind_speed: float,
    wind_dir_deg: float,
    temp_c: float,
):
    """Patch the 0/U and 0/T boundary condition files."""
    import math

    rad = math.radians(wind_dir_deg)
    ux = -wind_speed * math.cos(rad)
    uy = -wind_speed * math.sin(rad)
    temp_k = temp_c + 273.15

    u_file = case_path / "0" / "U"
    t_file = case_path / "0" / "T"

    for filepath, pattern, replacement in [
        (u_file, "WIND_VELOCITY_PLACEHOLDER", f"({ux:.4f} {uy:.4f} 0)"),
        (t_file, "TEMP_PLACEHOLDER", str(round(temp_k, 2))),
    ]:
        if filepath.exists():
            content = filepath.read_text()
            content = content.replace(pattern, replacement)
            filepath.write_text(content)
