ALTER TABLE admin_accounts
    ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN credential_version BIGINT NOT NULL DEFAULT 0;
