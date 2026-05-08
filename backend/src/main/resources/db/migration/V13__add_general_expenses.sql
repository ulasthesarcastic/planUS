CREATE TABLE general_expenses (
    id           VARCHAR(255) PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    amount       DOUBLE PRECISION NOT NULL,
    start_month  INTEGER NOT NULL,
    start_year   INTEGER NOT NULL,
    end_month    INTEGER NOT NULL,
    end_year     INTEGER NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP
);
