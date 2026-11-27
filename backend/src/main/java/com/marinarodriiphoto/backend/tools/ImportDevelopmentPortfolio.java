package com.marinarodriiphoto.backend.tools;

import java.io.Console;
import java.io.IOException;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import com.marinarodriiphoto.backend.tools.PortfolioImportPlan.Photo;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/** Local, interactive importer. No Spring application or migration runner is started. */
public final class ImportDevelopmentPortfolio {
    private static final String DATABASE = "marinarodriiphoto_dev";
    private static final String ACCOUNT = "marina_dev";
    private static final String JDBC_URL = "jdbc:mysql://127.0.0.1:8889/" + DATABASE;
    private static final Map<String, Integer> COUNTS =
            Map.of("publicity", 6, "events-bts", 6, "editorial-artistic", 51, "portraits", 26);

    public static void main(String[] args) {
        Console console = System.console();
        if (console == null || args.length != 1 || !List.of("--dry-run", "--apply").contains(args[0])) {
            System.err.println("From backend/, use an interactive terminal and pass --dry-run or --apply.");
            System.exit(1);
            return;
        }
        int status = run(console, "--apply".equals(args[0]));
        if (status != 0) System.exit(status);
    }

    private static int run(Console console, boolean apply) {
        char[] password = null;
        try {
            Manifest manifest = readManifest();
            validateManifest(manifest);
            console.printf("Validated %d originals and thumbnails. Target is %s via local MySQL port 8889.%n",
                    manifest.total(), DATABASE);
            if (apply && !"IMPORT".equals(console.readLine("Type IMPORT to apply the development import: "))) {
                console.printf("Cancelled.%n");
                return 0;
            }
            password = console.readPassword("MySQL password for marina_dev: ");
            if (password == null || password.length == 0) return 1;

            try (Connection connection = DriverManager.getConnection(JDBC_URL, ACCOUNT, new String(password))) {
                connection.setReadOnly(!apply);
                verifyTarget(connection);
                connection.setTransactionIsolation(apply ? Connection.TRANSACTION_SERIALIZABLE
                        : Connection.TRANSACTION_REPEATABLE_READ);
                connection.setAutoCommit(false);
                try {
                    var plan = PortfolioImportPlan.compare(manifest.photos(), PortfolioImportDatabase.existingPhotos(connection, apply));
                    console.printf("Expected inserts: %d | Skips: %d | Conflicts: %d%n",
                            plan.inserts().size(), plan.skips(), plan.conflicts().size());
                    plan.conflicts().forEach(conflict -> console.printf("Conflict: %s%n", conflict));
                    if (!apply || !plan.conflicts().isEmpty()) {
                        connection.rollback();
                        console.printf("No rows written.%n");
                        return plan.conflicts().isEmpty() ? 0 : 2;
                    }
                    PortfolioImportDatabase.insertPhotos(connection, plan.inserts());
                    connection.commit();
                    console.printf("Inserted %d development photos.%n", plan.inserts().size());
                } catch (SQLException | RuntimeException failure) {
                    connection.rollback();
                    throw failure;
                }
            }
            return 0;
        } catch (IOException failure) {
            console.printf("Could not run the verified manifest preview from backend/.%n");
            return 1;
        } catch (InterruptedException failure) {
            Thread.currentThread().interrupt();
            console.printf("Manifest validation interrupted.%n");
            return 1;
        } catch (IllegalArgumentException failure) {
            console.printf("%s%n", failure.getMessage());
            return 1;
        } catch (SQLException failure) {
            console.printf("Database operation failed (SQL state %s, error %d). Check the development target before retrying.%n",
                    failure.getSQLState(), failure.getErrorCode());
            return 1;
        } finally {
            if (password != null) Arrays.fill(password, '\0');
        }
    }

    private static Manifest readManifest() throws IOException, InterruptedException {
        var process = new ProcessBuilder("node", "scripts/preview-portfolio-import.js")
                .directory(Path.of("../frontend").toFile()).redirectError(ProcessBuilder.Redirect.INHERIT).start();
        try (var output = process.getInputStream()) {
            byte[] json = output.readAllBytes();
            if (process.waitFor() != 0) throw new IllegalArgumentException("Local Portfolio asset validation failed.");
            return new JsonMapper().readValue(json, Manifest.class);
        } catch (JacksonException failure) {
            throw new IllegalArgumentException("The preview did not return a valid Portfolio manifest.", failure);
        } finally {
            if (process.isAlive()) process.destroy();
        }
    }

    static void validateManifest(Manifest manifest) {
        if (manifest == null || manifest.total() != 89 || manifest.photos() == null
                || manifest.photos().size() != 89 || !COUNTS.equals(manifest.counts())) {
            throw new IllegalArgumentException("Expected the verified 89-photo Portfolio manifest.");
        }
        var positions = new HashMap<String, Integer>();
        var sources = new HashSet<String>();
        for (Photo photo : manifest.photos()) {
            if (photo == null || photo.category() == null || !COUNTS.containsKey(photo.category())
                    || photo.originalFilename() == null || photo.originalFilename().length() > 255
                    || !photo.originalFilename().matches("[A-Za-z0-9_-]+\\.[A-Za-z0-9]+")) {
                throw new IllegalArgumentException("The Portfolio manifest contains an invalid category or filename.");
            }
            int position = positions.getOrDefault(photo.category(), 0);
            String source = "/assets/images/portfolio/" + photo.category() + "/" + photo.originalFilename();
            String thumbnail = "/assets/images/portfolio-thumbnails/" + photo.category() + "/" + photo.originalFilename() + ".jpg";
            if (position != photo.displayOrder() || !photo.published()
                    || photo.width() < 1 || photo.height() < 1 || !source.equals(photo.imageUrl())
                    || !source.equals(photo.importSourcePath()) || !thumbnail.equals(photo.thumbnailUrl())
                    || !sources.add(source) || photo.altText() != null || photo.cloudinaryAssetId() != null
                    || photo.cloudinaryPublicId() != null) {
                throw new IllegalArgumentException("The Portfolio manifest contains invalid rows, positions, or source paths.");
            }
            positions.put(photo.category(), position + 1);
        }
        if (!COUNTS.equals(positions)) throw new IllegalArgumentException("Portfolio category counts do not match.");
    }

    private static void verifyTarget(Connection connection) throws SQLException {
        try (var statement = connection.createStatement();
             var row = statement.executeQuery("SELECT DATABASE(), SUBSTRING_INDEX(CURRENT_USER(), '@', 1)")) {
            if (!row.next() || !DATABASE.equals(row.getString(1)) || !ACCOUNT.equals(row.getString(2))) {
                throw new IllegalArgumentException("The connection does not match the development database and account.");
            }
        }
    }

    record Manifest(int total, Map<String, Integer> counts, List<Photo> photos) {}
}
