package com.marinarodriiphoto.backend.portfolio;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.Set;
import java.util.concurrent.Semaphore;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

@Component
class PublicPortfolioMedia {
    private static final int MAX_BYTES = 8 * 1024 * 1024;
    private static final Set<String> FORMATS = Set.of("image/jpeg", "image/png", "image/webp", "image/avif");
    private final Semaphore slots = new Semaphore(8);
    private final CloudinaryPortfolioMedia cloudinary;

    PublicPortfolioMedia(CloudinaryPortfolioMedia cloudinary) {
        this.cloudinary = cloudinary;
    }

    Image read(String publicId, int width, String accept) throws IOException {
        if (!slots.tryAcquire()) throw new IOException("Gallery media delivery is busy.");
        try {
            URI source = URI.create(cloudinary.optimizedUrl(publicId, width));
            if (!"https".equals(source.getScheme()) || !"res.cloudinary.com".equals(source.getHost())
                    || source.getUserInfo() != null || source.getPort() != -1) {
                throw new IOException("Unexpected gallery media host.");
            }
            return fetch(source, accept);
        } finally {
            slots.release();
        }
    }

    private static Image fetch(URI source, String accept) throws IOException {
        var connection = (HttpURLConnection) source.toURL().openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(3_000);
        connection.setReadTimeout(5_000);
        var formats = new StringBuilder("image/jpeg,image/png");
        if (accept != null && accept.contains("image/webp")) formats.insert(0, "image/webp,");
        if (accept != null && accept.contains("image/avif")) formats.insert(0, "image/avif,");
        connection.setRequestProperty("Accept", formats.toString());
        try {
            if (connection.getResponseCode() != 200 || !FORMATS.contains(connection.getContentType())
                    || connection.getContentLengthLong() > MAX_BYTES) {
                throw new IOException("Gallery media could not be delivered.");
            }
            try (var stream = connection.getInputStream()) {
                byte[] bytes = stream.readNBytes(MAX_BYTES + 1);
                if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IOException("Invalid gallery media size.");
                return new Image(MediaType.parseMediaType(connection.getContentType()), bytes);
            }
        } finally {
            connection.disconnect();
        }
    }

    record Image(MediaType type, byte[] bytes) {}
}
