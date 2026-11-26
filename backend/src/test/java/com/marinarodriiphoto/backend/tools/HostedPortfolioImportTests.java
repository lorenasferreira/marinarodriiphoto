package com.marinarodriiphoto.backend.tools;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import com.marinarodriiphoto.backend.tools.ImportDevelopmentPortfolio.Manifest;
import com.marinarodriiphoto.backend.tools.PortfolioImportPlan.Photo;
import com.marinarodriiphoto.backend.tools.ProvisionDevelopmentAdmins.Target;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.json.JsonMapper;

class HostedPortfolioImportTests {
    private static final Target TARGET = new Target("jdbc:mysql://mysql.railway.internal/railway", "writer", "railway", true);
    private static final Map<String, Integer> COUNTS = Map.of("publicity", 6, "events-bts", 6, "editorial-artistic", 51, "portraits", 26);
    private final Manifest valid = manifest();

    @TempDir
    Path directory;

    @Test
    void acceptsExactlyTheBundledManifestShape() throws Exception {
        var file = directory.resolve("valid.json");
        new JsonMapper().writeValue(file.toFile(), valid);
        assertEquals(valid, ImportHostedPortfolio.readManifest(file));
    }

    @Test
    void rejectsDuplicateFieldsTrailingJsonAndLocalDatabaseExportFields() throws Exception {
        String json = new JsonMapper().writeValueAsString(valid);
        for (String invalid : List.of(
                json.replace("\"total\":89", "\"total\":89,\"total\":89"),
                json + "{}",
                json.replace("\"total\":89", "\"total\":89,\"admin_accounts\":[]"),
                json.replace("\"published\":true", "\"published\":null"))) {
            var path = Files.writeString(directory.resolve("invalid.json"), invalid);
            assertThrows(IllegalArgumentException.class, () -> ImportHostedPortfolio.readManifest(path));
        }
    }

    @Test
    void rejectsDraftUploadsCloudinaryFieldsInvalidPathsAndCategoryCounts() throws Exception {
        String json = new JsonMapper().writeValueAsString(valid);
        for (String invalid : List.of(
                json.replace("\"published\":true", "\"published\":false"),
                json.replace("\"cloudinaryPublicId\":null", "\"cloudinaryPublicId\":\"local-upload\""),
                json.replace("photo-0.JPG", "../photo-0.JPG"),
                json.replace("\"portraits\":26", "\"portraits\":25"))) {
            var path = Files.writeString(directory.resolve("invalid.json"), invalid);
            assertThrows(IllegalArgumentException.class, () -> ImportHostedPortfolio.readManifest(path));
        }
    }

    @Test
    void dryRunRollsBackAndApplyCommitsOnlyThePlannedInserts() throws Exception {
        var previewDb = new JdbcFixture(List.of());
        var plan = ImportHostedPortfolio.importTransaction(previewDb.connection(), TARGET, valid, null);
        assertEquals(89, plan.inserts().size());
        assertTrue(previewDb.readOnly);
        assertEquals(1, previewDb.rollbacks);
        assertEquals(0, previewDb.inserted);
        assertEquals(0, previewDb.commits);

        var writeDb = new JdbcFixture(List.of());
        ImportHostedPortfolio.importTransaction(writeDb.connection(), TARGET, valid, plan);
        assertFalse(writeDb.readOnly);
        assertTrue(writeDb.locked);
        assertEquals(89, writeDb.inserted);
        assertEquals(1, writeDb.commits);
    }

    @Test
    void changedPlanAndFailedBatchRollBackWithoutCommitting() {
        var plan = PortfolioImportPlan.compare(valid.photos(), List.of());
        var row = valid.photos().getFirst();
        var changed = new JdbcFixture(List.<Object[]>of(new Object[]{row.category(), row.displayOrder(), "/different.jpg", null}));
        assertThrows(IllegalArgumentException.class,
                () -> ImportHostedPortfolio.importTransaction(changed.connection(), TARGET, valid, plan));
        assertEquals(0, changed.inserted);
        assertEquals(0, changed.commits);
        assertEquals(1, changed.rollbacks);

        var failed = new JdbcFixture(List.of());
        failed.failBatch = true;
        assertThrows(SQLException.class, () -> ImportHostedPortfolio.importTransaction(failed.connection(), TARGET, valid, plan));
        assertEquals(0, failed.commits);
        assertEquals(1, failed.rollbacks);
    }

    @Test
    void aRepeatPreviewReportsAllRowsSkippedAndWritesNothing() throws Exception {
        var rows = valid.photos().stream().map(p -> new Object[]{p.category(), p.displayOrder(), p.imageUrl(), p.importSourcePath()}).toList();
        var fixture = new JdbcFixture(rows);
        var plan = ImportHostedPortfolio.importTransaction(fixture.connection(), TARGET, valid, null);
        assertEquals(89, plan.skips());
        assertTrue(plan.inserts().isEmpty());
        assertTrue(plan.conflicts().isEmpty());
        assertEquals(0, fixture.inserted);
    }

    private static Manifest manifest() {
        List<Photo> photos = new ArrayList<>();
        COUNTS.forEach((category, count) -> {
            for (int position = 0; position < count; position++) {
                String filename = "photo-" + position + ".JPG";
                String path = category + "/" + filename;
                String source = "/assets/images/portfolio/" + path;
                photos.add(new Photo(category, position, true, filename, 640, 480, null, source,
                        "/assets/images/portfolio-thumbnails/" + path + ".jpg", null, null, source));
            }
        });
        return new Manifest(89, COUNTS, photos);
    }

    private static final class JdbcFixture {
        private final List<Object[]> existing;
        private boolean readOnly;
        private boolean locked;
        private boolean failBatch;
        private int commits;
        private int rollbacks;
        private int inserted;

        private JdbcFixture(List<Object[]> existing) {
            this.existing = existing;
        }

        Connection connection() {
            return proxy(Connection.class, (object, method, args) -> switch (method.getName()) {
                case "setReadOnly" -> { readOnly = (Boolean) args[0]; yield null; }
                case "setAutoCommit", "setTransactionIsolation" -> null;
                case "createStatement" -> proxy(Statement.class, (statement, action, parameters) -> switch (action.getName()) {
                    case "executeQuery" -> rows((String) parameters[0]);
                    case "close" -> null;
                    default -> throw new AssertionError(action.getName());
                });
                case "prepareStatement" -> insert((String) args[0]);
                case "commit" -> { commits++; yield null; }
                case "rollback" -> { rollbacks++; yield null; }
                default -> throw new AssertionError(method.getName());
            });
        }

        private ResultSet rows(String sql) {
            if (sql.startsWith("SELECT DATABASE()")) return result(List.<Object[]>of(new Object[]{"railway", "writer"}));
            if (sql.contains("FROM flyway_schema_history")) return result(List.<Object[]>of(new Object[]{3, 0}));
            if (sql.contains("information_schema.STATISTICS")) return result(List.<Object[]>of(new Object[]{1, 1}));
            if (sql.contains("information_schema.TABLES")) return result(List.<Object[]>of(new Object[]{"InnoDB", 1, 1}));
            if (sql.startsWith("SELECT category")) {
                locked = sql.endsWith(" FOR UPDATE");
                return result(existing);
            }
            throw new AssertionError("Unexpected SQL.");
        }

        private static ResultSet result(List<Object[]> rows) {
            var cursor = new AtomicInteger(-1);
            return proxy(ResultSet.class, (object, method, args) -> switch (method.getName()) {
                case "next" -> cursor.incrementAndGet() < rows.size();
                case "getString", "getInt" -> rows.get(cursor.get())[(Integer) args[0] - 1];
                case "close" -> null;
                default -> throw new AssertionError(method.getName());
            });
        }

        private PreparedStatement insert(String sql) {
            assertTrue(sql.startsWith("INSERT INTO portfolio_photos"));
            assertFalse(readOnly);
            return proxy(PreparedStatement.class, (object, method, args) -> switch (method.getName()) {
                case "setString", "setInt", "close" -> null;
                case "addBatch" -> { inserted++; yield null; }
                case "executeBatch" -> {
                    if (failBatch) throw new SQLException("Fixture failure");
                    var results = new int[inserted];
                    java.util.Arrays.fill(results, 1);
                    yield results;
                }
                default -> throw new AssertionError(method.getName());
            });
        }

        private static <T> T proxy(Class<T> type, InvocationHandler handler) {
            return type.cast(Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, handler));
        }
    }
}
