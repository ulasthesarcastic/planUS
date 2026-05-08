-- Kullanıcı modül yetkileri: users tablosuna 3 sütun
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS portfolio_full BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS busdev_full    BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pnl_access     BOOLEAN NOT NULL DEFAULT FALSE;

-- Proje bazlı CRUD yetkileri
CREATE TABLE IF NOT EXISTS user_project_permissions (
    user_id    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    can_read   BOOLEAN NOT NULL DEFAULT TRUE,
    can_write  BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit   BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, project_id)
);
