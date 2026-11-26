package com.marinarodriiphoto.backend.tools;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;
import com.marinarodriiphoto.backend.tools.PortfolioImportPlan.ExistingPhoto;
import com.marinarodriiphoto.backend.tools.PortfolioImportPlan.Photo;
import tools.jackson.databind.json.JsonMapper;

class PortfolioImportPlanTests {
    private static final Photo FIRST = photo("a.jpg", 0);
    private static final Photo SECOND = photo("b.jpg", 1);

    @Test
    void reportsInsertsThenSkipsTheSamePhotosOnRerunEvenAfterEdits() {
        var manifest = List.of(FIRST, SECOND);
        var empty = PortfolioImportPlan.compare(manifest, List.of());
        assertEquals(manifest, empty.inserts());
        assertEquals(0, empty.skips());
        assertEquals(List.of(), empty.conflicts());

        var rerun = PortfolioImportPlan.compare(manifest, List.of(
                new ExistingPhoto("portraits", 5, "https://example.test/replaced.jpg", FIRST.importSourcePath()),
                existing(SECOND)));
        assertEquals(List.of(), rerun.inserts());
        assertEquals(2, rerun.skips());
        assertEquals(List.of(), rerun.conflicts());
    }

    @Test
    void partialImportPreservesExistingRowsAndSchedulesOnlyMissingOnes() {
        var plan = PortfolioImportPlan.compare(List.of(FIRST, SECOND), List.of(existing(FIRST)));
        assertEquals(List.of(SECOND), plan.inserts());
        assertEquals(1, plan.skips());
        assertEquals(List.of(), plan.conflicts());
    }

    @Test
    void detectsOrderAndUrlConflictsWithoutSchedulingEitherCandidate() {
        var plan = PortfolioImportPlan.compare(List.of(FIRST, SECOND), List.of(
                new ExistingPhoto("publicity", 0, "/unrelated.jpg", "/unrelated.jpg"),
                new ExistingPhoto("portraits", 4, SECOND.imageUrl(), null)));
        assertEquals(List.of(), plan.inserts());
        assertEquals(0, plan.skips());
        assertEquals(List.of(
                FIRST.importSourcePath() + " (category position already occupied)",
                SECOND.importSourcePath() + " (image URL already used by an existing row)"), plan.conflicts());
    }

    @Test
    void rejectsDuplicateSourcePathsInTheManifest() {
        assertThrows(IllegalArgumentException.class,
                () -> PortfolioImportPlan.compare(List.of(FIRST, FIRST), List.of()));
    }

    @Test
    void readsPreviewJsonWithCasePreservedInTheSourcePath() {
        var manifest = new JsonMapper().readValue("""
                {"total":1,"counts":{"publicity":1},"photos":[
                  {"category":"publicity","displayOrder":0,"published":true,"originalFilename":"A.JPG",
                   "width":640,"height":480,"altText":null,
                   "imageUrl":"/assets/images/portfolio/publicity/A.JPG",
                   "thumbnailUrl":"/assets/images/portfolio-thumbnails/publicity/A.JPG.jpg",
                   "cloudinaryAssetId":null,"cloudinaryPublicId":null,
                   "importSourcePath":"/assets/images/portfolio/publicity/A.JPG"}
                ]}
                """, ImportDevelopmentPortfolio.Manifest.class);
        assertEquals(photo("A.JPG", 0), manifest.photos().getFirst());
    }

    private static ExistingPhoto existing(Photo photo) {
        return new ExistingPhoto(photo.category(), photo.displayOrder(), photo.imageUrl(), photo.importSourcePath());
    }

    private static Photo photo(String file, int position) {
        String image = "/assets/images/portfolio/publicity/" + file;
        return new Photo("publicity", position, true, file, 640, 480, null, image,
                "/assets/images/portfolio-thumbnails/publicity/" + file + ".jpg", null, null, image);
    }
}
