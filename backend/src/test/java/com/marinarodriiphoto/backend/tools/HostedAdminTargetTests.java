package com.marinarodriiphoto.backend.tools;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

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

    private static Map<String, String> environment(String url) {
        return Map.of("DB_URL", url, "DB_USERNAME", "portfolio_writer", "SPRING_PROFILES_ACTIVE", "production");
    }
}
