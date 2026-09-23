"""
AI Worker Database & Pub/Sub repository.
Saves processed activity records to PostgreSQL and publishes new events to Redis for WebSocket live feed.
"""
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import json
from datetime import datetime, timezone
import asyncpg
from typing import Dict, Any, Optional

from apps.backend.config import settings

 
async def save_activity_to_db(activity_data: Dict[str, Any]) -> Optional[int]:
    """
    Inserts a fully processed activity record into the PostgreSQL `activity_logs` table.
    @returns inserted record ID
    """
    conn = await settings.connect_db()

    # Convert ISO timestamp string to datetime object for asyncpg TIMESTAMPTZ support
    raw_ts = activity_data.get("timestamp")
    if isinstance(raw_ts, str):
        try:
            ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
        except ValueError:
            ts = datetime.now(timezone.utc)
    elif isinstance(raw_ts, datetime):
        ts = raw_ts
    else:
        ts = datetime.now(timezone.utc)

    try:
        query = """
            INSERT INTO activity_logs (
                user_id, timestamp, url, domain, page_title, tab_id, event_type,
                summary, action_type, category, confidence, ocr_text, ui_elements,
                screenshot_path, processing_status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            ) RETURNING id
        """

        record_id = await conn.fetchval(
            query,
            activity_data.get("user_id", 1),
            ts,
            activity_data.get("url"),
            activity_data.get("domain"),
            activity_data.get("page_title"),
            activity_data.get("tab_id"),
            activity_data.get("event_type", "page_visit"),
            activity_data.get("summary"),
            activity_data.get("action_type"),
            activity_data.get("category"),
            activity_data.get("confidence", 0.8),
            activity_data.get("ocr_text"),
            json.dumps(activity_data.get("ui_elements", [])),
            activity_data.get("screenshot_path"),
            "completed"
        )
        return record_id
    except Exception as e:
        print(f"[DB ERROR] Failed to save activity log: {e}")
        return None
    finally:
        await conn.close()


async def save_failed_frame(user_id: int, original_payload: dict, error_message: str, retry_count: int):
    """Saves a unprocessable frame to the dead-letter table for debugging."""
    conn = await settings.connect_db()

    try:
        query = """
            INSERT INTO failed_frames (user_id, original_payload, error_message, retry_count, screenshot_path)
            VALUES ($1, $2, $3, $4, $5)
        """
        await conn.execute(
            query,
            user_id,
            json.dumps(original_payload),
            error_message,
            retry_count,
            original_payload.get("screenshot_path")
        )
    except Exception as e:
        print(f"[DLQ ERROR] Failed to save to failed_frames table: {e}")
    finally:
        await conn.close()
