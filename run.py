import sys
import logging
import subprocess

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

REQUIRED = ["fastapi", "uvicorn", "sqlalchemy", "aiosqlite", "numpy", "pydantic"]

def check_and_install():
    missing = []
    for pkg in REQUIRED:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"Installing missing packages: {missing}")
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing)

if __name__ == "__main__":
    check_and_install()
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
