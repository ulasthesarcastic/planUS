-- Pagination ve arama sorgularını hızlandıran index'ler

-- Projeler: kategori + status filtreleme
CREATE INDEX IF NOT EXISTS idx_projects_category_id     ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_project_status  ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_name            ON projects(name);

-- Personel: birim + isim arama
CREATE INDEX IF NOT EXISTS idx_personnel_unit_id        ON personnel(unit_id);
CREATE INDEX IF NOT EXISTS idx_personnel_last_name      ON personnel(last_name);
CREATE INDEX IF NOT EXISTS idx_personnel_first_name     ON personnel(first_name);

-- Kaynak planlaması: proje bazlı sorgular
CREATE INDEX IF NOT EXISTS idx_resource_entries_project_id   ON resource_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_resource_entries_personnel_id ON resource_entries(personnel_id);

-- Potansiyel satışlar
CREATE INDEX IF NOT EXISTS idx_potential_sales_project_id ON potential_sales(project_id);
CREATE INDEX IF NOT EXISTS idx_potential_sales_status     ON potential_sales(status);
