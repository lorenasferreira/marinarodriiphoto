import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Category.css";

const allowedTypes = [
  "publicity",
  "events-bts",
  "editorial-artistic",
  "portraits",
];

function createImageList(prefix, extension, total) {
  return Array.from({ length: total }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return `${prefix}-${number}.${extension}`;
  });
}

const categoryImages = {
  publicity: {
    hero: "hero.webp",
    images: createImageList("publicity", "webp", 6),
  },

  "events-bts": {
    hero: "hero.jpg",
    images: createImageList("bts", "jpg", 6),
  },

  "editorial-artistic": {
    hero: "hero.jpg",
    images: createImageList("editorial", "jpg", 59),
  },

  portraits: {
    hero: "hero.jpg",
    images: createImageList("portrait", "jpg", 25),
  },
};

function Category() {
  const { type } = useParams();
  const { t } = useTranslation();

  const isValidType = allowedTypes.includes(type);

  useEffect(() => {
    if (!isValidType) {
      return;
    }

    document.title = `${t(`portfolio.${type}.title`)} — Mari Rodrigues`;
  }, [isValidType, t, type]);

  if (!isValidType) {
    return <Navigate to="/portfolio/publicity" replace />;
  }

  const currentIndex = allowedTypes.indexOf(type);

  const previousIndex =
    (currentIndex - 1 + allowedTypes.length) % allowedTypes.length;

  const nextIndex = (currentIndex + 1) % allowedTypes.length;

  const previousType = allowedTypes[previousIndex];
  const nextType = allowedTypes[nextIndex];

  const category = categoryImages[type];

  const basePath = `/assets/images/portfolio/${type}`;

  const heroSrc = `${basePath}/${category.hero}`;

  return (
    <main className="portfolio-category">
      <section className="category-hero">
        <div className="hero-image">
          <img
            src={heroSrc}
            alt={t(`portfolio.${type}.title`)}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="hero-text">
          <h1>{t(`portfolio.${type}.title`)}</h1>

          <p className="hero-description">{t(`portfolio.${type}.text`)}</p>

          <span className="hero-subtitle">
            {t(`portfolio.${type}.subtitle`)}
          </span>
        </div>
      </section>

      <section className="category-gallery">
        {category.images.map((filename) => (
          <figure className="gallery-item" key={filename}>
            <img
              src={`${basePath}/${filename}`}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.closest("figure").style.display = "none";
              }}
            />
          </figure>
        ))}
      </section>

      <nav className="category-navigation">
        <Link to={`/portfolio/${previousType}`} className="nav-arrow nav-prev">
          ← {t(`portfolio.${previousType}.title`)}
        </Link>

        <Link to={`/portfolio/${nextType}`} className="nav-arrow nav-next">
          {t(`portfolio.${nextType}.title`)} →
        </Link>
      </nav>
    </main>
  );
}

export default Category;
