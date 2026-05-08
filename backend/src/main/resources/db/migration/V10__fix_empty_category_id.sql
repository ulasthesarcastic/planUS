-- Boş string category_id olan projeleri 'cat-proje' kategorisine ata
-- (DataInitializer yalnızca NULL olanları yakalar; empty string'ler bu migration ile düzeltilir)
UPDATE projects
SET category_id = 'cat-proje'
WHERE (category_id IS NULL OR TRIM(category_id) = '')
  AND project_status != 'POTANSIYEL';

UPDATE projects
SET category_id = 'cat-proje'
WHERE (category_id IS NULL OR TRIM(category_id) = '')
  AND project_status = 'POTANSIYEL';
