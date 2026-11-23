package com.marinarodriiphoto.backend.portfolio;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.Semaphore;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
class PortfolioUploadService {
    private static final Logger LOG = LoggerFactory.getLogger(PortfolioUploadService.class);
    private final Semaphore slots = new Semaphore(2);
    private final PortfolioImageValidator validator;
    private final CloudinaryPortfolioMedia media;
    private final PortfolioPhotoService photos;

    PortfolioUploadService(PortfolioImageValidator validator, CloudinaryPortfolioMedia media, PortfolioPhotoService photos) {
        this.validator = validator;
        this.media = media;
        this.photos = photos;
    }

    PortfolioPhoto upload(MultipartFile file, String category, String altText, String title) {
        PortfolioPhotoService.requireCategory(category);
        String normalizedTitle = PortfolioPhotoService.normalizeTitle(title);
        if (altText != null && altText.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alt text must have at most 255 characters.");
        }
        if (!slots.tryAcquire()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many uploads are running. Try again shortly.");
        }
        try {
            return save(validator.validate(file), category, altText, normalizedTitle);
        } finally {
            slots.release();
        }
    }

    private PortfolioPhoto save(PortfolioImageValidator.Image image, String category, String altText, String title) {
        UUID reference = UUID.randomUUID();
        String expectedId = CloudinaryPortfolioMedia.publicId(reference);
        LOG.info("Portfolio upload started. publicId={}", expectedId);
        CloudinaryPortfolioMedia.Asset asset;
        try {
            asset = media.upload(image.bytes(), reference);
        } catch (IOException | RuntimeException e) {
            LOG.warn("Portfolio upload outcome unconfirmed; reconcile before retrying. publicId={}", expectedId);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not confirm the Cloudinary upload. Give the workspace operator this reference before retrying: " + reference);
        }

        try {
            var photo = new PortfolioPhoto();
            photo.category = category;
            photo.altText = altText == null || altText.isBlank() ? null : altText;
            photo.title = title;
            photo.published = false;
            photo.originalFilename = image.filename();
            photo.width = image.width();
            photo.height = image.height();
            photo.cloudinaryPublicId = asset.publicId();
            photo.cloudinaryAssetId = asset.assetId();
            photo.imageUrl = media.optimizedUrl(asset.publicId(), Math.min(image.width(), 1920));
            photo.thumbnailUrl = media.optimizedUrl(asset.publicId(), Math.min(image.width(), 320));
            return photos.appendDraft(photo);
        } catch (RuntimeException e) {
            LOG.error("Portfolio database save unconfirmed; reconcile before retrying. publicId={} assetId={}",
                    asset.publicId(), asset.assetId());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not confirm the database save. Give the workspace operator this reference before retrying: " + reference);
        }
    }
}
