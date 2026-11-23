package com.marinarodriiphoto.backend.portfolio;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PublicPortfolioApiTests {
    private static final String PATH = "/api/public/portfolio";
    private final PortfolioPhoto bundled = photo(1, "events-bts", 0, true);
    private final PortfolioPhoto upload = photo(2, "publicity", 3, true);
    private final PortfolioPhoto draft = photo(3, "publicity", 0, false);
    private final PortfolioPhoto first = photo(4, "publicity", 0, true);
    private MockMvc mvc;
    private int mediaReads;
    private boolean mediaUnavailable;

    @BeforeEach
    void setUp() {
        upload.cloudinaryPublicId = "marinarodriiphoto/portfolio/12345678-0000-0000-0000-123456789abc";
        upload.cloudinaryAssetId = "private-asset-id";
        upload.imageUrl = "https://res.cloudinary.com/private-signed-url";
        upload.thumbnailUrl = upload.imageUrl;
        upload.title = "Window Light";
        upload.altText = "A dancer beside a window";
        draft.cloudinaryPublicId = upload.cloudinaryPublicId;
        draft.title = "Private draft title";
        List<PortfolioPhoto> rows = List.of(bundled, upload, draft, first);
        var repository = new PublicPortfolioRepository() {
            @Override
            public List<PortfolioPhoto> findAllByPublishedTrue() {
                return rows.stream().filter(photo -> photo.published).toList();
            }

            @Override
            public Optional<PortfolioPhoto> findByIdAndPublishedTrue(long id) {
                return rows.stream().filter(photo -> photo.id == id && photo.published).findFirst();
            }
        };
        var media = new PublicPortfolioMedia(null) {
            @Override
            Image read(String publicId, int width, String accept) throws IOException {
                mediaReads++;
                assertEquals(upload.cloudinaryPublicId, publicId);
                assertEquals(400, width);
                assertEquals("image/webp", accept);
                if (mediaUnavailable) throw new IOException("Sensitive upstream URL");
                return new Image(MediaType.IMAGE_JPEG, new byte[]{1, 2, 3});
            }
        };
        mvc = MockMvcBuilders.standaloneSetup(new PublicPortfolioController(repository, media)).build();
    }

    @Test
    void returnsOnlyPublishedRowsInGalleryOrderWithPublicFieldsAndExactBundledPaths() throws Exception {
        mvc.perform(get(PATH)).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(4))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[2].id").value(1))
                .andExpect(jsonPath("$[1].title").value("Window Light"))
                .andExpect(jsonPath("$[1].altText").value("A dancer beside a window"))
                .andExpect(jsonPath("$[1].imageUrl").value(PATH + "/2/media/1920"))
                .andExpect(jsonPath("$[1].thumbnailUrl").value(PATH + "/2/media/320"))
                .andExpect(jsonPath("$[1].sources[1].width").value(400))
                .andExpect(jsonPath("$[2].imageUrl").value("/assets/images/portfolio/portraits/Photo-1.JPG"))
                .andExpect(jsonPath("$[2].thumbnailUrl").value("/assets/images/portfolio-thumbnails/portraits/Photo-1.JPG.jpg"))
                .andExpect(content().string(not(containsString("Private draft title"))))
                .andExpect(content().string(not(containsString("private-signed-url"))))
                .andExpect(content().string(not(containsString("private-asset-id"))))
                .andExpect(jsonPath("$[1].cloudinaryPublicId").doesNotExist())
                .andExpect(jsonPath("$[1].importSourcePath").doesNotExist())
                .andExpect(jsonPath("$[1].originalFilename").doesNotExist())
                .andExpect(jsonPath("$[1].originalUrl").doesNotExist());
    }

    @Test
    void mediaIsDeliveredWithoutRedirectAndCheckedAgainAfterUnpublish() throws Exception {
        mvc.perform(get(PATH + "/2/media/960").accept("image/webp"))
                .andExpect(status().isOk()).andExpect(content().bytes(new byte[]{1, 2, 3}))
                .andExpect(header().doesNotExist("Location"))
                .andExpect(header().string("Cache-Control", "no-store"));
        upload.published = false;
        mvc.perform(get(PATH + "/2/media/960")).andExpect(status().isNotFound())
                .andExpect(header().string("Cache-Control", "no-store"));
        assertEquals(1, mediaReads);
    }

    @Test
    void rejectsDraftsUnknownIdsAndUnapprovedVariantsWithoutFetching() throws Exception {
        for (String route : List.of("/3/media/960", "/999/media/960", "/oops/media/960",
                "/2/media/9000", "/1/media/320")) {
            mvc.perform(get(PATH + route)).andExpect(status().isNotFound())
                    .andExpect(header().string("Cache-Control", "no-store"));
        }
        assertEquals(0, mediaReads);
    }

    @Test
    void aDeliveryFailureDoesNotRevealTheProviderUrlOrCacheTheError() throws Exception {
        mediaUnavailable = true;
        mvc.perform(get(PATH + "/2/media/960").accept("image/webp"))
                .andExpect(status().isBadGateway()).andExpect(header().doesNotExist("Location"))
                .andExpect(content().string(""))
                .andExpect(header().string("Cache-Control", "no-store"));
    }

    private static PortfolioPhoto photo(long id, String category, int order, boolean published) {
        var photo = new PortfolioPhoto();
        photo.id = id;
        photo.category = category;
        photo.displayOrder = order;
        photo.published = published;
        photo.width = 400;
        photo.height = 300;
        photo.imageUrl = "/assets/images/portfolio/portraits/Photo-" + id + ".JPG";
        photo.thumbnailUrl = "/assets/images/portfolio-thumbnails/portraits/Photo-" + id + ".JPG.jpg";
        photo.importSourcePath = photo.imageUrl;
        photo.originalFilename = "private-filename";
        return photo;
    }
}
