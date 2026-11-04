"""Compatibility entry point; the implementation lives in backend.src."""
from backend.src.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.src.main:app", host="127.0.0.1", port=8000)
