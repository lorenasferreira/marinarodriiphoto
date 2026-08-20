import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "./Packages.css";

const portfolioImages = import.meta.glob(
  "../../assets/images/portfolio/**/*.{jpg,JPG,jpeg,JPEG,webp,WEBP,png,PNG}",
  {
    eager: true,
    import: "default",
  },
);

function findPortfolioImage(category, filename) {
  const imageEntry = Object.entries(portfolioImages).find(([path]) =>
    path.endsWith(`/portfolio/${category}/${filename}`),
  );

  return imageEntry?.[1] ?? "";
}

function Packages() {
  const { t } = useTranslation();

  const publicityImage = findPortfolioImage("publicity", "publicity-01.webp");

  const btsImage = findPortfolioImage("events-bts", "bts-02.jpg");

  const portraitImage = findPortfolioImage("portraits", "portrait-01.jpg");

  const editorialImage = findPortfolioImage(
    "editorial-artistic",
    "editorial-01.jpg",
  );

  return (
    <main className="page page--packages">
      <section className="hero">
        <div className="hero-overlay">
          <h1 className="hero-title">
            <span className="packages1">{t("packages.hero.title_line1")}</span>

            <br />

            <span className="packages2">{t("packages.hero.title_line2")}</span>
          </h1>
        </div>
      </section>

      <section className="packages">
        <section className="packages-carousel">
          <button
            className="carousel-arrow prev"
            aria-label="Previous"
            type="button"
          >
            ‹
          </button>

          <div className="packages-track">
            <article className="package-card">
              <Link to="/portfolio/publicity" className="package-link">
                <img src={publicityImage} alt={t("packages.publicity.alt")} />

                <h2>{t("packages.publicity.title")}</h2>
              </Link>
            </article>

            <article className="package-card">
              <Link to="/portfolio/events-bts" className="package-link">
                <img src={btsImage} alt={t("packages.bts.alt")} />

                <h2>{t("packages.bts.title")}</h2>
              </Link>
            </article>

            <article className="package-card">
              <Link to="/portfolio/portraits" className="package-link">
                <img src={portraitImage} alt={t("packages.portrait.alt")} />

                <h2>{t("packages.portrait.title")}</h2>
              </Link>
            </article>

            <article className="package-card">
              <Link to="/portfolio/editorial-artistic" className="package-link">
                <img src={editorialImage} alt={t("packages.editorial.alt")} />

                <h2>{t("packages.editorial.title")}</h2>
              </Link>
            </article>
          </div>

          <button
            className="carousel-arrow next"
            aria-label="Next"
            type="button"
          >
            ›
          </button>
        </section>
      </section>
    </main>
  );
}

export default Packages;
