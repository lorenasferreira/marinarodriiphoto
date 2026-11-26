package com.marinarodriiphoto.backend.tools;

import java.io.Console;
import java.net.URI;
import java.nio.CharBuffer;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Interactive CLI for the local schema or an explicitly selected hosted Railway schema. */
public final class ProvisionDevelopmentAdmins {
    private static final Target LOCAL = new Target(
            "jdbc:mysql://127.0.0.1:8889/marinarodriiphoto_dev", "marina_dev", "marinarodriiphoto_dev", false);

    public static void main(String[] args) {
        Console console = System.console();
        if (console == null || (args.length != 0 && !(args.length == 1 && "--hosted".equals(args[0])))) {
            System.err.println("Use an interactive terminal. Pass --hosted only inside the Railway backend service.");
            System.exit(1);
            return;
        }
        int status = provision(console, args.length == 1);
        if (status != 0) System.exit(status);
    }

    private static int provision(Console console, boolean hosted) {
        char[] databasePassword = null;
        char[] marinaPassword = null;
        char[] lorenaPassword = null;
        try {
            Target target = hosted ? hostedTarget(System.getenv()) : LOCAL;
            databasePassword = hosted ? hostedPassword(System.getenv("DB_PASSWORD")) : null;
            console.printf("%s database target: %s.%n", hosted ? "Hosted" : "Development", target.database());
            String marina = readEmail(console, "Marina");
            String lorena = readEmail(console, "Lorena");
            if (marina.equals(lorena)) throw new IllegalArgumentException("Enter two distinct email addresses.");

            if (!hosted) databasePassword = readSecret(console, "MySQL password for marina_dev");
            marinaPassword = readAdminPassword(console, "Marina", databasePassword);
            lorenaPassword = readAdminPassword(console, "Lorena", databasePassword);
            if (Arrays.equals(marinaPassword, lorenaPassword)) {
                throw new IllegalArgumentException("Choose a different password for each admin.");
            }
            console.printf("%s%n", hosted ? "This will create both accounts in an empty admin table."
                    : "This will create both accounts or update the passwords for the same two emails.");
            String confirmation = hosted ? "PROVISION " + target.database() : "PROVISION";
            if (!confirmation.equals(console.readLine("Type %s to proceed: ", confirmation))) {
                console.printf("Cancelled.%n");
                return 0;
            }

            try (Connection connection = DriverManager.getConnection(target.url(), target.username(), new String(databasePassword))) {
                verifyTarget(connection, target);
                connection.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
                connection.setAutoCommit(false);
                try {
                    saveAccounts(connection, List.of(new Admin(marina, marinaPassword), new Admin(lorena, lorenaPassword)), hosted);
                    connection.commit();
                } catch (SQLException | RuntimeException failure) {
                    connection.rollback();
                    throw failure;
                }
            }
            console.printf("Account provisioning complete.%n");
            return 0;
        } catch (IllegalArgumentException failure) {
            console.printf("%s%n", failure.getMessage());
            return 1;
        } catch (SQLException failure) {
            console.printf("Database operation failed (SQL state %s, error %d). Verify the intended target before retrying.%n",
                    failure.getSQLState(), failure.getErrorCode());
            return 1;
        } finally {
            clear(databasePassword);
            clear(marinaPassword);
            clear(lorenaPassword);
        }
    }

    static Target hostedTarget(Map<String, String> environment) {
        if (!"production".equals(environment.get("SPRING_PROFILES_ACTIVE"))) {
            throw new IllegalArgumentException("Hosted provisioning requires SPRING_PROFILES_ACTIVE=production.");
        }
        String url = environment.getOrDefault("DB_URL", "");
        String username = environment.getOrDefault("DB_USERNAME", "");
        if (!url.startsWith("jdbc:mysql://") || username.isBlank()) throw invalidHostedTarget();
        URI uri;
        try {
            uri = URI.create(url.substring("jdbc:".length()));
        } catch (IllegalArgumentException failure) {
            throw invalidHostedTarget();
        }
        if (uri.getHost() == null || !uri.getHost().endsWith(".railway.internal") || uri.getUserInfo() != null
                || uri.getRawQuery() != null || uri.getRawFragment() != null
                || uri.getPort() == 0 || uri.getPort() > 65535
                || !uri.getRawPath().matches("/[a-zA-Z0-9_][a-zA-Z0-9_-]*")) {
            throw invalidHostedTarget();
        }
        return new Target(url, username, uri.getPath().substring(1), true);
    }

    private static IllegalArgumentException invalidHostedTarget() {
        return new IllegalArgumentException("Set DB_URL to a private Railway MySQL JDBC URL and set DB_USERNAME separately.");
    }

    private static char[] hostedPassword(String password) {
        if (password == null || password.isEmpty()) throw new IllegalArgumentException("Set the DB_PASSWORD secret.");
        return password.toCharArray();
    }

    private static String readEmail(Console console, String name) {
        char[] input = readSecret(console, name + " email");
        try {
            String email = new String(input).strip().toLowerCase(Locale.ROOT);
            if (email.length() > 254 || !email.matches("[^@\\s]+@[^@\\s]+")) {
                throw new IllegalArgumentException("Enter a valid email address.");
            }
            return email;
        } finally {
            clear(input);
        }
    }

    private static char[] readAdminPassword(Console console, String name, char[] databasePassword) {
        char[] password = readSecret(console, name + " admin password");
        boolean accepted = false;
        try {
            int bytes = StandardCharsets.UTF_8.encode(CharBuffer.wrap(password)).remaining();
            if (password.length < 12 || bytes > 72) {
                throw new IllegalArgumentException("Choose a password of at least 12 characters and at most 72 UTF-8 bytes.");
            }
            if (Arrays.equals(password, databasePassword)) {
                throw new IllegalArgumentException("Choose an admin password distinct from the MySQL password.");
            }
            char[] confirmation = readSecret(console, "Confirm " + name + " admin password");
            try {
                if (!Arrays.equals(password, confirmation)) {
                    throw new IllegalArgumentException("The password confirmation does not match.");
                }
                accepted = true;
                return password;
            } finally {
                clear(confirmation);
            }
        } finally {
            if (!accepted) clear(password);
        }
    }

    private static char[] readSecret(Console console, String prompt) {
        char[] input = console.readPassword("%s: ", prompt);
        if (input == null || input.length == 0) throw new IllegalArgumentException("Input is required.");
        return input;
    }

    private static void clear(char[] secret) {
        if (secret != null) Arrays.fill(secret, '\0');
    }

    private static void verifyTarget(Connection connection, Target target) throws SQLException {
        try (var statement = connection.createStatement();
             var row = statement.executeQuery("SELECT DATABASE(), SUBSTRING_INDEX(CURRENT_USER(), '@', 1)")) {
            if (!row.next() || !target.database().equals(row.getString(1)) || !target.username().equals(row.getString(2))) {
                throw new IllegalArgumentException("The connection does not match the intended database and account.");
            }
        }
        if (target.hosted()) {
            try (var statement = connection.createStatement();
                 var row = statement.executeQuery("""
                        SELECT COUNT(DISTINCT version) FROM flyway_schema_history
                        WHERE success = TRUE AND version IN ('1', '2', '3')
                        """)) {
                if (!row.next() || row.getInt(1) != 3) {
                    throw new IllegalArgumentException("Verify that Flyway V1, V2 and V3 succeeded before provisioning.");
                }
            }
        }
    }

    private static void saveAccounts(Connection connection, List<Admin> admins, boolean createOnly) throws SQLException {
        Map<String, String> existing = new HashMap<>();
        try (var statement = connection.createStatement();
             var rows = statement.executeQuery("SELECT email, password_hash FROM admin_accounts FOR UPDATE")) {
            while (rows.next()) existing.put(rows.getString(1), rows.getString(2));
        }
        if (createOnly && !existing.isEmpty()) {
            throw new IllegalArgumentException("Hosted provisioning requires an empty admin_accounts table.");
        }
        if (!existing.isEmpty() && !existing.keySet().equals(Set.of(admins.get(0).email(), admins.get(1).email()))) {
            throw new IllegalArgumentException("The database already contains a different set of admin accounts.");
        }

        var encoder = new BCryptPasswordEncoder(12);
        try (var insert = connection.prepareStatement("INSERT INTO admin_accounts (email, password_hash) VALUES (?, ?)");
             var update = connection.prepareStatement("UPDATE admin_accounts SET password_hash = ? WHERE email = ?")) {
            for (Admin admin : admins) {
                var password = CharBuffer.wrap(admin.password());
                String currentHash = existing.get(admin.email());
                if (currentHash == null) {
                    insert.setString(1, admin.email());
                    insert.setString(2, encoder.encode(password));
                    insert.executeUpdate();
                } else if (!encoder.matches(password, currentHash)) {
                    update.setString(1, encoder.encode(password));
                    update.setString(2, admin.email());
                    update.executeUpdate();
                }
            }
        }
    }

    private record Admin(String email, char[] password) {}

    record Target(String url, String username, String database, boolean hosted) {}
}
