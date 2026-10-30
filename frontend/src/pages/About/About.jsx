import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import useScrollReveal from "../../hooks/useScrollReveal";
import { aboutContent } from "./aboutContent";
import ReviewsCarousel from "../../components/ReviewsCarousel/ReviewsCarousel";
import "./About.css";

function About() {
  const { t } = useTranslation();
  const root = useRef(null);
  const currentYear = new Date().getFullYear();
  useScrollReveal(root);
  return (
    <main id="top" className="about-page" ref={root} tabIndex={-1}>
      <section className="about-intro" aria-labelledby="about-heading">
        <div className="about-intro-copy">
          <p className="about-kicker">{t("about.editorial.manifesto")}</p>
          <h1 id="about-heading">{t("about.hero.greeting")} {t("about.hero.name")}</h1>
          <p className="about-prose">{t("about.hero.lead")}</p>
          <dl className="about-metadata">
            <div><dt>{t("about.editorial.base")}</dt><dd>{t(aboutContent.baseKey)}</dd></div>
            <div><dt>{t("about.editorial.creativeDisciplines")}</dt><dd>{t(aboutContent.disciplinesKey)}</dd></div>
          </dl>
        </div>
        <figure className="about-portrait" data-reveal>
          <div className="about-portrait-window"><img src="/assets/images/about/portrait-client.webp" width="960" height="1282" alt={t("home.about.imageAlt")} /></div>
          <figcaption>
            <span>Marina Rodrigues · {aboutContent.portraitLocation}</span>
            {/* Decorative film reference, not camera or capture metadata. */}
            <span className="about-film-reference"><span aria-hidden="true">35mm / </span>{currentYear}</span>
          </figcaption>
        </figure>
        <span className="about-dotgrid" aria-hidden="true" />
      </section>

      <section className="about-philosophy" aria-labelledby="philosophy-heading">
        <span className="about-watermark" aria-hidden="true">{t("about.hero.script")}</span>
        <div className="about-philosophy-copy">
          <p className="about-kicker" data-reveal>{t("about.editorial.philosophy")}</p>
          <h2 id="philosophy-heading" data-reveal>{t("about.section.paragraph1")}</h2>
          <div data-reveal>{[2, 3, 4].map((number) => <p className="about-prose" key={number}>{t(`about.section.paragraph${number}`)}</p>)}</div>
          <dl className="about-statistics" data-reveal>
            {aboutContent.statistics.map((stat) => (
              <div key={stat.id}>
                <dt>
                  {stat.value ?? (import.meta.env.DEV ? stat.developmentPlaceholder : "…")}
                  <span className="about-stat-plus" aria-hidden="true">+</span>
                </dt>
                <dd>
                  {t(stat.labelKey)}
                  {stat.value === null && <span className="about-stat-pending">{t("about.stats.pending")}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="about-photo-stack" data-reveal>
          <figure className="about-editorial-photo"><div><img src="/assets/images/about/about-1.webp" alt={t("about.images.philosophy")} loading="lazy" /></div><figcaption>{t("about.editorial.observation")}</figcaption></figure>
          <figure className="about-editorial-photo about-photo-detail"><div><img src="/assets/images/about/about-2.webp" alt={t("about.images.detail")} loading="lazy" /></div><figcaption>{t("about.editorial.detail")}</figcaption></figure>
        </div>
      </section>

      <section className="about-stories" aria-labelledby="facts-heading">
        <header className="about-stories-heading"><div><p className="about-kicker" data-reveal>{t("about.editorial.trajectory")}</p><h2 id="facts-heading" data-reveal>{t("about.facts.script")}</h2></div><p className="about-prose" data-reveal>{t("about.facts.subtitle")}</p></header>
        <div className="about-story-grid" tabIndex={0} role="region" aria-label={t("about.facts.script")}>{aboutContent.stories.map((story, index) => <article className="about-story-card" key={story.id} data-reveal style={{ "--reveal-delay": `${index * 80}ms` }}>
          <header><span>{String(index + 1).padStart(2, "0")} / {t(story.categoryKey)}</span>{story.place && <span>{story.place}</span>}</header>
          <figure className="about-story-image"><img src={`/assets/images/about/${story.image}`} alt={t(`about.images.story.${story.id}`)} loading="lazy" /></figure>
          <h3>{t(`about.facts.${story.id}.title`)}</h3><p className="about-prose">{t(`about.facts.${story.id}.text`)}</p>
        </article>)}</div>
      </section>

      <section className="about-reviews" aria-labelledby="reviews-heading">
        <p className="about-kicker" data-reveal>{t("about.editorial.voices")}</p>
        <h2 id="reviews-heading" data-reveal>{t("about.reviews.script")}</h2>
        <ReviewsCarousel />
      </section>
      <section className="about-invitation" aria-labelledby="invitation-heading">
        <div data-reveal><p className="about-kicker">{t("about.editorial.collaborate")}</p><h2 id="invitation-heading">{t("about.cta.title")}</h2><p className="about-prose">{t("about.cta.text")}</p><Link className="about-button" to="/contact">{t("about.cta.button")} <span aria-hidden="true">→</span></Link></div>
      </section>
    </main>
  );
}
export default About;
