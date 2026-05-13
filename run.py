"""
One-command launcher: starts the API server.
Run: python run.py
"""
import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO)


def check_deps():
    try:
        import fastapi, uvicorn, sqlalchemy, aiosqlite, numpy
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Installing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements-dev.txt"])


if __name__ == "__main__":
    check_deps()
    import uvicorn
    print("\n=== Micro-Climate Zoning AI ===")
    print("API:       http://localhost:8000")
    print("API Docs:  http://localhost:8000/docs")
    print("Frontend:  cd frontend && npm run dev")
    print("Press Ctrl+C to stop\n")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
