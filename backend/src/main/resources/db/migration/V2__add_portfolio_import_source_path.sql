ALTER TABLE portfolio_photos
    ADD COLUMN import_source_path VARCHAR(512) COLLATE utf8mb4_0900_bin NULL,
    ADD CONSTRAINT uq_portfolio_photos_import_source_path UNIQUE (import_source_path);
