package com.marinarodriiphoto.backend.tools;

import java.io.Console;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import com.marinarodriiphoto.backend.tools.ImportDevelopmentPortfolio.Manifest;
import com.marinarodriiphoto.backend.tools.ProvisionDevelopmentAdmins.Target;
import tools.jackson.core.JacksonException;
import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.json.JsonMapper;

/** Manually launched inside the Railway backend container. It does not start Spring or Flyway. */
public final class ImportHostedPortfolio {
    private static final int MAX_MANIFEST_BYTES = 256 * 1024;

    public static void main(String[] args) {
        if (args.length != 2 || !List.of("--dry-run", "--apply").contains(args[0])) {
            System.err.println("Usage: ImportHostedPortfolio (--dry-run | --apply) MANIFEST.json");
            System.exit(1);
            return;
        }

        boolean apply = "--apply".equals(args[0]);
        Console console = System.console();
        if (apply && console == null) {
            System.err.println("Apply requires an interactive Railway SSH terminal.");
            System.exit(1);
            return;
        }

        int status;
        try {
            var manifest = readManifest(Path.of(args[1]));
            status = run(manifest, System.getenv(), apply, console);
        } catch (IOException | IllegalArgumentException failure) {
            System.err.println(failure instanceof IOException ? "Could not read the supplied Portfolio manifest." : failure.getMessage());
            status = 1;
        } catch (SQLException failure) {
            System.err.printf("Database operation failed (SQL state %s, error %d). Run a dry run to verify the outcome.%n",
                    failure.getSQLState(), failure.getErrorCode());
            status = 1;
        }
        if (status != 0) System.exit(status);
    }

    private static int run(Manifest manifest, Map<String, String> env, boolean apply, Console console) throws SQLException {
        Target target = ProvisionDevelopmentAdmins.hostedTarget(env);
        String password = env.get("DB_PASSWORD");
        if (password == null || password.isEmpty()) throw new IllegalArgumentException("Set the DB_PASSWORD secret.");
        System.out.printf("Verified manifest: %d bundled photos. Configured hosted schema: %s.%n", manifest.total(), target.database());

        PortfolioImportPlan preview;
        try (Connection connection = DriverManager.getConnection(target.url(), target.username(), password)) {
            preview = importTransaction(connection, target, manifest, null);
        }
        System.out.printf("Expected inserts: %d | Skips: %d | Conflicts: %d%n",
                preview.inserts().size(), preview.skips(), preview.conflicts().size());
        preview.conflicts().forEach(conflict -> System.out.println("Conflict: " + conflict));
        if (!preview.conflicts().isEmpty() || !apply || preview.inserts().isEmpty()) {
            System.out.println("No rows written.");
            return preview.conflicts().isEmpty() ? 0 : 2;
        }

        String confirmation = "IMPORT " + target.database();
        if (!confirmation.equals(console.readLine("Type %s to insert %d photo rows: ", confirmation, preview.inserts().size()))) {
            System.out.println("Cancelled. No rows written.");
            return 0;
        }

        try (Connection connection = DriverManager.getConnection(target.url(), target.username(), password)) {
            var applied = importTransaction(connection, target, manifest, preview);
            System.out.printf("Committed %d photos. Preserved %d existing imports.%n", applied.inserts().size(), applied.skips());
        }
        return 0;
    }

    static Manifest readManifest(Path path) throws IOException {
        if (!Files.isRegularFile(path)) throw new IllegalArgumentException("Supply a regular JSON manifest file.");
        try (var input = Files.newInputStream(path)) {
            byte[] data = input.readNBytes(MAX_MANIFEST_BYTES + 1);
            if (data.length > MAX_MANIFEST_BYTES) throw new IllegalArgumentException("The manifest exceeds 256 KiB.");
            var mapper = JsonMapper.builder()
                    .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
                    .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                    .enable(DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES)
                    .enable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
                    .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                    .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
                    .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
                    .build();
            Manifest manifest = mapper.readValue(data, Manifest.class);
            ImportDevelopmentPortfolio.validateManifest(manifest);
            return manifest;
        } catch (JacksonException failure) {
            throw new IllegalArgumentException("The supplied file does not match the Portfolio manifest format.");
        }
    }

    // A null expectation means preview only. Apply must match the plan the operator confirmed.
    static PortfolioImportPlan importTransaction(Connection connection, Target target, Manifest manifest,
                                                   PortfolioImportPlan expected) throws SQLException {
        boolean apply = expected != null;
        connection.setReadOnly(!apply);
        connection.setTransactionIsolation(apply ? Connection.TRANSACTION_SERIALIZABLE : Connection.TRANSACTION_REPEATABLE_READ);
        connection.setAutoCommit(false);
        try {
            verifySchema(connection, target);
            var current = PortfolioImportPlan.compare(manifest.photos(), PortfolioImportDatabase.existingPhotos(connection, apply));
            if (!apply) {
                connection.rollback();
            } else {
                if (!current.conflicts().isEmpty() || !current.equals(expected)) {
                    throw new IllegalArgumentException("Hosted data changed after the preview. No rows inserted. Run a new dry run.");
                }
                PortfolioImportDatabase.insertPhotos(connection, current.inserts());
                connection.commit();
            }
            return current;
        } catch (SQLException | RuntimeException failure) {
            connection.rollback();
            throw failure;
        }
    }

    private static void verifySchema(Connection connection, Target target) throws SQLException {
        try (var statement = connection.createStatement();
             var row = statement.executeQuery("SELECT DATABASE(), SUBSTRING_INDEX(CURRENT_USER(), '@', 1)")) {
            if (!row.next() || !target.database().equals(row.getString(1)) || !target.username().equals(row.getString(2))) {
                throw new IllegalArgumentException("The connection does not match the intended hosted schema and account.");
            }
        }
        try (var statement = connection.createStatement();
             var row = statement.executeQuery("""
                     SELECT COUNT(DISTINCT CASE WHEN success AND version IN ('1','2','3') THEN version END),
                            COUNT(CASE WHEN NOT success THEN 1 END)
                     FROM flyway_schema_history
                     """)) {
            if (!row.next() || row.getInt(1) != 3 || row.getInt(2) != 0) {
                throw new IllegalArgumentException("The hosted schema must have successful Flyway V1, V2 and V3.");
            }
        }
        try (var statement = connection.createStatement();
             var row = statement.executeQuery("""
                     SELECT COUNT(*), COUNT(CASE WHEN NON_UNIQUE = 0 AND COLUMN_NAME = 'import_source_path'
                                                  AND SUB_PART IS NULL THEN 1 END)
                     FROM information_schema.STATISTICS
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portfolio_photos'
                       AND INDEX_NAME = 'uq_portfolio_photos_import_source_path'
                     """)) {
            if (!row.next() || row.getInt(1) != 1 || row.getInt(2) != 1) {
                throw new IllegalArgumentException("The hosted Portfolio table is missing its full source-path uniqueness constraint.");
            }
        }
        try (var statement = connection.createStatement();
             var row = statement.executeQuery("""
                     SELECT t.ENGINE,
                            COUNT(CASE WHEN c.COLUMN_NAME = 'title' AND c.DATA_TYPE = 'varchar'
                                        AND c.IS_NULLABLE = 'YES' AND c.CHARACTER_MAXIMUM_LENGTH = 160 THEN 1 END),
                            COUNT(CASE WHEN c.COLUMN_NAME = 'import_source_path' AND c.DATA_TYPE = 'varchar'
                                        AND c.IS_NULLABLE = 'YES' AND c.CHARACTER_MAXIMUM_LENGTH = 512
                                        AND c.COLLATION_NAME = 'utf8mb4_0900_bin' THEN 1 END)
                     FROM information_schema.TABLES t
                     JOIN information_schema.COLUMNS c USING (TABLE_SCHEMA, TABLE_NAME)
                     WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_NAME = 'portfolio_photos'
                     GROUP BY t.ENGINE
                     """)) {
            if (!row.next() || !"InnoDB".equalsIgnoreCase(row.getString(1)) || row.getInt(2) != 1 || row.getInt(3) != 1) {
                throw new IllegalArgumentException("The hosted Portfolio table does not match the expected InnoDB schema.");
            }
        }
    }
}
