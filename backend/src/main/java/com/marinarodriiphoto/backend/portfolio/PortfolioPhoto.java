package com.marinarodriiphoto.backend.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "portfolio_photos")
public class PortfolioPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 20)
    String category;

    @Column(name = "display_order", nullable = false)
    int displayOrder;

    @Column(nullable = false)
    boolean published;

    @Column(name = "original_filename", nullable = false, length = 255)
    String originalFilename;

    @Column(length = 160)
    String title;

    @Column(nullable = false)
    int width;

    @Column(nullable = false)
    int height;

    @Column(name = "alt_text", length = 255)
    String altText;

    @Column(name = "image_url", nullable = false, length = 2048)
    String imageUrl;

    @Column(name = "thumbnail_url", nullable = false, length = 2048)
    String thumbnailUrl;

    @Column(name = "cloudinary_asset_id", length = 255)
    String cloudinaryAssetId;

    @Column(name = "cloudinary_public_id", length = 255)
    String cloudinaryPublicId;

    @Column(name = "import_source_path", length = 512)
    String importSourcePath;
}
