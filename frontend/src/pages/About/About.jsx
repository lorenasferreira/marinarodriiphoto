import { useTranslation } from "react-i18next";
import "./About.css";

function About() {
  const { t } = useTranslation();

  return (
    <main id="top" className="page">
      <section className="about-hero">
        <div className="hero-bg" aria-hidden="true"></div>

        <div className="hero-inner">
          <div className="hero-card">
            <h1 className="display">
              <span className="display__brand">{t("about.hero.greeting")}</span>

              <span className="display__name">{t("about.hero.name")}</span>
            </h1>

            <p className="about-lead">{t("about.hero.lead")}</p>
          </div>

          <figure className="polaroid">
            <img src="/assets/images/about/portrait.webp" alt="Portrait" />
          </figure>

          <div className="hero-stickers" aria-hidden="true">
            <span className="star"></span>
            <span className="star star--sm"></span>
            <span className="dotgrid"></span>
          </div>
        </div>
      </section>

      <section id="about" className="section section--about">
        <span className="bg-script bg-script--about">
          {t("about.hero.script")}
        </span>

        <div className="collage">
          <div className="collage__paper">
            <div className="two-col">
              <div>
                <p className="body">{t("about.section.paragraph1")}</p>
                <p className="body">{t("about.section.paragraph2")}</p>
                <p className="body">{t("about.section.paragraph3")}</p>
                <p className="body">{t("about.section.paragraph4")}</p>
              </div>

              <div className="stack">
                <figure className="torn torn--left">
                  <img src="/assets/images/about/about-1.webp" alt="" />
                </figure>

                <figure className="tape-card">
                  <img src="/assets/images/about/about-2.webp" alt="" />

                  <span className="tape tape--a"></span>
                  <span className="tape tape--b"></span>
                </figure>
              </div>
            </div>
          </div>

          <div className="collage__edge"></div>
        </div>
      </section>

      <section id="facts" className="section section--story">
        <span className="bg-script bg-script--story">
          {t("about.facts.script")}
        </span>

        <div className="story-wrap">
          <header className="story-header">
            <p className="body body--muted">{t("about.facts.subtitle")}</p>
          </header>

          <div className="triptych">
            <figure className="torn">
              <img src="/assets/images/about/story-1.webp" alt="" />

              <figcaption className="fact">
                <strong>{t("about.facts.one.title")}</strong>
                <br />
                {t("about.facts.one.text")}
              </figcaption>
            </figure>

            <figure className="torn">
              <img src="/assets/images/about/story-2.webp" alt="" />

              <figcaption className="fact">
                <strong>{t("about.facts.two.title")}</strong>
                <br />
                {t("about.facts.two.text")}
              </figcaption>
            </figure>

            <figure className="torn">
              <img src="/assets/images/about/story-3.webp" alt="" />

              <figcaption className="fact">
                <strong>{t("about.facts.three.title")}</strong>
                <br />
                {t("about.facts.three.text")}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="reviews-cta" className="section section--reviews">
        <div className="reviews-wrap">
          <h2 className="script">{t("about.reviews.script")}</h2>

          <div className="reviews-card">
            <p className="body">{t("about.reviews.text")}</p>

            <a
              className="link-cta link-cta--reviews"
              href="https://maps.app.goo.gl/H2drHAxMrZ5mmiru8"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("about.reviews.cta")}
            </a>
          </div>

          <div className="cta-wrap cta-wrap--inline">
            <h2 className="about-script">{t("about.cta.title")}</h2>

            <p className="cta-text">{t("about.cta.text")}</p>

            <a
              className="link-cta link-cta--primary"
              href="https://wa.me/+34654926645"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              {t("about.cta.button")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
