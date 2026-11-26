package com.marinarodriiphoto.backend.tools;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.marinarodriiphoto.backend.tools.PortfolioImportPlan.ExistingPhoto;
import com.marinarodriiphoto.backend.tools.PortfolioImportPlan.Photo;

final class PortfolioImportDatabase {
    private PortfolioImportDatabase() {}

    static List<ExistingPhoto> existingPhotos(Connection connection, boolean lock) throws SQLException {
        String sql = "SELECT category, display_order, image_url, import_source_path FROM portfolio_photos ORDER BY id";
        try (var statement = connection.createStatement();
             var rows = statement.executeQuery(lock ? sql + " FOR UPDATE" : sql)) {
            var result = new ArrayList<ExistingPhoto>();
            while (rows.next()) {
                result.add(new ExistingPhoto(rows.getString(1), rows.getInt(2), rows.getString(3), rows.getString(4)));
            }
            return result;
        }
    }

    static void insertPhotos(Connection connection, List<Photo> photos) throws SQLException {
        if (photos.isEmpty()) return;
        try (var insert = connection.prepareStatement("""
                INSERT INTO portfolio_photos
                   (category, display_order, published, original_filename, width, height, image_url, thumbnail_url, import_source_path)
                VALUES (?, ?, TRUE, ?, ?, ?, ?, ?, ?)
                """)) {
            for (Photo photo : photos) {
                insert.setString(1, photo.category());
                insert.setInt(2, photo.displayOrder());
                insert.setString(3, photo.originalFilename());
                insert.setInt(4, photo.width());
                insert.setInt(5, photo.height());
                insert.setString(6, photo.imageUrl());
                insert.setString(7, photo.thumbnailUrl());
                insert.setString(8, photo.importSourcePath());
                insert.addBatch();
            }
            int[] inserted = insert.executeBatch();
            if (inserted.length != photos.size()
                    || Arrays.stream(inserted).anyMatch(count -> count != 1 && count != Statement.SUCCESS_NO_INFO)) {
                throw new SQLException("The Portfolio batch did not report a successful insert for every photo.");
            }
        }
    }

}
