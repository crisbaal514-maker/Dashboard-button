-- 002_commands_ext.sql
-- Risto Cloud — Extender tabla commands para CommandStatus completo
-- Se ejecuta después de 001_initial.sql

-- Expandir CHECK constraint de status para incluir todos los estados del ciclo de vida
-- SQLite no permite ALTER CHECK, así que recreamos la tabla

-- 1. Crear tabla temporal con el nuevo schema
CREATE TABLE IF NOT EXISTS commands_new (
    id              TEXT PRIMARY KEY,  -- UUID v4
    device_id       TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    payload         TEXT NOT NULL DEFAULT '{}',  -- JSON
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN (
                        'pending', 'delivered', 'executing',
                        'completed', 'failed', 'rejected'
                    )),
    priority        INTEGER NOT NULL DEFAULT 0,
    error           TEXT,               -- error message for failed/rejected
    result          TEXT,               -- JSON result from device (optional)
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    delivered_at    TEXT,               -- when the device received the command
    started_at      TEXT,               -- when the device started executing
    completed_at    TEXT                -- when the device finished/rejected/failed
);

-- 2. Migrar datos existentes (mapear old status → new status)
INSERT INTO commands_new (
    id, device_id, type, payload, status, priority, error, result,
    created_at, delivered_at, started_at, completed_at
)
SELECT
    id, device_id, type, payload,
    CASE
        WHEN status = 'sent'          THEN 'delivered'
        WHEN status = 'acknowledged'  THEN 'completed'
        WHEN status = 'failed'        THEN 'failed'
        ELSE 'pending'
    END,
    priority,
    CASE WHEN status = 'failed' THEN result_message ELSE NULL END,
    NULL,  -- result (no migration from old data)
    created_at,
    CASE WHEN status IN ('sent', 'acknowledged', 'failed') THEN sent_at ELSE NULL END,
    NULL,  -- started_at (no migration)
    CASE WHEN status IN ('acknowledged', 'failed') THEN acknowledged_at ELSE NULL END
FROM commands;

-- 3. Reemplazar tabla vieja
DROP TABLE commands;
ALTER TABLE commands_new RENAME TO commands;

-- 4. Recrear índices
CREATE INDEX IF NOT EXISTS idx_commands_device_id      ON commands(device_id);
CREATE INDEX IF NOT EXISTS idx_commands_status          ON commands(device_id, status);
CREATE INDEX IF NOT EXISTS idx_commands_pending         ON commands(device_id, status, priority DESC);
