CREATE TABLE admin_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) COLLATE utf8mb4_bin NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT uq_admin_accounts_email UNIQUE (email),
    CONSTRAINT chk_admin_accounts_normalized_email CHECK (
        CHAR_LENGTH(email) > 0
        AND CAST(email AS BINARY) = CAST(LOWER(TRIM(email)) AS BINARY)
    )
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE portfolio_photos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category VARCHAR(20) COLLATE utf8mb4_bin NOT NULL,
    display_order INT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    original_filename VARCHAR(255) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    alt_text VARCHAR(255),
    image_url VARCHAR(2048) NOT NULL,
    thumbnail_url VARCHAR(2048) NOT NULL,
    cloudinary_asset_id VARCHAR(255),
    cloudinary_public_id VARCHAR(255),
    PRIMARY KEY (id),
    INDEX idx_portfolio_photos_category_order (category, display_order, id),
    CONSTRAINT chk_portfolio_photos_category CHECK (
        CAST(category AS BINARY) IN ('publicity', 'events-bts', 'editorial-artistic', 'portraits')
    ),
    CONSTRAINT chk_portfolio_photos_display_order CHECK (display_order >= 0),
    CONSTRAINT chk_portfolio_photos_dimensions CHECK (width > 0 AND height > 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;
