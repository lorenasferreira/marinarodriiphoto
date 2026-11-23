package com.marinarodriiphoto.backend.portfolio;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.CRC32;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Component
class PortfolioImageValidator {
    private static final long MAX_PIXELS = 25_000_000;
    private static final int MAX_SIDE = 10_000;
    private static final byte[] PNG_SIGNATURE = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
    private final long maxBytes;

    PortfolioImageValidator(@Value("${portfolio.upload.max-file-size}") String maxSize) {
        this.maxBytes = DataSize.parse(maxSize).toBytes();
    }

    Image validate(MultipartFile file) {
        if (file.isEmpty()) throw error(HttpStatus.BAD_REQUEST, "Select a nonempty photograph.");
        enforceSize(file.getSize());
        String filename = filename(file.getOriginalFilename());
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw error(HttpStatus.BAD_REQUEST, "Could not read the uploaded file.");
        }
        enforceSize(bytes.length);
        String format = detectFormat(bytes);

        try (var stream = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) throw corrupt();
            var reader = readers.next();
            try {
                if (!format.equals(reader.getFormatName().toLowerCase(Locale.ROOT))) throw corrupt();
                reader.setInput(stream, false, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1) throw corrupt();
                if (width > MAX_SIDE || height > MAX_SIDE || (long) width * height > MAX_PIXELS) {
                    throw error(HttpStatus.BAD_REQUEST, "Image dimensions exceed 10,000 pixels per side or 25 megapixels.");
                }
                var warning = new AtomicBoolean();
                reader.addIIOReadWarningListener((source, message) -> warning.set(true));
                if (reader.getNumImages(true) != 1 || reader.read(0) == null || warning.get()) throw corrupt();
                return new Image(bytes, filename, width, height);
            } finally {
                reader.dispose();
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            throw corrupt();
        }
    }

    private void enforceSize(long bytes) {
        if (bytes > maxBytes) throw error(HttpStatus.PAYLOAD_TOO_LARGE, "The photograph exceeds the configured upload size limit.");
    }

    private static String filename(String input) {
        if (input == null) throw error(HttpStatus.BAD_REQUEST, "The photograph must have a file name.");
        String name = input.substring(Math.max(input.lastIndexOf('/'), input.lastIndexOf((char) 92)) + 1).strip();
        if (name.isEmpty() || name.equals(".") || name.equals("..") || name.length() > 255
                || name.chars().anyMatch(Character::isISOControl)) {
            throw error(HttpStatus.BAD_REQUEST, "The photograph file name is invalid.");
        }
        return name;
    }

    private static String detectFormat(byte[] bytes) {
        int size = bytes.length;
        if (size >= 3 && bytes[0] == (byte) 255 && bytes[1] == (byte) 216 && bytes[2] == (byte) 255) {
            if (size < 5 || bytes[size - 2] != (byte) 255 || bytes[size - 1] != (byte) 217) throw corrupt();
            return "jpeg";
        }
        if (size >= PNG_SIGNATURE.length && Arrays.equals(bytes, 0, PNG_SIGNATURE.length,
                PNG_SIGNATURE, 0, PNG_SIGNATURE.length)) {
            verifyPngChunks(bytes);
            return "png";
        }
        if (size >= 12 && fourCc(bytes, 0, "RIFF") && fourCc(bytes, 8, "WEBP")) {
            long declared = 0;
            for (int i = 0; i < 4; i++) declared |= (long) (bytes[4 + i] & 255) << (8 * i);
            if (declared + 8 != size || size < 20
                    || (fourCc(bytes, 12, "VP8X") && (size < 21 || (bytes[20] & 2) != 0))) throw corrupt();
            return "webp";
        }
        throw error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only JPEG, PNG and WebP images are supported.");
    }

    private static boolean fourCc(byte[] bytes, int offset, String value) {
        for (int i = 0; i < 4; i++) {
            if (bytes[offset + i] != value.charAt(i)) return false;
        }
        return true;
    }

    private static void verifyPngChunks(byte[] bytes) {
        for (int offset = PNG_SIGNATURE.length; offset <= bytes.length - 12;) {
            long length = unsignedInt(bytes, offset);
            if (length > bytes.length - offset - 12 || fourCc(bytes, offset + 4, "acTL")) throw corrupt();
            int checksumOffset = offset + 8 + (int) length;
            var checksum = new CRC32();
            checksum.update(bytes, offset + 4, (int) length + 4);
            if (checksum.getValue() != unsignedInt(bytes, checksumOffset)) throw corrupt();
            if (fourCc(bytes, offset + 4, "IEND") && length == 0 && checksumOffset + 4 == bytes.length) return;
            offset = checksumOffset + 4;
        }
        throw corrupt();
    }

    private static long unsignedInt(byte[] bytes, int offset) {
        long value = 0;
        for (int i = 0; i < 4; i++) value = (value << 8) | (bytes[offset + i] & 255);
        return value;
    }

    private static ResponseStatusException corrupt() {
        return error(HttpStatus.BAD_REQUEST, "Could not decode the image. It may be damaged or animated.");
    }

    private static ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    record Image(byte[] bytes, String filename, int width, int height) {}
}
