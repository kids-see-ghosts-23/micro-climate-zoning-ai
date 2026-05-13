"""
PINN training script.
Trains on OpenFOAM CFD output data + physics collocation points.

Usage:
    python -m ai_model.trainer --data-dir simulation/training_data --epochs 5000 --lr 1e-3
"""
import argparse
import os
import torch
import torch.optim as optim
import numpy as np
from pathlib import Path

from ai_model.pinn_model import UrbanClimateNet, physics_loss, data_loss


def load_openfoam_data(data_dir: str):
    """Load pre-processed OpenFOAM CFD simulation data as training samples."""
    data_path = Path(data_dir) / "cfd_samples.npy"
    labels_path = Path(data_dir) / "cfd_labels.npy"

    if not data_path.exists():
        # Generate synthetic training data for testing
        n = 10000
        data = np.random.rand(n, 5).astype(np.float32)
        labels = np.random.rand(n, 4).astype(np.float32)
        return torch.from_numpy(data), torch.from_numpy(labels)

    data = np.load(str(data_path)).astype(np.float32)
    labels = np.load(str(labels_path)).astype(np.float32)
    return torch.from_numpy(data), torch.from_numpy(labels)


def train(
    data_dir: str = "simulation/training_data",
    checkpoint_dir: str = "ai_model/checkpoints",
    epochs: int = 5000,
    lr: float = 1e-3,
    batch_size: int = 512,
    physics_weight: float = 0.1,
    log_every: int = 100,
):
    os.makedirs(checkpoint_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")

    model = UrbanClimateNet(input_dim=5, output_dim=4, hidden_dim=128, depth=8).to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    X_data, y_data = load_openfoam_data(data_dir)
    X_data, y_data = X_data.to(device), y_data.to(device)

    best_loss = float("inf")

    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()

        # Random batch
        idx = torch.randperm(X_data.size(0))[:batch_size]
        X_batch = X_data[idx]
        y_batch = y_data[idx]

        # Data loss (supervised on CFD)
        loss_data = data_loss(model, X_batch, y_batch)

        # Physics loss (collocation points sampled randomly)
        collocation = torch.rand(batch_size, 5, device=device)
        loss_phys, phys_components = physics_loss(model, collocation)

        total = loss_data + physics_weight * loss_phys
        total.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()

        if epoch % log_every == 0:
            print(
                f"Epoch {epoch:5d} | total={total.item():.6f} | "
                f"data={loss_data.item():.6f} | phys={loss_phys.item():.6f} | "
                f"continuity={phys_components['continuity']:.6f}"
            )

        if total.item() < best_loss:
            best_loss = total.item()
            torch.save(
                {"epoch": epoch, "model_state_dict": model.state_dict(), "loss": best_loss},
                os.path.join(checkpoint_dir, "latest.pt"),
            )

    print(f"Training complete. Best loss: {best_loss:.6f}")
    print(f"Checkpoint saved to {checkpoint_dir}/latest.pt")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="simulation/training_data")
    parser.add_argument("--checkpoint-dir", default="ai_model/checkpoints")
    parser.add_argument("--epochs", type=int, default=5000)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--batch-size", type=int, default=512)
    parser.add_argument("--physics-weight", type=float, default=0.1)
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        checkpoint_dir=args.checkpoint_dir,
        epochs=args.epochs,
        lr=args.lr,
        batch_size=args.batch_size,
        physics_weight=args.physics_weight,
    )
