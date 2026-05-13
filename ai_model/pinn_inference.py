"""
PINN inference engine.
Loads trained model checkpoint and runs block-level predictions.
"""
import os
import numpy as np
from typing import List, Dict, Any, Optional


class PINNInference:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv("PINN_MODEL_PATH", "ai_model/checkpoints/latest.pt")
        self.model = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            # Model not yet trained — use heuristic mode
            self.model = None
            return

        try:
            import torch
            from ai_model.pinn_model import UrbanClimateNet

            checkpoint = torch.load(self.model_path, map_location="cpu")
            self.model = UrbanClimateNet()
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.eval()
        except Exception:
            self.model = None

    def predict(
        self,
        blocks: List[Dict[str, Any]],
        thermal_data: Optional[Dict[str, Any]],
        wind_speed: float = 3.0,
        wind_dir: float = 270.0,
        ambient_temp: float = 30.0,
        solar_rad: float = 800.0,
    ) -> List[Dict[str, Any]]:
        """
        Run PINN inference for each block.
        Falls back to physics heuristics if model checkpoint is unavailable.
        """
        if self.model is not None:
            return self._nn_predict(blocks, thermal_data, wind_speed, wind_dir, ambient_temp, solar_rad)
        else:
            return self._heuristic_predict(blocks, thermal_data, ambient_temp)

    def _nn_predict(self, blocks, thermal_data, wind_speed, wind_dir, ambient_temp, solar_rad):
        import torch

        results = []
        for block in blocks:
            lat, lon = block["centroid"]
            density = min(block.get("area_m2", 5000) / 10000, 1.0)
            albedo = 0.15  # default urban albedo

            inp = torch.tensor(
                [[lon, lat, 0.0, density, albedo]],
                dtype=torch.float32,
            )
            with torch.no_grad():
                out = self.model(inp).squeeze().numpy()

            u, v, w, temp = float(out[0]), float(out[1]), float(out[2]), float(out[3])
            wind_mag = np.sqrt(u**2 + v**2)

            results.append({
                **block,
                "predicted_temp_c": round(temp, 2),
                "baseline_temp_c": round(ambient_temp, 2),
                "wind_speed_ms": round(wind_mag, 2),
                "uhi_intensity": round(temp - ambient_temp, 2),
            })

        return results

    def _heuristic_predict(self, blocks, thermal_data, ambient_temp):
        """
        Physics-based heuristics when no trained model is available.
        Based on UHI literature and urban morphology correlations.
        """
        results = []
        base_temp = thermal_data.get("mean_temp_c", ambient_temp) if thermal_data else ambient_temp

        for block in blocks:
            floors = block.get("floors") or np.random.randint(1, 8)
            area_m2 = block.get("area_m2", 5000)

            # UHI effect scales with building density and height
            density_factor = min(area_m2 / 10000, 1.0)
            height_factor = min(floors / 10.0, 1.0)
            uhi_delta = 1.5 * density_factor + 0.8 * height_factor + np.random.normal(0, 0.3)

            # Wind speed inversely correlated with building density and height
            wind_speed = max(0.5, 4.0 - (3.0 * density_factor) - (1.5 * height_factor) + np.random.normal(0, 0.2))

            predicted_temp = base_temp + uhi_delta

            results.append({
                **block,
                "predicted_temp_c": round(predicted_temp, 2),
                "baseline_temp_c": round(base_temp, 2),
                "wind_speed_ms": round(wind_speed, 2),
                "uhi_intensity": round(uhi_delta, 2),
            })

        return results
