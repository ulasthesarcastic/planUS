-- planUS initial schema
-- Bu dosya mevcut DB'nin ilk snapshot'ıdır.
-- Flyway baseline ile işaretlenir, yeniden çalıştırılmaz.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seniorities (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS seniority_rates (
    id BIGSERIAL PRIMARY KEY,
    seniority_id VARCHAR(255) REFERENCES seniorities(id),
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(255),
    start_month INTEGER NOT NULL,
    start_year INTEGER NOT NULL,
    end_month INTEGER,
    end_year INTEGER
);

CREATE TABLE IF NOT EXISTS organization_units (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(255) REFERENCES organization_units(id),
    manager_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS personnel (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    seniority_id VARCHAR(255) NOT NULL REFERENCES seniorities(id),
    unit_id VARCHAR(255) REFERENCES organization_units(id)
);

CREATE TABLE IF NOT EXISTS project_types (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(255),
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS project_categories (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(255),
    step_order INTEGER NOT NULL,
    category_type VARCHAR(255),
    icon VARCHAR(255),
    menu_label VARCHAR(255),
    section_label VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    category_id VARCHAR(255) REFERENCES project_categories(id),
    label VARCHAR(255),
    step_order INTEGER NOT NULL,
    step_type VARCHAR(255),
    positionx INTEGER NOT NULL DEFAULT 0,
    positiony INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workflow_step_transitions (
    step_id VARCHAR(255) NOT NULL REFERENCES workflow_steps(id),
    target_step_id VARCHAR(255) REFERENCES workflow_steps(id),
    PRIMARY KEY (step_id, target_step_id)
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    trl_level INTEGER NOT NULL DEFAULT 1,
    owner_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    budget DOUBLE PRECISION NOT NULL DEFAULT 0,
    budget_currency VARCHAR(255),
    remaining_budget DOUBLE PRECISION NOT NULL DEFAULT 0,
    potential_sales DOUBLE PRECISION NOT NULL DEFAULT 0,
    customer_name VARCHAR(255),
    start_month INTEGER NOT NULL DEFAULT 1,
    start_year INTEGER NOT NULL DEFAULT 2024,
    end_month INTEGER NOT NULL DEFAULT 12,
    end_year INTEGER NOT NULL DEFAULT 2024,
    project_type VARCHAR(255) REFERENCES project_types(id),
    project_manager_id VARCHAR(255) REFERENCES personnel(id),
    tech_lead_id VARCHAR(255) REFERENCES personnel(id),
    unit_id VARCHAR(255) REFERENCES organization_units(id),
    category_id VARCHAR(255) REFERENCES project_categories(id),
    current_step_id VARCHAR(255) REFERENCES workflow_steps(id),
    project_status VARCHAR(20) DEFAULT 'BASLADI',
    probability INTEGER DEFAULT 50
);

CREATE TABLE IF NOT EXISTS project_personnel (
    project_id VARCHAR(255) NOT NULL REFERENCES projects(id),
    personnel_id VARCHAR(255) REFERENCES personnel(id)
);

CREATE TABLE IF NOT EXISTS project_products (
    project_id VARCHAR(255) NOT NULL REFERENCES projects(id),
    product_id VARCHAR(255) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payment_items (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    project_id VARCHAR(255) REFERENCES projects(id),
    name VARCHAR(255),
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    currency VARCHAR(255),
    planned_month INTEGER,
    planned_year INTEGER,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    actual_amount DOUBLE PRECISION,
    actual_month INTEGER,
    actual_year INTEGER
);

CREATE TABLE IF NOT EXISTS milestones (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    project_id VARCHAR(255) REFERENCES projects(id),
    name VARCHAR(255),
    description VARCHAR(255),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_month INTEGER,
    completed_year INTEGER
);

CREATE TABLE IF NOT EXISTS resource_entries (
    id BIGSERIAL PRIMARY KEY,
    project_id VARCHAR(255) REFERENCES projects(id),
    personnel_id VARCHAR(255),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    need DOUBLE PRECISION,
    planned DOUBLE PRECISION,
    actual DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS potential_sales (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    currency VARCHAR(255),
    probability DOUBLE PRECISION NOT NULL DEFAULT 0,
    target_month INTEGER NOT NULL,
    target_year INTEGER NOT NULL,
    status VARCHAR(255),
    sale_type VARCHAR(20) DEFAULT 'PROJE'
);
