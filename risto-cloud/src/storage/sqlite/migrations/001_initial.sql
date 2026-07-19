-- 001_initial.sql
-- Risto Cloud — Schema inicial
-- WAL mode y foreign keys se habilitan en Database.ts

CREATE TABLE IF NOT EXISTS schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    checksum    TEXT    NOT NULL
);

-- ============================================================================
-- devices
-- ============================================================================
CREATE TABLE IF NOT EXISTS devices (
    id              TEXT PRIMARY KEY,  -- UUID v4
    hardware_id     TEXT NOT NULL UNIQUE,
    model           TEXT NOT NULL,
    firmware_version TEXT NOT NULL DEFAULT '',
    api_key_hash    TEXT,
    last_ip         TEXT,
    last_rssi       INTEGER,
    is_online       INTEGER NOT NULL DEFAULT 0,  -- boolean
    last_seen_at    TEXT,
    config          TEXT NOT NULL DEFAULT '{}',   -- JSON
    config_version  INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_devices_hardware_id ON devices(hardware_id);
CREATE INDEX idx_devices_online     ON devices(is_online);

-- ============================================================================
-- tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS tokens (
    id                TEXT PRIMARY KEY,  -- UUID v4
    device_id         TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    token_hash        TEXT NOT NULL,
    refresh_token_hash TEXT,
    token_type        TEXT NOT NULL CHECK(token_type IN ('access', 'refresh')),
    expires_at        TEXT NOT NULL,
    revoked           INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tokens_device_id      ON tokens(device_id);
CREATE INDEX idx_tokens_token_hash     ON tokens(token_hash);
CREATE INDEX idx_tokens_refresh_hash   ON tokens(refresh_token_hash);
CREATE INDEX idx_tokens_expires        ON tokens(expires_at);

-- ============================================================================
-- heartbeats
-- ============================================================================
CREATE TABLE IF NOT EXISTS heartbeats (
    id              TEXT PRIMARY KEY,  -- UUID v4
    device_id       TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    sequence        INTEGER NOT NULL,
    rssi            INTEGER,
    ip              TEXT,
    uptime          INTEGER,
    firmware_version TEXT,
    received_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_heartbeats_device_id     ON heartbeats(device_id);
CREATE INDEX idx_heartbeats_received_at   ON heartbeats(device_id, received_at DESC);

-- ============================================================================
-- events
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,  -- UUID v4
    device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,
    payload     TEXT,  -- JSON
    timestamp   TEXT,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_events_device_id   ON events(device_id);
CREATE INDEX idx_events_type        ON events(device_id, event_type);
CREATE INDEX idx_events_received_at ON events(device_id, received_at DESC);

-- ============================================================================
-- diagnostics
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnostics (
    id                TEXT PRIMARY KEY,  -- UUID v4
    device_id         TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    uptime_ms         INTEGER NOT NULL,
    free_heap         INTEGER NOT NULL,
    wifi_rssi         INTEGER NOT NULL,
    wifi_ssid         TEXT,
    firmware_version  TEXT NOT NULL,
    hardware_revision TEXT,
    last_error        TEXT,
    reboot_count      INTEGER,
    received_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_diagnostics_device_id ON diagnostics(device_id);

-- ============================================================================
-- commands
-- ============================================================================
CREATE TABLE IF NOT EXISTS commands (
    id              TEXT PRIMARY KEY,  -- UUID v4
    device_id       TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    payload         TEXT NOT NULL DEFAULT '{}',  -- JSON
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending', 'sent', 'acknowledged', 'failed')),
    priority        INTEGER NOT NULL DEFAULT 0,
    result_message  TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at         TEXT,
    acknowledged_at TEXT
);

CREATE INDEX idx_commands_device_id      ON commands(device_id);
CREATE INDEX idx_commands_status         ON commands(device_id, status);
CREATE INDEX idx_commands_pending        ON commands(device_id, status, priority DESC);

-- ============================================================================
-- scenarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS scenarios (
    id          TEXT PRIMARY KEY,  -- UUID v4
    name        TEXT NOT NULL,
    description TEXT,
    steps       TEXT NOT NULL DEFAULT '[]',  -- JSON array
    is_active   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_scenarios_active ON scenarios(is_active);
