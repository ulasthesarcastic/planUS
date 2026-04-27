-- Silinmiş projelere ait orphan kaynak planlaması girdilerini temizle
DELETE FROM resource_entries
WHERE project_id IS NOT NULL
  AND project_id NOT IN (SELECT id FROM projects);

-- FK kısıtlamasını ON DELETE CASCADE ile yeniden oluştur
-- (önce varsa eski kısıtlamayı kaldır)
ALTER TABLE resource_entries
    DROP CONSTRAINT IF EXISTS resource_entries_project_id_fkey;

ALTER TABLE resource_entries
    ADD CONSTRAINT resource_entries_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
