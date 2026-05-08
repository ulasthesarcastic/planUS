CREATE TABLE IF NOT EXISTS project_procurements (
    id             BIGSERIAL PRIMARY KEY,
    project_id     VARCHAR(255) NOT NULL,
    description    TEXT,
    planned_amount NUMERIC(15, 2),
    planned_month  INT,
    planned_year   INT,
    actual_amount  NUMERIC(15, 2),
    actual_month   INT,
    actual_year    INT,
    CONSTRAINT fk_proc_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
