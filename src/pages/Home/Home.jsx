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
  "/assets/images/hero-desktop/hero-06.webp",
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
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setCurrentIndex(0);
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
    <main>
      <section className="hero" id="home">
        <img
          className="hero-image"
          src={images[currentIndex]}
          alt="Hero image"
        />

        <div className="hero-controls">
          <button
            className="hero-arrow prev"
            type="button"
            aria-label="Previous slide"
            onClick={prevSlide}
          >
            ‹
          </button>

          <button
            className="hero-arrow next"
            type="button"
            aria-label="Next slide"
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
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="script">{t("hero.script")}</div>

          <h1>{t("hero.title")}</h1>

          <div className="subtitle">{t("hero.subtitle")}</div>

          <div className="divider">
            <img src="/assets/images/ui/logo.png" alt="Mari Rodrigues Logo" />
          </div>

          <Link to="/packages" className="btn">
            {t("hero.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
