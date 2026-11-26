package com.marinarodriiphoto.backend.portfolio;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/admin")
class PortfolioPhotoController {
    private final PortfolioPhotoService service;
    private final PortfolioUploadService uploads;
    private final CloudinaryPortfolioMedia media;

    PortfolioPhotoController(PortfolioPhotoService service, PortfolioUploadService uploads, CloudinaryPortfolioMedia media) {
        this.service = service;
        this.uploads = uploads;
        this.media = media;
    }

    @GetMapping("/photos")
    List<PhotoResponse> list() {
        return service.list().stream().map(this::response).toList();
    }

    @PostMapping(path = "/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    PhotoResponse upload(@RequestParam MultipartFile file, @RequestParam String category,
                         @RequestParam(required = false) String altText,
                         @RequestParam(required = false) String title) {
        return response(uploads.upload(file, category, altText, title));
    }

    @PutMapping("/photos/{id}")
    PhotoResponse update(@PathVariable @Positive long id, @Valid @RequestBody UpdatePhoto update) {
        return response(service.update(id, update.category(), update.readAltText(),
                update.readPublished(), update.readDisplayOrder(), update.readTitleChange()));
    }

    @PutMapping("/photo-categories/{category}/order")
    List<PhotoResponse> reorder(@PathVariable String category, @Valid @RequestBody PhotoOrder order) {
        return service.reorder(category, order.photoIds().stream().map(PortfolioPhotoController::readId).toList())
                .stream().map(this::response).toList();
    }

    private PhotoResponse response(PortfolioPhoto photo) {
        String publicId = photo.cloudinaryPublicId;
        return new PhotoResponse(photo.id, photo.category, photo.displayOrder, photo.published,
                photo.originalFilename, photo.title, photo.width, photo.height, photo.altText,
                photo.imageUrl, photo.thumbnailUrl, publicId == null ? photo.imageUrl : media.originalUrl(publicId),
                publicId == null ? List.of() : media.responsiveUrls(publicId, photo.width),
                photo.cloudinaryAssetId, publicId, photo.importSourcePath);
    }

    private static long readId(JsonNode id) {
        if (id == null || !id.isIntegralNumber() || !id.canConvertToLong() || id.longValue() < 1) {
            throw invalid("Photo IDs must be positive integers.");
        }
        return id.longValue();
    }

    private static ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    // Keep JSON types strict. Jackson's scalar coercion would otherwise accept inputs such as 1.5 for an integer.
    record UpdatePhoto(@NotBlank String category, JsonNode altText, JsonNode title,
                       @NotNull JsonNode published, @NotNull JsonNode displayOrder) {
        Optional<String> readTitleChange() {
            if (title == null || title.isMissingNode()) return Optional.empty();
            if (title.isNull()) return Optional.of("");
            if (!title.isString()) throw invalid("Photo title must be text or null.");
            return Optional.of(Objects.requireNonNullElse(PortfolioPhotoService.normalizeTitle(title.stringValue()), ""));
        }

        String readAltText() {
            if (altText == null || altText.isNull()) {
                return null;
            }
            if (!altText.isString() || altText.stringValue().length() > 255) {
                throw invalid("Alt text must be text of at most 255 characters or null.");
            }
            return altText.stringValue();
        }

        boolean readPublished() {
            if (!published.isBoolean()) {
                throw invalid("Published must be a boolean.");
            }
            return published.booleanValue();
        }

        int readDisplayOrder() {
            if (!displayOrder.isIntegralNumber() || !displayOrder.canConvertToInt() || displayOrder.intValue() < 0) {
                throw invalid("Display order must be a nonnegative integer.");
            }
            return displayOrder.intValue();
        }
    }

    record PhotoOrder(@NotNull List<JsonNode> photoIds) {}

    record PhotoResponse(long id, String category, int displayOrder, boolean published,
                         String originalFilename, String title, int width, int height, String altText,
                         String imageUrl, String thumbnailUrl, String originalUrl,
                         List<CloudinaryPortfolioMedia.DeliverySource> responsiveUrls, String cloudinaryAssetId,
                         String cloudinaryPublicId, String importSourcePath) {}
}
