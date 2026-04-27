-- 1. Var olmayan kategorilere işaret eden workflow_steps temizle
DELETE FROM workflow_steps
WHERE category_id IS NOT NULL
  AND category_id NOT IN (SELECT id FROM project_categories);

-- 2. Var olmayan kategorilere işaret eden potential_sales.category_id'yi NULL yap
UPDATE potential_sales
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND category_id NOT IN (SELECT id FROM project_categories);

-- 3. workflow_steps: ON DELETE CASCADE (adımlar kategoriye aittir)
ALTER TABLE workflow_steps
    DROP CONSTRAINT IF EXISTS workflow_steps_category_id_fkey;
ALTER TABLE workflow_steps
    ADD CONSTRAINT workflow_steps_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES project_categories(id) ON DELETE CASCADE;

-- 4. potential_sales: ON DELETE SET NULL (satış/sipariş kalır, kategori bilgisi temizlenir)
ALTER TABLE potential_sales
    DROP CONSTRAINT IF EXISTS potential_sales_category_id_fkey;
ALTER TABLE potential_sales
    ADD CONSTRAINT potential_sales_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES project_categories(id) ON DELETE SET NULL;

-- 5. projects: RESTRICT kalıyor — service katmanında anlamlı hata verilecek
-- (Mevcut FK değiştirilmiyor)
