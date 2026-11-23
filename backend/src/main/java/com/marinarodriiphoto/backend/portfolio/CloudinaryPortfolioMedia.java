package com.marinarodriiphoto.backend.portfolio;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.Url;
import org.springframework.stereotype.Component;

@Component
class CloudinaryPortfolioMedia {
    static final String FOLDER = "marinarodriiphoto/portfolio";
    private static final String TYPE = "authenticated";
    private final Cloudinary cloudinary;

    CloudinaryPortfolioMedia(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    Asset upload(byte[] bytes, UUID reference) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(bytes, uploadOptions(reference));
        String publicId = publicId(reference);
        if (Boolean.TRUE.equals(result.get("existing")) || !publicId.equals(result.get("public_id")) || !TYPE.equals(result.get("type"))
                || !(result.get("asset_id") instanceof String assetId) || assetId.isBlank()) {
            throw new IOException("Unexpected Cloudinary asset identity.");
        }
        return new Asset(publicId, assetId);
    }

    static Map<String, Object> uploadOptions(UUID reference) {
        // Cloudinary supports folder in fixed and dynamic mode for backward compatibility.
        return Map.of("folder", FOLDER, "public_id", reference.toString(), "overwrite", false,
                "resource_type", "image", "type", TYPE);
    }

    static String publicId(UUID reference) {
        return FOLDER + "/" + reference;
    }

    String optimizedUrl(String publicId, int width) {
        return url().transformation(new Transformation<>().crop("limit").width(width)
                .quality("auto").fetchFormat("auto")).generate(publicId);
    }

    String originalUrl(String publicId) {
        return url().generate(publicId);
    }

    List<DeliverySource> responsiveUrls(String publicId, int originalWidth) {
        return IntStream.of(320, 640, 960, 1440, 1920)
                .map(width -> Math.min(width, originalWidth)).distinct()
                .mapToObj(width -> new DeliverySource(width, optimizedUrl(publicId, width))).toList();
    }

    private Url url() {
        return cloudinary.url().resourceType("image").type(TYPE).secure(true).signed(true);
    }

    record Asset(String publicId, String assetId) {}
    record DeliverySource(int width, String url) {}
}
