-- ============================================================
-- Visual AI Browser Activity Agent — Universal Database Schema
-- Compatible with External PostgreSQL (Supabase, Neon, AWS RDS, Timescale Cloud, Render)
-- ============================================================

-- Try enabling extensions safely (ignores errors if host DB doesn't support them)
DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'TimescaleDB extension not available on this host, using standard PostgreSQL time-series.';
END $$;

DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'pgvector extension not available on this host, vector search disabled.';
END $$;

-- ============================================================
-- Users table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    api_key         VARCHAR(64) UNIQUE NOT NULL,
    user_key        VARCHAR(128) UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

-- Ensure user_key column exists for database migrations
DO $$
BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS user_key VARCHAR(128) UNIQUE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- Activity logs — main activity table
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id              BIGSERIAL,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    url             TEXT,
    domain          VARCHAR(255),
    page_title      TEXT,
    tab_id          INTEGER,
    event_type      VARCHAR(50) NOT NULL DEFAULT 'page_visit',
    -- AI-generated fields (populated by worker)
    summary         TEXT,
    action_type     VARCHAR(100),
    category        VARCHAR(100),
    confidence      REAL,
    ocr_text        TEXT,
    ui_elements     JSONB DEFAULT '[]'::jsonb,
    -- Screenshot reference
    screenshot_path VARCHAR(500),
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    PRIMARY KEY (id, timestamp)
);

-- Attempt converting to TimescaleDB hypertable safely if extension is available
DO $$ 
BEGIN
    PERFORM create_hypertable('activity_logs', 'timestamp', if_not_exists => TRUE);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'TimescaleDB hypertable creation skipped, using standard PostgreSQL index.';
END $$;

-- ============================================================
-- Indexes for query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_activity_user_time
    ON activity_logs (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_activity_domain
    ON activity_logs (domain, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_activity_category
    ON activity_logs (category, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_activity_status
    ON activity_logs (processing_status);

CREATE INDEX IF NOT EXISTS idx_activity_event_type
    ON activity_logs (event_type, timestamp DESC);

-- ============================================================
-- Failed frames — dead-letter table for debugging
-- ============================================================
CREATE TABLE IF NOT EXISTS failed_frames (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    original_payload JSONB,
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,
    screenshot_path VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Domain exclusions — per-user site blocklist
-- ============================================================
CREATE TABLE IF NOT EXISTS domain_exclusions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain          VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, domain)
);

-- ============================================================
-- Insert default demo user for development
-- Username: 'demo'
-- Password: 'demo123' (bcrypt hash)
-- API Key: dev_api_key_visual_agent_2026_abc123def456ghi789jkl012mno345pqr
-- ============================================================
INSERT INTO users (username, password_hash, api_key, user_key)
VALUES (
    'demo',
    '$2b$12$LJ3m4ys3Lk0YBJQxKZq3eO8v3Z6oY6v7R0aR4z5U1u4t3s2r1q0p',
    'dev_api_key_visual_agent_2026_abc123def456ghi789jkl012mno345pqr',
    'usr_demo_default_key_2026'
) ON CONFLICT (username) DO NOTHING;
