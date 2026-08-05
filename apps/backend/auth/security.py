"""
Authentication & security module.
- API key validation for Chrome extension requests
- JWT token generation & validation for dashboard login
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from apps.backend.config import settings


# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2 scheme for dashboard JWT ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# --- Pydantic models ---
class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    username: str
    password: str


# --- Password utilities ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# --- JWT token utilities ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: Optional[str] = payload.get("sub")
        user_id: Optional[int] = payload.get("user_id")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        return TokenData(username=username, user_id=user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# --- API Key validation (for Chrome extension) ---
async def validate_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """Validates the X-API-Key header sent by the Chrome extension."""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )
    if x_api_key != settings.EXTENSION_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return x_api_key


# --- JWT validation (for dashboard) ---
async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> TokenData:
    """Validates JWT token from dashboard requests. Allows default admin user for local single-user mode."""
    if token is None:
        return TokenData(username="admin", user_id=1)
    return decode_access_token(token)


async def get_or_create_user_id(conn, user_key: Any) -> int:
    """
    Looks up user ID by user_key. Auto-provisions a user record if not exists.
    Falls back to user_id = 1 for missing/empty/invalid keys.
    """
    if not isinstance(user_key, str) or not user_key.strip():
        return 1

    user_key = user_key.strip()
    try:
        row = await conn.fetchrow("SELECT id FROM users WHERE user_key = $1", user_key)
        if row:
            return row["id"]

        username = f"user_{user_key[-8:]}"
        api_k = f"key_{user_key}"
        pwd_h = get_password_hash(f"pass_{user_key}"[:70])

        new_id = await conn.fetchval(
            """INSERT INTO users (username, password_hash, api_key, user_key)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (user_key) DO UPDATE SET is_active = TRUE
               RETURNING id""",
            username, pwd_h, api_k, user_key
        )
        return new_id or 1
    except Exception as e:
        print(f"[AUTH WARN] Auto user creation notice: {e}")
        return 1
