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
    </main>
  );
}

export default Home;
