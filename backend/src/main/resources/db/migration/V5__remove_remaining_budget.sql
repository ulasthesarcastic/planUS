-- V5: Remove remaining_budget column (now calculated dynamically from project costs)
ALTER TABLE projects DROP COLUMN IF EXISTS remaining_budget;
