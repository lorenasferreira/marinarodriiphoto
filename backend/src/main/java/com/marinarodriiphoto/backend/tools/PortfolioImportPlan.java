package com.marinarodriiphoto.backend.tools;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

record PortfolioImportPlan(List<Photo> inserts, int skips, List<String> conflicts) {
    static PortfolioImportPlan compare(List<Photo> manifest, List<ExistingPhoto> existing) {
        var sources = existing.stream().map(ExistingPhoto::importSourcePath).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        var urls = existing.stream().map(ExistingPhoto::imageUrl).collect(Collectors.toSet());
        var positions = existing.stream().map(photo -> new Position(photo.category(), photo.displayOrder()))
                .collect(Collectors.toSet());
        var seen = new HashSet<String>();
        var inserts = new ArrayList<Photo>();
        var conflicts = new ArrayList<String>();
        int skips = 0;
        for (Photo photo : manifest) {
            if (!seen.add(photo.importSourcePath())) {
                throw new IllegalArgumentException("Duplicate source path in the import manifest.");
            }
            if (sources.contains(photo.importSourcePath())) {
                skips++;
            } else if (urls.contains(photo.imageUrl())) {
                conflicts.add(photo.importSourcePath() + " (image URL already used by an existing row)");
            } else if (positions.contains(new Position(photo.category(), photo.displayOrder()))) {
                conflicts.add(photo.importSourcePath() + " (category position already occupied)");
            } else {
                inserts.add(photo);
            }
        }
        return new PortfolioImportPlan(List.copyOf(inserts), skips, List.copyOf(conflicts));
    }

    record Photo(String category, int displayOrder, boolean published, String originalFilename, int width, int height,
                 String altText, String imageUrl, String thumbnailUrl, String cloudinaryAssetId,
                 String cloudinaryPublicId, String importSourcePath) {}

    record ExistingPhoto(String category, int displayOrder, String imageUrl, String importSourcePath) {}

    private record Position(String category, int displayOrder) {}
}
