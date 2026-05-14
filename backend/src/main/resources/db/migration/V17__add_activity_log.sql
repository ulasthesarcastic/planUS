-- Aktivite / denetim logu
CREATE TABLE activity_log (
    id          BIGSERIAL    PRIMARY KEY,
    entity_type VARCHAR(60)  NOT NULL,   -- POTANSIYEL_PROJE | POTANSIYEL_SIPARIS | PROJE | PERSONEL ...
    entity_id   VARCHAR(36)  NOT NULL,
    entity_name VARCHAR(255),
    action      VARCHAR(100) NOT NULL,   -- AUTO_SHIFT | STATUS_CHANGE | CREATE | UPDATE | DELETE
    actor       VARCHAR(100),            -- kullanıcı adı veya 'system'
    detail      TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_entity  ON activity_log (entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON activity_log (created_at DESC);
