package com.marinarodriiphoto.backend.portfolio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.imageio.ImageIO;

import com.cloudinary.Cloudinary;
import com.cloudinary.ProgressCallback;
import com.cloudinary.Uploader;
import com.cloudinary.strategies.AbstractUploaderStrategy;
import org.springframework.dao.DataAccessResourceFailureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PortfolioPhotoApiTests {
    private static final String PHOTOS = "/api/admin/photos";
    private static final String ORDER = "/api/admin/photo-categories/";
    private MockMvc mvc;
    private PortfolioPhoto first;
    private PortfolioPhoto second;
    private PortfolioPhoto portrait;
    private List<PortfolioPhoto> rows;
    private int cloudinaryCalls;
    private boolean cloudinaryFailure;
    private boolean databaseFailure;

    @BeforeEach
    void setUp() {
        first = photo(1, "publicity", 0);
        second = photo(2, "publicity", 1);
        portrait = photo(3, "portraits", 0);
        rows = new ArrayList<>(List.of(first, second, portrait));
        PortfolioPhotoRepository repository = new PortfolioPhotoRepository() {
            @Override
            public List<PortfolioPhoto> findAllByOrderByCategoryAscDisplayOrderAscIdAsc() {
                return rows.stream().sorted(Comparator.comparing((PortfolioPhoto photo) -> photo.category)
                        .thenComparingInt(photo -> photo.displayOrder).thenComparing(photo -> photo.id)).toList();
            }

            @Override
            public List<PortfolioPhoto> lockAllInIdOrder() {
                return rows;
            }

            @Override
            public PortfolioPhoto save(PortfolioPhoto photo) {
                if (databaseFailure) throw new DataAccessResourceFailureException("Database unavailable");
                photo.id = 4L;
                rows.add(photo);
                return photo;
            }
        };
        var service = new PortfolioPhotoService(repository);
        var cloudinary = new Cloudinary(Map.of("cloud_name", "test-cloud", "api_key", "test-key", "api_secret", "test-secret")) {
            @Override
            public Uploader uploader() {
                return new Uploader(this, new AbstractUploaderStrategy() {
                    @Override
                    @SuppressWarnings("rawtypes")
                    public Map callApi(String action, Map<String, Object> params, Map options, Object file,
                                       ProgressCallback callback) throws IOException {
                        cloudinaryCalls++;
                        assertEquals("upload", action);
                        if (cloudinaryFailure) throw new IOException("upstream error");
                        return Map.of("public_id", params.get("folder") + "/" + params.get("public_id"),
                                "type", params.get("type"), "asset_id", "test-asset");
                    }
                });
            }
        };
        var media = new CloudinaryPortfolioMedia(cloudinary);
        var uploads = new PortfolioUploadService(new PortfolioImageValidator("1MB"), media, service);
        mvc = MockMvcBuilders.standaloneSetup(new PortfolioPhotoController(service, uploads, media))
                .setControllerAdvice(new PortfolioPhotoErrors()).build();
    }

    @Test
    void listsMetadataIncludingUnpublishedPhotos() throws Exception {
        mvc.perform(get(PHOTOS)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[1].published").value(false))
                .andExpect(jsonPath("$[1].importSourcePath").value(first.importSourcePath))
                .andExpect(jsonPath("$[1].thumbnailUrl").value(first.thumbnailUrl));
    }

    @Test
    void updatesMetadataAndCompactsBothCategoriesWhenMoving() throws Exception {
        var source = first.importSourcePath;
        jsonPut(PHOTOS + "/1", """
                {"category":"portraits","altText":"A studio portrait","published":true,"displayOrder":0}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("portraits"))
                .andExpect(jsonPath("$.published").value(true))
                .andExpect(jsonPath("$.altText").value("A studio portrait"))
                .andExpect(jsonPath("$.importSourcePath").value(source));
        assertEquals(0, second.displayOrder);
        assertEquals(1, portrait.displayOrder);
    }

    @Test
    void changesPositionWithinTheSameCategoryAndClearsAltText() throws Exception {
        first.altText = "Old";
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","altText":null,"published":false,"displayOrder":1}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.displayOrder").value(1));
        assertEquals(0, second.displayOrder);
        assertNull(first.altText);
    }

    @Test
    void titlesAreOptionalAndCanBeEditedOrClearedWithoutChangingMediaIdentity() throws Exception {
        mvc.perform(get(PHOTOS)).andExpect(status().isOk()).andExpect(jsonPath("$[1].title").doesNotExist());
        String source = first.importSourcePath;
        first.cloudinaryAssetId = "stable-asset";
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","title":"  Window Light Portrait  ","altText":"A dancer beside a window",
                 "published":false,"displayOrder":0}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Window Light Portrait"))
                .andExpect(jsonPath("$.altText").value("A dancer beside a window"))
                .andExpect(jsonPath("$.originalFilename").value("1.jpg"))
                .andExpect(jsonPath("$.imageUrl").value(source))
                .andExpect(jsonPath("$.cloudinaryAssetId").value("stable-asset"))
                .andExpect(jsonPath("$.importSourcePath").value(source));
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","published":false,"displayOrder":0}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Window Light Portrait"));
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","title":null,"published":false,"displayOrder":0}
                """).andExpect(status().isOk()).andExpect(jsonPath("$.title").doesNotExist());
        assertNull(first.title);
    }

    @Test
    void rejectsNonTextAndOverlongTitles() throws Exception {
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","title":123,"published":false,"displayOrder":0}
                """).andExpect(status().isBadRequest());
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","title":"%s","published":false,"displayOrder":0}
                """.formatted("a".repeat(161))).andExpect(status().isBadRequest());
        mvc.perform(multipart(PHOTOS).file(new MockMultipartFile("file", "test.png", "image/png", png()))
                .param("category", "publicity").param("title", "a".repeat(161))).andExpect(status().isBadRequest());
        assertNull(first.title);
        assertEquals(0, cloudinaryCalls);
    }

    @Test
    void rejectsMissingFieldsInvalidIdsCategoryAndOutOfRangePosition() throws Exception {
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","displayOrder":0}
                """).andExpect(status().isBadRequest()).andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
        jsonPut(PHOTOS + "/0", """
                {"category":"publicity","published":true,"displayOrder":0}
                """).andExpect(status().isBadRequest());
        jsonPut(PHOTOS + "/1", """
                {"category":"PUBLICITY","published":true,"displayOrder":0}
                """).andExpect(status().isBadRequest());
        jsonPut(PHOTOS + "/1", """
                {"category":"portraits","published":true,"displayOrder":2}
                """).andExpect(status().isBadRequest());
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","published":true,"displayOrder":-1}
                """).andExpect(status().isBadRequest());
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","published":true,"displayOrder":0.5}
                """).andExpect(status().isBadRequest());
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","published":"true","displayOrder":0}
                """).andExpect(status().isBadRequest());
        jsonPut(PHOTOS + "/1", """
                {"category":"publicity","altText":"%s","published":true,"displayOrder":0}
                """.formatted("a".repeat(256))).andExpect(status().isBadRequest());
        assertEquals("publicity", first.category);
        assertFalse(first.published);
    }

    @Test
    void reportsMissingPhotos() throws Exception {
        jsonPut(PHOTOS + "/999", """
                {"category":"publicity","published":true,"displayOrder":0}
                """).andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void reordersTheWholeCategoryIncludingHiddenPhotos() throws Exception {
        jsonPut(ORDER + "publicity/order", """
                {"photoIds":[2,1]}
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[1].displayOrder").value(1));
        assertEquals(1, first.displayOrder);
        assertEquals(0, second.displayOrder);
        assertEquals(0, portrait.displayOrder);
    }

    @Test
    void rejectsIncompleteForeignDuplicateAndInvalidOrderIds() throws Exception {
        String path = ORDER + "publicity/order";
        jsonPut(path, "{\"photoIds\":[1]}").andExpect(status().isConflict());
        jsonPut(path, "{\"photoIds\":[1,3]}").andExpect(status().isConflict());
        jsonPut(path, "{\"photoIds\":[1,1]}").andExpect(status().isBadRequest());
        jsonPut(path, "{\"photoIds\":[null,1]}").andExpect(status().isBadRequest());
        jsonPut(path, "{\"photoIds\":[-1,2]}").andExpect(status().isBadRequest());
        jsonPut(path, "{\"photoIds\":[1.5,2]}").andExpect(status().isBadRequest());
        assertEquals(0, first.displayOrder);
        assertEquals(1, second.displayOrder);
    }

    @Test
    void uploadsValidatedBytesAndAppendsAnUnpublishedDraftWithoutReorderingExistingPhotos() throws Exception {
        mvc.perform(multipart(PHOTOS).file(new MockMultipartFile("file", "test.png", "application/octet-stream", png()))
                        .param("category", "publicity").param("altText", "Studio image").param("title", " Window Light "))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cloudinaryAssetId").value("test-asset"))
                .andExpect(jsonPath("$.cloudinaryPublicId").value(org.hamcrest.Matchers.startsWith("marinarodriiphoto/portfolio/")))
                .andExpect(jsonPath("$.width").value(400))
                .andExpect(jsonPath("$.height").value(200))
                .andExpect(jsonPath("$.published").value(false))
                .andExpect(jsonPath("$.altText").value("Studio image"))
                .andExpect(jsonPath("$.title").value("Window Light"))
                .andExpect(jsonPath("$.displayOrder").value(2))
                .andExpect(jsonPath("$.thumbnailUrl").value(org.hamcrest.Matchers.containsString("w_320")))
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.containsString("f_auto"), org.hamcrest.Matchers.containsString("q_auto"))))
                .andExpect(jsonPath("$.responsiveUrls[1].width").value(400))
                .andExpect(jsonPath("$.originalUrl").value(org.hamcrest.Matchers.containsString("/authenticated/s--")));
        assertEquals(1, cloudinaryCalls);
        assertEquals(0, first.displayOrder);
        assertEquals(1, second.displayOrder);
        assertEquals(4, rows.size());
    }

    @Test
    void rejectsEmptyUnsupportedOversizedAndCorruptedFilesBeforeUploading() throws Exception {
        upload("test.png", new byte[0]).andExpect(status().isBadRequest());
        upload("test.png", new byte[]{1, 2, 3}).andExpect(status().isUnsupportedMediaType());
        upload("test.png", new byte[(1024 * 1024) + 1]).andExpect(status().isPayloadTooLarge());
        byte[] truncated = java.util.Arrays.copyOf(png(), 45);
        upload("test.png", truncated).andExpect(status().isBadRequest());
        mvc.perform(multipart(PHOTOS).file(new MockMultipartFile("file", "test.png", "image/png", png()))
                .param("category", "unknown")).andExpect(status().isBadRequest());
        assertEquals(0, cloudinaryCalls);
        assertEquals(3, rows.size());
    }

    @Test
    void decodesJpegAndWebpWithoutTrustingTheClientMimeType() throws Exception {
        var validator = new PortfolioImageValidator("1MB");
        var jpeg = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(6, 4, BufferedImage.TYPE_INT_RGB), "jpeg", jpeg);
        byte[] webp = Base64.getDecoder().decode(
                "UklGRi4AAABXRUJQVlA4ICIAAABQAQCdASoGAAQAAgA0JaAABDOAAP75k0v/87fiD9QSwAAA");
        for (byte[] bytes : List.of(jpeg.toByteArray(), webp)) {
            var image = validator.validate(new MockMultipartFile("file", "sample.bin", "application/octet-stream", bytes));
            assertEquals(6, image.width());
            assertEquals(4, image.height());
        }
    }

    @Test
    void cloudinaryFailureReturnsAnIncidentReferenceWithoutPersisting() throws Exception {
        cloudinaryFailure = true;
        upload("test.png", png()).andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("reference")));
        assertEquals(1, cloudinaryCalls);
        assertEquals(3, rows.size());
    }

    @Test
    void databaseFailureAfterUploadReturnsAReconciliationReference() throws Exception {
        databaseFailure = true;
        upload("test.png", png()).andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("reference")));
        assertEquals(1, cloudinaryCalls);
        assertEquals(3, rows.size());
    }

    @Test
    void uploadOptionsUseDedicatedFolderAndNeverOverwrite() {
        UUID reference = UUID.randomUUID();
        assertEquals(Map.of("folder", "marinarodriiphoto/portfolio", "public_id", reference.toString(),
                "overwrite", false, "resource_type", "image", "type", "authenticated"),
                CloudinaryPortfolioMedia.uploadOptions(reference));
    }

    private ResultActions upload(String name, byte[] data) throws Exception {
        // The client-supplied content type is deliberately untrusted.
        return mvc.perform(multipart(PHOTOS).file(new MockMultipartFile("file", name, "application/octet-stream", data))
                .param("category", "publicity").param("altText", "Studio image"));
    }

    private static byte[] png() throws IOException {
        var buffer = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(400, 200, BufferedImage.TYPE_INT_RGB), "png", buffer);
        return buffer.toByteArray();
    }

    private ResultActions jsonPut(String path, String body) throws Exception {
        return mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static PortfolioPhoto photo(long id, String category, int order) {
        var photo = new PortfolioPhoto();
        photo.id = id;
        photo.category = category;
        photo.displayOrder = order;
        photo.originalFilename = id + ".jpg";
        photo.width = 600;
        photo.height = 400;
        photo.imageUrl = "/original/" + photo.originalFilename;
        photo.thumbnailUrl = "/thumbnail/" + photo.originalFilename;
        photo.importSourcePath = photo.imageUrl;
        return photo;
    }
}
