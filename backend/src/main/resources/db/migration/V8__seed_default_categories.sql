-- Varsayılan proje kategorileri — sadece yoksa ekle (silinmişse yeniden eklenmez)
INSERT INTO project_categories (id, name, color, step_order, category_type)
VALUES
  ('cat-proje',  'Proje',  '#6366f1', 1, 'PROJE'),
  ('cat-urun',   'Ürün',   '#f59e0b', 2, 'URUN'),
  ('cat-hizmet', 'Hizmet', '#10b981', 3, 'HIZMET')
ON CONFLICT (id) DO NOTHING;
