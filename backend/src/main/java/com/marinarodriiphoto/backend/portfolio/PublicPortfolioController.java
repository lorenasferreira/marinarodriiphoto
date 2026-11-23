package com.marinarodriiphoto.backend.portfolio;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/portfolio")
class PublicPortfolioController {
    private static final List<String> CATEGORIES = List.of("publicity", "events-bts", "editorial-artistic", "portraits");
    private static final List<Integer> WIDTHS = List.of(320, 640, 960, 1440, 1920);
    private static final Map<String, Integer> VARIANTS = Map.of("320", 320, "640", 640, "960", 960, "1440", 1440, "1920", 1920);
    private static final String BUNDLED_PREFIX = "/assets/images/portfolio/";
    private static final String THUMBNAIL_PREFIX = "/assets/images/portfolio-thumbnails/";
    private static final Pattern BUNDLED_PATH = Pattern.compile(
            BUNDLED_PREFIX + "(publicity|events-bts|editorial-artistic|portraits)/[A-Za-z0-9_-]+\\.[A-Za-z0-9]+");
    private static final Pattern CLOUDINARY_ID = Pattern.compile(CloudinaryPortfolioMedia.FOLDER
            + "/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}");

    private final PublicPortfolioRepository photos;
    private final PublicPortfolioMedia media;

    PublicPortfolioController(PublicPortfolioRepository photos, PublicPortfolioMedia media) {
        this.photos = photos;
        this.media = media;
    }

    @GetMapping
    ResponseEntity<List<PublicPhoto>> list() {
        List<PublicPhoto> published = photos.findAllByPublishedTrue().stream()
                .filter(photo -> photo.published && CATEGORIES.contains(photo.category))
                .sorted(Comparator.comparingInt((PortfolioPhoto photo) -> CATEGORIES.indexOf(photo.category))
                        .thenComparingInt(photo -> photo.displayOrder).thenComparing(photo -> photo.id))
                .map(PublicPortfolioController::toPublicPhoto)
                .filter(Objects::nonNull)
                .toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(published);
    }

    @GetMapping("/{id}/media/{variant}")
    ResponseEntity<byte[]> image(@PathVariable String id, @PathVariable String variant,
            @RequestHeader(name = HttpHeaders.ACCEPT, required = false) String accept) {
        Integer width = VARIANTS.get(variant);
        long photoId;
        try {
            photoId = Long.parseLong(id);
        } catch (NumberFormatException failure) {
            photoId = 0;
        }
        Optional<PortfolioPhoto> photo = width == null || photoId < 1 ? Optional.empty()
                : photos.findByIdAndPublishedTrue(photoId).filter(row -> row.published && cloudinaryPhoto(row));
        if (photo.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).cacheControl(CacheControl.noStore()).build();

        try {
            var row = photo.get();
            var image = media.read(row.cloudinaryPublicId, Math.min(row.width, width), accept);
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).varyBy(HttpHeaders.ACCEPT)
                    .header("X-Content-Type-Options", "nosniff")
                    .contentType(image.type()).body(image.bytes());
        } catch (IOException | IllegalArgumentException failure) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).cacheControl(CacheControl.noStore()).build();
        }
    }

    private static PublicPhoto toPublicPhoto(PortfolioPhoto photo) {
        String imageUrl;
        String thumbnailUrl;
        List<Source> sources = List.of();
        if (cloudinaryPhoto(photo)) {
            imageUrl = mediaPath(photo.id, 1920);
            thumbnailUrl = mediaPath(photo.id, 320);
            var responsive = new ArrayList<Source>();
            int previousWidth = 0;
            for (int variant : WIDTHS) {
                int width = Math.min(photo.width, variant);
                if (width != previousWidth) responsive.add(new Source(width, mediaPath(photo.id, variant)));
                previousWidth = width;
            }
            sources = List.copyOf(responsive);
        } else if (photo.cloudinaryPublicId == null && photo.imageUrl != null
                && BUNDLED_PATH.matcher(photo.imageUrl).matches() && photo.imageUrl.equals(photo.importSourcePath)
                && (THUMBNAIL_PREFIX + photo.imageUrl.substring(BUNDLED_PREFIX.length()) + ".jpg").equals(photo.thumbnailUrl)) {
            imageUrl = photo.imageUrl;
            thumbnailUrl = photo.thumbnailUrl;
        } else {
            return null;
        }
        return new PublicPhoto(photo.id, photo.category, photo.displayOrder, photo.width, photo.height,
                photo.title, photo.altText, imageUrl, thumbnailUrl, sources);
    }

    private static boolean cloudinaryPhoto(PortfolioPhoto photo) {
        return photo.cloudinaryPublicId != null && CLOUDINARY_ID.matcher(photo.cloudinaryPublicId).matches();
    }

    private static String mediaPath(long id, int width) {
        return "/api/public/portfolio/" + id + "/media/" + width;
    }

    record PublicPhoto(long id, String category, int displayOrder, int width, int height, String title,
                       String altText, String imageUrl, String thumbnailUrl, List<Source> sources) {}

    record Source(int width, String url) {}
}
