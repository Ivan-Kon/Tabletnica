import os

# Importing the app never connects to a remote database by default.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./tabletnica-local.db")
JWT_ACCESS_COOKIE_NAME = "session_id"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"
CORS_ORIGINS = [value.strip() for value in os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if value.strip()]
