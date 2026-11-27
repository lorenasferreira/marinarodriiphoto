package com.marinarodriiphoto.backend.config.admin;

import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;

final class AdminPrincipal extends User {
    private final long credentialVersion;
    private final boolean passwordChangeRequired;

    AdminPrincipal(String email, String passwordHash, long credentialVersion, boolean passwordChangeRequired) {
        super(email, passwordHash, AuthorityUtils.createAuthorityList(
                passwordChangeRequired ? "ROLE_PASSWORD_CHANGE_REQUIRED" : "ROLE_PORTFOLIO_ADMIN"));
        this.credentialVersion = credentialVersion;
        this.passwordChangeRequired = passwordChangeRequired;
    }

    long credentialVersion() {
        return credentialVersion;
    }

    boolean passwordChangeRequired() {
        return passwordChangeRequired;
    }
}
