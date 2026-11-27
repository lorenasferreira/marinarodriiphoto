package com.marinarodriiphoto.backend.tools;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class HostedAdminTargetTests {
    @Test
    void selectsOnlyTheExplicitPrivateRailwayDatabase() {
        var target = ProvisionDevelopmentAdmins.hostedTarget(environment("jdbc:mysql://mysql.railway.internal:3306/railway"));
        assertEquals("railway", target.database());
        assertEquals("portfolio_writer", target.username());
    }

    @Test
    void rejectsLocalMampPublicHostsAndUrlsWithCredentials() {
        for (String url : List.of(
                "jdbc:mysql://localhost:8889/marinarodriiphoto_dev",
                "jdbc:mysql://mysql.example.test:3306/railway",
                "jdbc:mysql://user:secret@mysql.railway.internal/railway",
                "jdbc:mysql://mysql.railway.internal/railway?password=secret",
                "mysql://mysql.railway.internal/railway")) {
            var error = assertThrows(IllegalArgumentException.class,
                    () -> ProvisionDevelopmentAdmins.hostedTarget(environment(url)));
            assertEquals("Set DB_URL to a private Railway MySQL JDBC URL and set DB_USERNAME separately.", error.getMessage());
        }
    }

    @Test
    void requiresProductionProfileAndSeparateDatabaseUsername() {
        assertThrows(IllegalArgumentException.class, () -> ProvisionDevelopmentAdmins.hostedTarget(Map.of(
                "DB_URL", "jdbc:mysql://mysql.railway.internal/railway", "DB_USERNAME", "portfolio_writer")));
        assertThrows(IllegalArgumentException.class, () -> ProvisionDevelopmentAdmins.hostedTarget(Map.of(
                "DB_URL", "jdbc:mysql://mysql.railway.internal/railway", "SPRING_PROFILES_ACTIVE", "production")));
    }

    @Test
    void resetTargetsOneEnabledAccountAndStoresOnlyAHash() throws Exception {
        var connection = mock(Connection.class);
        var select = mock(PreparedStatement.class);
        var update = mock(PreparedStatement.class);
        var row = mock(ResultSet.class);
        when(connection.prepareStatement(contains("WHERE email = ? AND enabled = TRUE FOR UPDATE"))).thenReturn(select);
        when(connection.prepareStatement(contains("""
                password_change_required = TRUE,
                    credential_version = credential_version + 1 WHERE email = ? AND enabled = TRUE"""))).thenReturn(update);
        when(select.executeQuery()).thenReturn(row);
        when(row.next()).thenReturn(false, true, true);
        var encoder = new BCryptPasswordEncoder(4);
        String temporary = "test-only-temporary-password";
        when(row.getString(1)).thenReturn(encoder.encode(temporary), encoder.encode("old-test-password"));
        String email = "marina@example.test";

        assertThrows(IllegalArgumentException.class,
                () -> ProvisionDevelopmentAdmins.resetAccount(connection, email, temporary.toCharArray()));
        assertThrows(IllegalArgumentException.class,
                () -> ProvisionDevelopmentAdmins.resetAccount(connection, email, temporary.toCharArray()));
        verify(update, never()).executeUpdate();

        when(update.executeUpdate()).thenReturn(1);
        ProvisionDevelopmentAdmins.resetAccount(connection, email, temporary.toCharArray());
        var hash = ArgumentCaptor.forClass(String.class);
        verify(update).setString(eq(1), hash.capture());
        verify(update).setString(2, email);
        assertTrue(hash.getValue().startsWith("$2a$12$"));
        assertTrue(encoder.matches(temporary, hash.getValue()));
        verify(update).executeUpdate();
    }

    private static Map<String, String> environment(String url) {
        return Map.of("DB_URL", url, "DB_USERNAME", "portfolio_writer", "SPRING_PROFILES_ACTIVE", "production");
    }
}
