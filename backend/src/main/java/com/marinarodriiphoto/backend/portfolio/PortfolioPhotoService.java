package com.marinarodriiphoto.backend.portfolio;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
class PortfolioPhotoService {
    private static final Set<String> CATEGORIES = Set.of("publicity", "events-bts", "editorial-artistic", "portraits");
    private static final Comparator<PortfolioPhoto> DISPLAY_ORDER =
            Comparator.comparingInt((PortfolioPhoto photo) -> photo.displayOrder).thenComparing(photo -> photo.id);

    private final PortfolioPhotoRepository repository;

    PortfolioPhotoService(PortfolioPhotoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    List<PortfolioPhoto> list() {
        return repository.findAllByOrderByCategoryAscDisplayOrderAscIdAsc();
    }

    @Transactional
    PortfolioPhoto update(long id, String category, String altText, boolean published, int displayOrder,
                          Optional<String> titleChange) {
        requireCategory(category);

        // Every order writer takes the same locks in the same order, including cross-category edits.
        List<PortfolioPhoto> all = repository.lockAllInIdOrder();
        PortfolioPhoto photo = all.stream().filter(row -> row.id == id).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio photograph not found."));
        List<PortfolioPhoto> destination = inCategory(all, category);
        destination.remove(photo);
        if (displayOrder < 0 || displayOrder > destination.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display order is outside the destination category.");
        }

        if (!photo.category.equals(category)) {
            List<PortfolioPhoto> previous = inCategory(all, photo.category);
            previous.remove(photo);
            assignPositions(previous);
        }

        photo.category = category;
        photo.altText = altText;
        titleChange.ifPresent(title -> photo.title = title.isEmpty() ? null : title);
        photo.published = published;
        destination.add(displayOrder, photo);
        assignPositions(destination);
        return photo;
    }

    @Transactional
    List<PortfolioPhoto> reorder(String category, List<Long> photoIds) {
        requireCategory(category);
        Set<Long> requested = new HashSet<>(photoIds);
        if (requested.size() != photoIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The order contains duplicate photo IDs.");
        }

        Map<Long, PortfolioPhoto> current = inCategory(repository.lockAllInIdOrder(), category).stream()
                .collect(Collectors.toMap(photo -> photo.id, Function.identity()));
        if (!current.keySet().equals(requested)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Send every photo in this category exactly once. Refresh the list and try again.");
        }

        List<PortfolioPhoto> ordered = photoIds.stream().map(current::get).toList();
        assignPositions(ordered);
        return ordered;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    PortfolioPhoto appendDraft(PortfolioPhoto photo) {
        int last = repository.lockAllInIdOrder().stream()
                .filter(row -> row.category.equals(photo.category))
                .mapToInt(row -> row.displayOrder).max().orElse(-1);
        photo.displayOrder = Math.addExact(last, 1);
        return repository.save(photo);
    }

    static void requireCategory(String category) {
        if (category == null || !CATEGORIES.contains(category)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown Portfolio category.");
        }
    }

    static String normalizeTitle(String title) {
        if (title == null) return null;
        String trimmed = title.strip();
        if (trimmed.length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo title must have at most 160 characters.");
        }
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static List<PortfolioPhoto> inCategory(List<PortfolioPhoto> photos, String category) {
        return photos.stream().filter(photo -> category.equals(photo.category)).sorted(DISPLAY_ORDER)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static void assignPositions(List<PortfolioPhoto> photos) {
        for (int position = 0; position < photos.size(); position++) {
            photos.get(position).displayOrder = position;
        }
    }
}
