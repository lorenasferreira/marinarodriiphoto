package com.marinarodriiphoto.backend.config.admin;

import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping(AdminSecurityConfiguration.BASE)
class AdminSessionController {
    private final JdbcOperations jdbc;
    private final UserDetailsService accounts;
    private final PasswordEncoder encoder;

    AdminSessionController(JdbcOperations jdbc, UserDetailsService accounts, PasswordEncoder encoder) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.encoder = encoder;
    }

    @GetMapping("/csrf")
    CsrfResponse csrf(CsrfToken csrf) {
        return new CsrfResponse(csrf.getHeaderName(), csrf.getToken());
    }

    @GetMapping("/session")
    SessionResponse session(@AuthenticationPrincipal AdminPrincipal principal) {
        return new SessionResponse(principal.getUsername(), principal.passwordChangeRequired());
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void changePassword(@AuthenticationPrincipal AdminPrincipal principal, @RequestBody PasswordChange change,
            Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        String currentPassword = change.currentPassword();
        String newPassword = change.newPassword();
        if (currentPassword == null || currentPassword.getBytes(StandardCharsets.UTF_8).length > 72
                || newPassword == null || newPassword.length() < 12 || newPassword.isBlank()
                || newPassword.getBytes(StandardCharsets.UTF_8).length > 72 || newPassword.equals(currentPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        AdminPrincipal current;
        try {
            current = (AdminPrincipal) accounts.loadUserByUsername(principal.getUsername());
        } catch (UsernameNotFoundException failure) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (current.credentialVersion() != principal.credentialVersion()
                || !encoder.matches(currentPassword, current.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (jdbc.update("""
                UPDATE admin_accounts SET password_hash = ?, password_change_required = FALSE,
                    credential_version = credential_version + 1
                WHERE email = ? AND enabled = TRUE AND credential_version = ?
                """, encoder.encode(newPassword), principal.getUsername(), principal.credentialVersion()) != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    record CsrfResponse(String headerName, String token) {}
    record SessionResponse(String email, boolean passwordChangeRequired) {}
    record PasswordChange(String currentPassword, String newPassword) {
        @Override
        public String toString() {
            return "PasswordChange[redacted]";
        }
    }
}
