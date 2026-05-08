CREATE TABLE IF NOT EXISTS personnel_seniority_history (
    id           BIGSERIAL    PRIMARY KEY,
    personnel_id VARCHAR(255) NOT NULL,
    seniority_id VARCHAR(255) NOT NULL,
    start_date   DATE         NOT NULL,
    end_date     DATE,
    CONSTRAINT fk_psh_personnel FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
    CONSTRAINT fk_psh_seniority FOREIGN KEY (seniority_id) REFERENCES seniorities(id)
);

-- Mevcut personelden başlangıç kıdem kaydı oluştur
INSERT INTO personnel_seniority_history (personnel_id, seniority_id, start_date)
SELECT id, seniority_id, COALESCE(start_date, '2025-01-01')
FROM personnel
WHERE seniority_id IS NOT NULL;
