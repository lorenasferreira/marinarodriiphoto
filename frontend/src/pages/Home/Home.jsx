import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./Home.css";
import { Link } from "react-router-dom";

const desktopImages = [
  "/assets/images/hero-desktop/hero-01.webp",
  "/assets/images/hero-desktop/hero-02.jpg",
  "/assets/images/hero-desktop/hero-03.jpg",
  "/assets/images/hero-desktop/hero-04.jpg",
  "/assets/images/hero-desktop/hero-05.jpg",
];

const selectedWorks = [
  { type: "editorial-artistic", image: "editorial-01.jpg", alt: "editorial" },
  { type: "portraits", image: "portrait-01.jpg", alt: "portrait" },
  { type: "publicity", image: "publicity-01.webp", alt: "publicity" },
];

const mobileImages = [
  "/assets/images/hero-mobile/hero-01.jpg",
  "/assets/images/hero-mobile/hero-02.jpg",
  "/assets/images/hero-mobile/hero-03.jpg",
  "/assets/images/hero-mobile/hero-04.jpg",
  "/assets/images/hero-mobile/hero-05.jpg",
  "/assets/images/hero-mobile/hero-06.jpg",
  "/assets/images/hero-mobile/hero-07.jpg",
];

function Home() {
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = isMobile ? mobileImages : desktopImages;

  function nextSlide() {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }

  function prevSlide() {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length,
    );
  }

  function goToSlide(index) {
    setCurrentIndex(index);
  }

  useEffect(() => {
    let previousMobile = window.innerWidth <= 768;
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      if (previousMobile !== mobile) {
        setIsMobile(mobile);
        setCurrentIndex(0);
        previousMobile = mobile;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [images.length]);

  return (
    <main className="home-page">
      <section className="hero" id="home">
        <img
          className="hero-image"
          src={images[currentIndex]}
          alt={t("hero.imageAlt", { number: currentIndex + 1 })}
        />

        <div className="hero-metadata">
          <span>{t("hero.location")}</span>
          <span className="hero-frame">
            {t("hero.frame")} {String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
        </div>

        <div className="hero-controls">
          <button
            className="hero-arrow prev"
            type="button"
            aria-label={t("hero.previous")}
            onClick={prevSlide}
          >
            ‹
          </button>

          <button
            className="hero-arrow next"
            type="button"
            aria-label={t("hero.next")}
            onClick={nextSlide}
          >
            ›
          </button>
        </div>

        <div className="hero-dots">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`hero-dot ${index === currentIndex ? "active" : ""}`}
              aria-label={t("hero.goToSlide", { number: index + 1 })}
              aria-current={index === currentIndex ? "true" : undefined}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="script">{t("hero.script")}</div>

          <h1>{t("hero.title")}</h1>

          <div className="subtitle">{t("hero.subtitle")}</div>

        </div>

        <Link to="/packages" className="hero-cta">
          {t("hero.cta")} <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="home-introduction" aria-labelledby="home-about-title">
        <figure className="home-introduction-photo">
          <img src="/assets/images/about/portrait.webp" alt={t("home.about.imageAlt")} loading="lazy" decoding="async" />
        </figure>
        <div className="home-introduction-copy">
          <p className="home-eyebrow">{t("home.about.label")}</p>
          <h2 id="home-about-title">{t("home.about.title")}</h2>
          <p className="home-body">{t("home.about.paragraph1")}</p>
          <p className="home-body">{t("home.about.paragraph2")}</p>
          <Link className="home-editorial-link" to="/about">
            {t("home.about.cta")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="home-selected" aria-labelledby="home-works-title">
        <header className="home-selected-header">
          <p className="home-eyebrow">{t("home.works.label")}</p>
          <h2 id="home-works-title">{t("home.works.title")}</h2>
        </header>
        <div className="home-works-list">
          {selectedWorks.map((work, index) => (
            <article className="home-work" key={work.type} aria-labelledby={`home-work-${work.type}`}>
              <figure className="home-work-photo">
                <img src={`/assets/images/portfolio/${work.type}/${work.image}`} alt={t(`packages.${work.alt}.alt`)} loading="lazy" decoding="async" />
                <figcaption>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{t(`portfolio.${work.type}.subtitle`)}</span>
                </figcaption>
              </figure>
              <div className="home-work-copy">
                <p className="home-eyebrow">{t("home.works.category")}</p>
                <h3 id={`home-work-${work.type}`}>{t(`packages.${work.alt}.title`)}</h3>
                <p className="home-body">{t(`portfolio.${work.type}.text`)}</p>
                <Link className="home-editorial-link" to={`/portfolio/${work.type}`}>
                  {t("home.works.view")} <span className="home-sr-only">— {t(`packages.${work.alt}.title`)}</span><span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="home-portfolio-cta">
          <Link className="home-editorial-link" to="/packages">
            {t("home.works.cta")} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="home-contact" aria-labelledby="home-contact-title">
        <p className="home-eyebrow">{t("nav.contact")}</p>
        <h2 id="home-contact-title">{t("home.contact.title")}</h2>
        <p className="home-body">{t("home.contact.text")}</p>
        <Link className="home-editorial-link" to="/contact">
          {t("home.contact.cta")} <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}

export default Home;
