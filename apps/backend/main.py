"""
Visual AI Browser Activity Agent — FastAPI Backend
Main application entry point.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from apps.backend.config import settings
from apps.backend.api import ingest, activity, websocket
from apps.backend.auth import security


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # --- Startup ---
    # Ensure screenshot storage directory exists
    os.makedirs(settings.SCREENSHOTS_DIR, exist_ok=True)

    # Auto-initialize database schema on external or local PostgreSQL
    try:
        conn = await settings.connect_db()
        sql_path = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "init_db.sql")
        if os.path.exists(sql_path):
            with open(sql_path, "r", encoding="utf-8") as f:
                sql_content = f.read()
            await conn.execute(sql_content)
            print("[STARTUP] Database schema initialized/verified successfully.")
        await conn.close()
    except Exception as e:
        print(f"[STARTUP WARN] DB auto-init notice: {e}")

    print(f"[STARTUP] Screenshots dir: {os.path.abspath(settings.SCREENSHOTS_DIR)}")
    print(f"[STARTUP] Redis: {settings.REDIS_URL}")
    print("[STARTUP] Visual AI Browser Agent backend ready.")
    yield
    # --- Shutdown ---
    print("[SHUTDOWN] Visual AI Browser Agent backend stopping.")


# --- Create FastAPI app ---
app = FastAPI(
    title="Visual AI Browser Activity Agent",
    description="Backend API for the Visual AI Browser monitoring system.",
    version="0.1.0",
    lifespan=lifespan,
)

# --- CORS middleware (allow extension and dashboard) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Extension runs from chrome-extension:// origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register API routers ---
app.include_router(ingest.router)
app.include_router(activity.router)
app.include_router(websocket.router)


# --- Auth endpoint (dashboard login) ---
from fastapi import HTTPException, status
from apps.backend.auth.security import (
    Token, LoginRequest, create_access_token, verify_password
)


@app.post("/api/v1/auth/login", response_model=Token, tags=["auth"])
async def login(request: LoginRequest):
    """Dashboard login — returns JWT access token."""
    import asyncpg
    db_url = settings.get_asyncpg_url()

    try:
        conn = await asyncpg.connect(db_url)
        user = await conn.fetchrow(
            "SELECT id, username, password_hash FROM users WHERE username = $1 AND is_active = TRUE",
            request.username
        )
        await conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"]}
    )
    return Token(access_token=access_token, token_type="bearer")



# --- Health check ---
@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "healthy", "service": "visual-ai-agent-backend"}


# --- Mount static files ---
# Screenshots served at /screenshots/<date>/<filename>
if os.path.exists(settings.SCREENSHOTS_DIR):
    app.mount(
        "/screenshots",
        StaticFiles(directory=settings.SCREENSHOTS_DIR),
        name="screenshots",
    )

# Dashboard static files (built React app)
dashboard_dist = os.path.join(os.path.dirname(__file__), "..", "dashboard", "dist")
if os.path.exists(dashboard_dist):
    app.mount(
        "/dashboard",
        StaticFiles(directory=dashboard_dist, html=True),
        name="dashboard",
    )


# --- Init files for package imports ---
# These are created as empty files to make Python treat directories as packages
