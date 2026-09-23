# Visual AI Browser Activity Agent — Step-by-Step Program Execution Guide 🚀

This document provides complete, step-by-step instructions for launching, running, and verifying all components of the Visual AI Browser Activity Agent system.

---

## 📋 System Components Overview

The system consists of **4 active processes/services**:

| Service | Technology | Port / Endpoint | Command |
|---|---|---|---|
| **1. Database** | Supabase PostgreSQL (External Cloud) | Cloud URI (`:6543`) | Configured in `.env` |
| **2. Message Queue** | Redis Streams (Docker Container) | `localhost:6379` | `docker compose up -d` |
| **3. Backend API** | Python FastAPI (Uvicorn) | `http://localhost:8000` | `python -m uvicorn apps.backend.main:app --reload --port 8000` |
| **4. AI Worker** | Python Async Worker (EasyOCR + VLM) | Background Task | `python -m services.ai_worker.worker` |
| **5. Chrome Extension**| Manifest V3 JavaScript Plugin | Installed in Chrome | `chrome://extensions` → Load Unpacked |
| **6. Dashboard UI** | React 18 + Tailwind CSS 3 | `http://localhost:8000/dashboard/` | Served automatically by FastAPI |

---

## ⚡ Step-by-Step Execution Sequence

### Step 1: Configure `.env` File

Open `g:\Visual agent\.env` and verify/update your environment variables:

```env
# 1. Supabase External PostgreSQL Connection URI
DATABASE_URL=postgresql://postgres.[project-ref]:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# 2. Redis Message Queue URL
REDIS_URL=redis://localhost:6379/0

# 3. Security Keys
SECRET_KEY=dev-secret-key-change-in-production-2026
EXTENSION_API_KEY=dev_api_key_visual_agent_2026_abc123def456ghi789jkl012mno345pqr

# 4. Screenshot Storage Directory
SCREENSHOTS_DIR=./storage/screenshots

# 5. Free Tier VLM Provider Keys (Optional, system falls back gracefully if blank)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

---

### Step 2: Launch Redis Container (Docker)

Open PowerShell in `g:\Visual agent` and run:

```powershell
cd "g:\Visual agent"
docker compose up -d
```

> **Verification:** Run `docker ps`. You should see `visual_agent_redis` container running on port `6379`.

---

### Step 3: Launch Backend Ingestion & API Server

In **Terminal 1** (PowerShell):

```powershell
cd "g:\Visual agent"
.\venv\Scripts\Activate.ps1

python -m uvicorn apps.backend.main:app --reload --port 8000
```

> **Verification:**
> 1. Open `http://localhost:8000/health` in your browser. You will receive:
>    `{"status":"healthy","service":"visual-ai-agent-backend"}`
> 2. Terminal output will confirm: `[STARTUP] Database schema initialized/verified successfully.` (Auto-creates all tables on Supabase).

---

### Step 4: Launch Async AI Worker Pool

Open **Terminal 2** (Second PowerShell window):

```powershell
cd "g:\Visual agent"
.\venv\Scripts\Activate.ps1

python -m services.ai_worker.worker
```

> **Verification:**
> Terminal 2 will print:
> `[OCR] Initializing EasyOCR model...`
> `[WORKER STARTED] Consuming stream 'activity_frames' as 'worker_...'`

---

### Step 5: Install Chrome Extension in Browser

1. Open **Google Chrome** and navigate to `chrome://extensions`.
2. Turn ON the **Developer mode** toggle switch in the top-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Browse to and select the directory: `g:\Visual agent\apps\extension`.
5. The extension badge **"Visual AI Activity Agent"** will appear in your extensions bar.
6. Click the extension icon → Status badge will show **"Active"**.

---

### Step 6: Access Dashboard & Test Live Tracking

1. Open your browser to: **`http://localhost:8000/dashboard/`**
2. Look at the bottom-left sidebar status dot → It should say **"Live WebSocket Connected"**.
3. Open a **new tab in Chrome** and visit any website (e.g. `github.com`, `news.ycombinator.com`, or `wikipedia.org`).
4. Switch back to your dashboard tab: Watch new activity event cards automatically slide into the timeline in real time!
5. Click any activity event card to open the **Screenshot Lightbox Modal**:
   - Inspect the **Client-Side Redacted Screenshot** (sensitive form fields blacked out).
   - Inspect the **Extracted OCR Text** (EasyOCR).
   - Read the **AI Semantic Synthesis** summary and category tags.

---

## 🛠️ Verification & Test Checklist

- [x] **API Health:** `GET http://localhost:8000/health` returns `200 OK`.
- [x] **Database Tables:** Tables `users`, `activity_logs`, `failed_frames`, and `domain_exclusions` created on Supabase.
- [x] **Extension Capture:** Popup shows active status; service worker logs successful ingestion.
- [x] **PII Redaction:** Input fields (`type="password"`) on active pages receive blackout overlays.
- [x] **Redis Stream Queue:** Worker receives messages from `activity_frames` stream without dropping connections.
- [x] **Live WebSocket:** New activity cards pop up on the dashboard without manual page refresh.

---

## ❓ Troubleshooting & FAQs

#### Q1: FastAPI backend throws `ConnectionRefusedError` on database connection?
- Verify `DATABASE_URL` in `.env` is correct. Ensure parameter starts with `postgresql://` or `postgresql+asyncpg://`.
- If using Supabase, ensure your IP is allowed or using the Transaction Pooler URI (`:6543`).

#### Q2: Extension shows "Failed to post activity event"?
- Ensure FastAPI server is running on `http://localhost:8000`.
- Verify `X-API-Key` header matches `EXTENSION_API_KEY` in `.env`.

#### Q3: AI worker fails with `Redis connection error`?
- Ensure Docker container is running: `docker compose up -d`. Check `docker ps`.