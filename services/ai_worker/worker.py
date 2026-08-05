"""
Async Queue Worker — consumes frame payloads from Redis Streams.
Orchestrates Tier 1 OCR -> Tier 2 VLM escalation -> DB Persistence.
"""
import os
import sys

# Ensure project root is in sys.path for direct script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import json
import asyncio
import redis.asyncio as aioredis

from apps.backend.config import settings
from services.ai_worker.ocr_engine import extract_text_from_image
from services.ai_worker.vlm_engine import analyze_screen_content
from services.ai_worker.db import save_activity_to_db, save_failed_frame
from apps.backend.api.websocket import broadcast_activity


async def process_frame_event(payload: dict):
    """
    Processes a single frame payload:
    1. Tier 1: OCR text extraction
    2. Tier 2: VLM semantic analysis (Gemini -> Groq -> Heuristic)
    3. Save to TimescaleDB
    4. Broadcast via WebSocket to Dashboard
    """
    url = payload.get("url", "")
    domain = payload.get("domain", "")
    page_title = payload.get("page_title", "")
    event_type = payload.get("event_type", "page_visit")
    screenshot_rel_path = payload.get("screenshot_path")

    # Resolve full absolute path for image processing
    full_image_path = None
    if screenshot_rel_path:
        full_image_path = os.path.join(settings.SCREENSHOTS_DIR, screenshot_rel_path)

    print(f"[WORKER] Processing frame: {event_type} on {domain}")

    # 1. Run Tier 1 OCR
    ocr_result = {"extracted_text": "", "confidence": 0.0}
    if full_image_path and os.path.exists(full_image_path):
        ocr_result = extract_text_from_image(full_image_path)

    # 2. Run Tier 2 VLM Escalation
    vlm_result = analyze_screen_content(
        image_path=full_image_path,
        ocr_text=str(ocr_result.get("extracted_text", "")),
        page_title=page_title,
        url=url,
        domain=domain
    )

    # 3. Assemble final activity record
    activity_record = {
        "user_id": payload.get("user_id", 1),
        "timestamp": payload.get("timestamp"),
        "url": url,
        "domain": domain,
        "page_title": page_title,
        "tab_id": payload.get("tab_id"),
        "event_type": payload.get("event_type", "page_visit"),
        "summary": vlm_result.get("summary"),
        "action_type": vlm_result.get("action_type", "browsing"),
        "category": vlm_result.get("category", "Productivity"),
        "confidence": vlm_result.get("confidence", 0.8),
        "ocr_text": str(ocr_result.get("extracted_text", "")),
        "ui_elements": vlm_result.get("ui_elements", []),
        "screenshot_path": screenshot_rel_path,
    }

    # 4. Save to PostgreSQL Database
    record_id = await save_activity_to_db(activity_record)
    if record_id:
        activity_record["id"] = record_id
        print(f"[WORKER SUCCESS] Logged activity #{record_id} ({domain})")

        # 5. Broadcast to connected dashboard clients via WebSocket
        try:
            await broadcast_activity(activity_record)
        except Exception as e:
            print(f"[WORKER WARN] WebSocket broadcast failed: {e}")


async def start_worker_loop():
    """Main worker loop consuming events from Redis Streams."""
    print(f"[WORKER] Connecting to Redis: {settings.REDIS_URL}...")
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

    stream_name = settings.REDIS_STREAM_NAME
    group_name = "ai_workers"
    consumer_name = f"worker_{os.getpid()}"

    # Create consumer group if not exists
    try:
        await redis_client.xgroup_create(stream_name, group_name, id="0", mkstream=True)
    except Exception:
        pass  # Group already exists

    print(f"[WORKER STARTED] Consuming stream '{stream_name}' as '{consumer_name}'...")

    while True:
        try:
            # Read new messages from stream
            entries = await redis_client.xreadgroup(
                groupname=group_name,
                consumername=consumer_name,
                streams={stream_name: ">"},
                count=1,
                block=2000  # 2 second timeout
            )

            if not entries or not isinstance(entries, (list, tuple)):
                await asyncio.sleep(0.5)
                continue

            for item in entries:
                if not isinstance(item, (list, tuple)) or len(item) < 2:
                    continue
                stream, messages = item[0], item[1]
                if not isinstance(messages, (list, tuple)):
                    continue
                for message_id, data in messages:
                    raw_payload = data.get("payload")
                    if raw_payload:
                        payload = json.loads(raw_payload)
                        retry_count = payload.get("_retry_count", 0)

                        try:
                            await process_frame_event(payload)
                            # Acknowledge processed message
                            await redis_client.xack(stream_name, group_name, message_id)
                        except Exception as err:
                            print(f"[WORKER ERROR] Processing failed: {err}")

                            if retry_count < settings.MAX_RETRY_COUNT:
                                payload["_retry_count"] = retry_count + 1
                                await redis_client.xadd(stream_name, {"payload": json.dumps(payload)})
                            else:
                                print(f"[DLQ] Max retries reached for payload. Sending to dead-letter queue.")
                                await save_failed_frame(
                                    user_id=payload.get("user_id", 1),
                                    original_payload=payload,
                                    error_message=str(err),
                                    retry_count=retry_count
                                )

                            await redis_client.xack(stream_name, group_name, message_id)
        except Exception as e:
            print(f"[WORKER LOOP ERROR] {e}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(start_worker_loop())
