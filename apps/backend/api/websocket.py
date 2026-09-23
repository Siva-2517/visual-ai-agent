"""
WebSocket endpoint — pushes real-time activity events to connected dashboard clients.
"""

import asyncio
import json
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websocket"])

# Track connected dashboard clients
connected_clients: Set[WebSocket] = set()


@router.websocket("/ws/live")
async def websocket_live_feed(websocket: WebSocket):
    """
    WebSocket endpoint for the dashboard's real-time activity feed.
    Connected clients receive new activity events as they are processed by the AI worker.
    """
    await websocket.accept()
    connected_clients.add(websocket)
    print(f"[WS] Dashboard client connected. Total: {len(connected_clients)}")

    try:
        # Keep connection alive and listen for client messages (e.g., pings)
        while True:
            data = await websocket.receive_text()
            # Client can send "ping" to keep alive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
        print(f"[WS] Dashboard client disconnected. Total: {len(connected_clients)}")
    except Exception as e:
        connected_clients.discard(websocket)
        print(f"[WS] Client error: {e}. Total: {len(connected_clients)}")


async def broadcast_activity(activity: dict):
    """
    Broadcast a new activity event to all connected dashboard clients.
    Called by the AI worker after processing a frame.
    """
    if not connected_clients:
        return

    message = json.dumps(activity)
    disconnected = set()

    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.add(client)

    # Clean up disconnected clients
    for client in disconnected:
        connected_clients.discard(client)
