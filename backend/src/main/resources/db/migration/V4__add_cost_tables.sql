-- Maliyet tipleri (ayarlardan yönetilir)
CREATE TABLE IF NOT EXISTS cost_types (
    id           VARCHAR(36)  PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    display_order INTEGER      DEFAULT 0,
    created_by   VARCHAR(100),
    created_at   TIMESTAMP,
    updated_by   VARCHAR(100),
    updated_at   TIMESTAMP
);

-- Proje bazlı aylık maliyet kalemleri
CREATE TABLE IF NOT EXISTS project_costs (
    id           VARCHAR(36)    PRIMARY KEY,
    project_id   VARCHAR(36)    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_type_id VARCHAR(36)    NOT NULL REFERENCES cost_types(id),
    month        INTEGER        NOT NULL,
    year         INTEGER        NOT NULL,
    amount       NUMERIC(15,2)  NOT NULL DEFAULT 0,
    created_by   VARCHAR(100),
    created_at   TIMESTAMP,
    updated_by   VARCHAR(100),
    updated_at   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_costs_project ON project_costs(project_id);

-- Kaynak planından gerçekleşen (actual) kolonu kaldır
ALTER TABLE resource_entries DROP COLUMN IF EXISTS actual;
