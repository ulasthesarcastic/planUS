-- Kim ne zaman oluşturdu / güncelledi
-- Spring Data JPA @CreatedBy / @LastModifiedBy tarafından otomatik doldurulur

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS created_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP;

ALTER TABLE personnel
    ADD COLUMN IF NOT EXISTS created_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP;

ALTER TABLE potential_sales
    ADD COLUMN IF NOT EXISTS created_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_by  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP;
