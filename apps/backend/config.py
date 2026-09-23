"""
Backend configuration — environment variables and app settings.
Supports local PostgreSQL and External PostgreSQL databases (Supabase, Neon, AWS RDS, Timescale Cloud).
"""
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # --- Database ---
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://visual_agent:visual_agent_dev@localhost:5432/visual_agent"
    )

    def get_asyncpg_url(self) -> str:
        """
        Normalizes DATABASE_URL for raw asyncpg.connect() connection calls.
        Handles postgres://, postgresql://, and postgresql+asyncpg:// formats.
        """
        url = self.DATABASE_URL
        if url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql+asyncpg://", "postgresql://")
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://")
        return url

    async def connect_db(self):
        """Helper to open raw asyncpg connection with statement_cache_size=0 for Supabase / PgBouncer compatibility."""
        import asyncpg
        return await asyncpg.connect(self.get_asyncpg_url(), statement_cache_size=0)

    # --- Redis ---
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # --- Auth ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # --- API Key (for extension auth) ---
    EXTENSION_API_KEY: str = os.getenv(
        "EXTENSION_API_KEY",
        "dev_api_key_visual_agent_2026_abc123def456ghi789jkl012mno345pqr"
    )

    # --- Storage ---
    SCREENSHOTS_DIR: str = os.getenv("SCREENSHOTS_DIR", "./storage/screenshots")

    # --- AI / VLM ---
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # --- Queue ---
    REDIS_STREAM_NAME: str = "activity_frames"
    REDIS_DLQ_STREAM: str = "failed_frames"
    MAX_RETRY_COUNT: int = 3

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
