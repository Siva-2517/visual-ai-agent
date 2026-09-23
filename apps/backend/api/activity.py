"""
Activity query API — provides endpoints for the dashboard to retrieve,
search, and aggregate activity data.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, List

from fastapi import APIRouter, Depends, Query, Header
from pydantic import BaseModel

from apps.backend.auth.security import get_current_user, TokenData, get_or_create_user_id

router = APIRouter(prefix="/api/v1/activity", tags=["activity"])


# --- Response models ---
class ActivityResponse(BaseModel):
    id: int
    user_id: int
    timestamp: str
    url: Optional[str] = None
    domain: Optional[str] = None
    page_title: Optional[str] = None
    tab_id: Optional[int] = None
    event_type: str
    summary: Optional[str] = None
    action_type: Optional[str] = None
    category: Optional[str] = None
    confidence: Optional[float] = None
    ocr_text: Optional[str] = None
    screenshot_path: Optional[str] = None
    processing_status: str = "pending"


class StatsResponse(BaseModel):
    total_events: int
    domains: list[dict]
    categories: list[dict]
    hourly_activity: list[dict]
    daily_trend: list[dict]


# --- Endpoints ---
@router.get("/history")
async def get_activity_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    domain: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_key: Optional[str] = None,
    x_user_key: Optional[str] = Header(None),
    _user: TokenData = Depends(get_current_user),
):
    """
    Returns paginated activity history with optional filters.
    Used by the dashboard Timeline page.
    """
    import asyncpg
    from apps.backend.config import settings

    conn = await settings.connect_db()

    try:
        effective_user_key = user_key if isinstance(user_key, str) and user_key.strip() else (x_user_key if isinstance(x_user_key, str) and x_user_key.strip() else None)
        target_user_id = getattr(_user, "user_id", 1) or 1
        if effective_user_key:
            target_user_id = await get_or_create_user_id(conn, effective_user_key)

        # Build query with optional filters
        conditions = ["user_id = $1"]
        params: list[Any] = [target_user_id]
        param_idx = 2

        if domain:
            conditions.append(f"domain = ${param_idx}")
            params.append(domain)
            param_idx += 1

        if category:
            conditions.append(f"category = ${param_idx}")
            params.append(category)
            param_idx += 1

        if start_date:
            conditions.append(f"timestamp >= ${param_idx}")
            params.append(datetime.fromisoformat(start_date))
            param_idx += 1

        if end_date:
            conditions.append(f"timestamp <= ${param_idx}")
            params.append(datetime.fromisoformat(end_date))
            param_idx += 1

        where_clause = " AND ".join(conditions)
        offset = (page - 1) * limit

        query = f"""
            SELECT id, user_id, timestamp, url, domain, page_title, tab_id,
                   event_type, summary, action_type, category, confidence,
                   ocr_text, screenshot_path, processing_status
            FROM activity_logs
            WHERE {where_clause}
            ORDER BY timestamp DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])

        rows = await conn.fetch(query, *params)

        # Get total count
        count_query = f"SELECT COUNT(*) FROM activity_logs WHERE {where_clause}"
        total = await conn.fetchval(count_query, *params[:param_idx - 1])

        activities = []
        for row in rows:
            activities.append({
                "id": row["id"],
                "user_id": row["user_id"],
                "timestamp": row["timestamp"].isoformat(),
                "url": row["url"],
                "domain": row["domain"],
                "page_title": row["page_title"],
                "tab_id": row["tab_id"],
                "event_type": row["event_type"],
                "summary": row["summary"],
                "action_type": row["action_type"],
                "category": row["category"],
                "confidence": row["confidence"],
                "ocr_text": row["ocr_text"],
                "screenshot_path": row["screenshot_path"],
                "processing_status": row["processing_status"],
            })

        return {
            "activities": activities,
            "total": total,
            "page": page,
            "limit": limit,
            "has_more": (page * limit) < total,
        }
    finally:
        await conn.close()


@router.get("/stats")
async def get_activity_stats(
    days: int = Query(7, ge=1, le=90),
    user_key: Optional[str] = None,
    x_user_key: Optional[str] = Header(None),
    _user: TokenData = Depends(get_current_user),
):
    """
    Returns aggregated analytics data for the dashboard Analytics page.
    """
    import asyncpg
    from apps.backend.config import settings

    conn = await settings.connect_db()

    try:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        effective_user_key = user_key if isinstance(user_key, str) and user_key.strip() else (x_user_key if isinstance(x_user_key, str) and x_user_key.strip() else None)
        target_user_id = getattr(_user, "user_id", 1) or 1
        if effective_user_key:
            target_user_id = await get_or_create_user_id(conn, effective_user_key)

        # Total events
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM activity_logs WHERE user_id = $1 AND timestamp >= $2",
            target_user_id, since
        )

        # Top domains
        domain_rows = await conn.fetch(
            """SELECT domain, COUNT(*) as count
               FROM activity_logs
               WHERE user_id = $1 AND timestamp >= $2 AND domain IS NOT NULL
               GROUP BY domain ORDER BY count DESC LIMIT 10""",
            target_user_id, since
        )
        domains = [{"domain": r["domain"], "count": r["count"]} for r in domain_rows]

        # Category breakdown
        cat_rows = await conn.fetch(
            """SELECT category, COUNT(*) as count
               FROM activity_logs
               WHERE user_id = $1 AND timestamp >= $2 AND category IS NOT NULL
               GROUP BY category ORDER BY count DESC""",
            target_user_id, since
        )
        categories = [{"category": r["category"], "count": r["count"]} for r in cat_rows]

        # Hourly activity (last N days)
        hourly_rows = await conn.fetch(
            """SELECT EXTRACT(HOUR FROM timestamp)::int as hour, COUNT(*) as count
               FROM activity_logs
               WHERE user_id = $1 AND timestamp >= $2
               GROUP BY hour ORDER BY hour""",
            target_user_id, since
        )
        hourly = [{"hour": r["hour"], "count": r["count"]} for r in hourly_rows]

        # Daily trend
        daily_rows = await conn.fetch(
            """SELECT DATE(timestamp) as day, COUNT(*) as count
               FROM activity_logs
               WHERE user_id = $1 AND timestamp >= $2
               GROUP BY day ORDER BY day""",
            target_user_id, since
        )
        daily = [{"day": r["day"].isoformat(), "count": r["count"]} for r in daily_rows]

        return {
            "total_events": total,
            "domains": domains,
            "categories": categories,
            "hourly_activity": hourly,
            "daily_trend": daily,
        }
    finally:
        await conn.close()


@router.post("/search")
async def search_activities(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    user_key: Optional[str] = None,
    x_user_key: Optional[str] = Header(None),
    _user: TokenData = Depends(get_current_user),
):
    """
    Keyword search over activity summaries, OCR text, and page titles.
    """
    import asyncpg
    from apps.backend.config import settings

    conn = await settings.connect_db()

    try:
        effective_user_key = user_key if isinstance(user_key, str) and user_key.strip() else (x_user_key if isinstance(x_user_key, str) and x_user_key.strip() else None)
        target_user_id = getattr(_user, "user_id", 1) or 1
        if effective_user_key:
            target_user_id = await get_or_create_user_id(conn, effective_user_key)

        search_term = f"%{query}%"

        rows = await conn.fetch(
            """SELECT id, user_id, timestamp, url, domain, page_title, tab_id,
                      event_type, summary, action_type, category, confidence,
                      ocr_text, screenshot_path, processing_status
               FROM activity_logs
               WHERE user_id = $1
                 AND (
                     summary ILIKE $2
                     OR ocr_text ILIKE $2
                     OR page_title ILIKE $2
                     OR url ILIKE $2
                     OR domain ILIKE $2
                 )
               ORDER BY timestamp DESC
               LIMIT $3""",
            target_user_id, search_term, limit
        )

        activities = []
        for row in rows:
            activities.append({
                "id": row["id"],
                "user_id": row["user_id"],
                "timestamp": row["timestamp"].isoformat(),
                "url": row["url"],
                "domain": row["domain"],
                "page_title": row["page_title"],
                "tab_id": row["tab_id"],
                "event_type": row["event_type"],
                "summary": row["summary"],
                "action_type": row["action_type"],
                "category": row["category"],
                "confidence": row["confidence"],
                "ocr_text": row["ocr_text"],
                "screenshot_path": row["screenshot_path"],
                "processing_status": row["processing_status"],
            })

        return {"results": activities, "query": query, "count": len(activities)}
    finally:
        await conn.close()

