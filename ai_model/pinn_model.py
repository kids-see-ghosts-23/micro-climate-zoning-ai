"""
Physics-Informed Neural Network for urban wind and heat simulation.

Governing equations encoded in the loss function:
  - Navier-Stokes (incompressible): momentum and continuity for wind flow
  - Heat diffusion: steady-state advection-diffusion equation

Architecture: Fully-connected residual network (MLP with skip connections)
"""
import torch
import torch.nn as nn
import numpy as np
from typing import Tuple


class ResidualBlock(nn.Module):
    def __init__(self, width: int):
        super().__init__()
        self.linear1 = nn.Linear(width, width)
        self.linear2 = nn.Linear(width, width)
        self.activation = nn.Tanh()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.activation(self.linear2(self.activation(self.linear1(x))))


class UrbanClimateNet(nn.Module):
    """
    Input:  (x, y, z, building_density, albedo) -> 5 features
    Output: (u_wind, v_wind, w_wind, T_surface) -> 4 outputs

    x, y: normalized spatial coords [0, 1]
    z: normalized height [0, 1]
    building_density: fraction of block covered by buildings [0, 1]
    albedo: surface reflectivity [0.05, 0.95]
    """

    def __init__(self, input_dim: int = 5, output_dim: int = 4, hidden_dim: int = 128, depth: int = 8):
        super().__init__()

        self.input_layer = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.Tanh(),
        )

        self.residual_blocks = nn.ModuleList([
            ResidualBlock(hidden_dim) for _ in range(depth)
        ])

        self.output_layer = nn.Linear(hidden_dim, output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.input_layer(x)
        for block in self.residual_blocks:
            out = block(out)
        return self.output_layer(out)


def physics_loss(
    model: UrbanClimateNet,
    collocation_points: torch.Tensor,
    rho: float = 1.2,       # air density kg/m3
    mu: float = 1.81e-5,    # dynamic viscosity Pa.s
    k_thermal: float = 0.026,  # thermal conductivity W/m.K
    cp: float = 1005.0,     # specific heat J/kg.K
) -> Tuple[torch.Tensor, dict]:
    """
    Compute physics residuals for Navier-Stokes + heat diffusion.
    Uses autograd to compute spatial derivatives.
    """
    pts = collocation_points.requires_grad_(True)
    output = model(pts)

    u = output[:, 0:1]  # x-velocity
    v = output[:, 1:2]  # y-velocity
    w = output[:, 2:3]  # z-velocity
    T = output[:, 3:4]  # temperature

    def grad(y, x):
        return torch.autograd.grad(
            y, x, grad_outputs=torch.ones_like(y),
            create_graph=True, retain_graph=True
        )[0]

    # First-order derivatives
    grads = grad(output, pts)
    du_dx, du_dy = grads[:, 0:1], grads[:, 1:2]
    dv_dx, dv_dy = grads[:, 0:1], grads[:, 1:2]
    dT_dx, dT_dy = grads[:, 0:1], grads[:, 1:2]

    # Continuity: div(u) = 0 (incompressible)
    continuity = du_dx + dv_dy

    # Momentum (simplified 2D, no pressure for now)
    momentum_x = rho * (u * du_dx + v * du_dy)
    momentum_y = rho * (u * dv_dx + v * dv_dy)

    # Heat advection-diffusion: rho*cp*(u*dT/dx + v*dT/dy) = k*(d2T/dx2 + d2T/dy2)
    advection = rho * cp * (u * dT_dx + v * dT_dy)

    loss_continuity = torch.mean(continuity ** 2)
    loss_momentum = torch.mean(momentum_x ** 2 + momentum_y ** 2)
    loss_heat = torch.mean(advection ** 2)

    total_loss = loss_continuity + 0.1 * loss_momentum + 0.5 * loss_heat

    return total_loss, {
        "continuity": loss_continuity.item(),
        "momentum": loss_momentum.item(),
        "heat": loss_heat.item(),
    }


def data_loss(
    model: UrbanClimateNet,
    data_points: torch.Tensor,
    data_labels: torch.Tensor,
) -> torch.Tensor:
    """Supervised loss against OpenFOAM/sensor ground truth."""
    predictions = model(data_points)
    return torch.mean((predictions - data_labels) ** 2)
