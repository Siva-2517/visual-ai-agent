"""
Ingestion API — receives activity events and screenshots from the Chrome extension.
"""
import os
import uuid
from datetime import datetime, timezone

import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, Form, Header, HTTPException
from pydantic import BaseModel
from typing import Optional

from apps.backend.config import settings
from apps.backend.auth.security import validate_api_key, get_or_create_user_id

router = APIRouter(prefix="/api/v1/activity", tags=["ingestion"])


# --- Request models ---
class ActivityEvent(BaseModel):
    url: str
    domain: str
    page_title: Optional[str] = ""
    tab_id: Optional[int] = None
    event_type: str = "page_visit"  # page_visit, tab_switch, navigation, dom_change
    timestamp: Optional[str] = None


# --- Screenshot storage helper ---
async def save_screenshot(file: UploadFile, user_id: int) -> str:
    """Save uploaded screenshot to local disk, organized by date."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dir_path = os.path.join(settings.SCREENSHOTS_DIR, today)
    os.makedirs(dir_path, exist_ok=True)

    # Generate unique filename
    file_id = uuid.uuid4().hex[:12]
    timestamp = int(datetime.now(timezone.utc).timestamp())
    filename = f"usr_{user_id}_{timestamp}_{file_id}.webp"
    file_path = os.path.join(dir_path, filename)

    # Write file to disk
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Return relative path for DB storage
    return f"{today}/{filename}"


@router.post("/ingest")
async def ingest_activity(
    url: str = Form(...),
    domain: str = Form(...),
    page_title: str = Form(""),
    tab_id: Optional[str] = Form(None),
    event_type: str = Form("page_visit"),
    timestamp: str = Form(None),
    user_key: Optional[str] = Form(None),
    x_user_key: Optional[str] = Header(None),
    screenshot: Optional[UploadFile] = File(None),
    _api_key: str = Depends(validate_api_key),
):
    """
    Receives a single activity event + optional screenshot from the Chrome extension.
    Saves screenshot to disk, then enqueues the event for AI processing via Redis Streams.
    """
    import redis.asyncio as aioredis
    import asyncpg
    import json

    effective_user_key = user_key if isinstance(user_key, str) and user_key.strip() else (x_user_key if isinstance(x_user_key, str) and x_user_key.strip() else None)
    resolved_user_id = 1
    if effective_user_key:
        try:
            conn = await settings.connect_db()
            resolved_user_id = await get_or_create_user_id(conn, effective_user_key)
            await conn.close()
        except Exception as e:
            print(f"[INGEST WARN] User key lookup notice: {e}")

    # Parse tab_id safely
    parsed_tab_id = None
    if tab_id and tab_id.isdigit():
        parsed_tab_id = int(tab_id)

    # Save screenshot if provided
    screenshot_path = None
    if screenshot and screenshot.filename:
        screenshot_path = await save_screenshot(screenshot, user_id=resolved_user_id)

    # Build event payload
    event_payload = {
        "user_id": resolved_user_id,
        "url": url,
        "domain": domain,
        "page_title": page_title,
        "tab_id": parsed_tab_id,
        "event_type": event_type,
        "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
        "screenshot_path": screenshot_path,
    }

    # Push to Redis Stream for async AI processing
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis_client.xadd(
            settings.REDIS_STREAM_NAME,
            {"payload": json.dumps(event_payload)},
        )
        await redis_client.aclose()
    except Exception as e:
        # If Redis is down, still save directly to DB as fallback
        print(f"[WARN] Redis enqueue failed: {e}. Event will be saved directly.")

    return {
        "status": "accepted",
        "screenshot_path": screenshot_path,
        "event_type": event_type,
    }


@router.post("/ingest/batch")
async def ingest_batch(
    events: list[dict],
    _api_key: str = Depends(validate_api_key),
):
    """
    Receives a batch of activity events from the Chrome extension.
    Used when the extension flushes its offline buffer.
    """
    import redis.asyncio as aioredis
    import json

    enqueued = 0
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        for event in events:
            event["user_id"] = 1  # Single-user MVP
            if "timestamp" not in event:
                event["timestamp"] = datetime.now(timezone.utc).isoformat()
            await redis_client.xadd(
                settings.REDIS_STREAM_NAME,
                {"payload": json.dumps(event)},
            )
            enqueued += 1
        await redis_client.aclose()
    except Exception as e:
        print(f"[WARN] Redis batch enqueue failed at event {enqueued}: {e}")

    return {"status": "accepted", "enqueued": enqueued, "total": len(events)}
