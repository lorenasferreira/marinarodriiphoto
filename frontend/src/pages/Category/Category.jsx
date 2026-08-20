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

/*
  O Vite encontra todas as imagens do portfólio durante o build.

  eager: true
  = importa tudo imediatamente.

  import: "default"
  = retorna diretamente a URL final de cada imagem.
*/
const portfolioFiles = import.meta.glob(
  "../../assets/images/portfolio/**/*.{jpg,JPG,jpeg,JPEG,webp,WEBP,png,PNG}",
  {
    eager: true,
    import: "default",
  },
);

function getFilename(path) {
  return path.split("/").pop();
}

function getCategoryFromPath(path) {
  const parts = path.split("/");
  const portfolioIndex = parts.indexOf("portfolio");

  return parts[portfolioIndex + 1];
}

function isHeroImage(path) {
  const filename = getFilename(path).toLowerCase();

  return ["hero.jpg", "hero.jpeg", "hero.webp", "hero.png"].includes(filename);
}

function sortImages([pathA], [pathB]) {
  return pathA.localeCompare(pathB, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function Category() {
  const { type } = useParams();
  const { t } = useTranslation();

  const isValidType = allowedTypes.includes(type);

  useEffect(() => {
    if (!isValidType) return;

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

  const categoryFiles = Object.entries(portfolioFiles)
    .filter(([path]) => getCategoryFromPath(path) === type)
    .sort(sortImages);

  const heroEntry = categoryFiles.find(([path]) => isHeroImage(path));

  const galleryImages = categoryFiles.filter(([path]) => !isHeroImage(path));

  const heroSrc = heroEntry?.[1];

  return (
    <main className="portfolio-category">
      <section className="category-hero">
        <div className="hero-image">
          {heroSrc && <img src={heroSrc} alt={t(`portfolio.${type}.title`)} />}
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
        {galleryImages.map(([path, imageUrl]) => (
          <figure className="gallery-item" key={path}>
            <img src={imageUrl} alt="" loading="lazy" />
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
