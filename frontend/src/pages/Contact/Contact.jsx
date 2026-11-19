import { useState } from "react";
import { useTranslation } from "react-i18next";
import { whatsappUrl } from "../../data/contact";
import "./Contact.css";

export default function Contact() {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const photos = [1, 2, 3, 4, 5, 6];
  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get("name").trim();
    const message = data.get("message").trim();
    if (!name || !message) return;
    window.open(whatsappUrl(t("contact.whatsapp.message", { name, message })), "_blank", "noopener,noreferrer");
  }
  return <main id="top" className="contact-editorial">
    <div className="contact-opening">
    <header className="contact-intro">
      <p className="contact-eyebrow">{t("footer.inquiries")}</p>
      <h1>{t("contact.hero.title")}</h1>
      <p>{t("contact.hero.lead")}</p>
    </header>
    <div className="contact-mosaic" aria-label={t("contact.mosaic")}>
      <figure className="contact-mosaic-main"><img src="/assets/images/portfolio-thumbnails/editorial-artistic/editorial-02.jpg.jpg" alt={t("contact.photo.editorial")} width="640" height="960" fetchPriority="high" /></figure>
      <figure className="contact-mosaic-detail"><img src="/assets/images/portfolio-thumbnails/portraits/portrait-04.jpg.jpg" alt={t("contact.photo.portrait")} width="640" height="960" /></figure>
      <span className="contact-photo-caption">Marina Rodrigues — {t("nav.portfolio")}</span>
    </div>
    </div>
    <section className="contact-paths" aria-label={t("contact.section.title")}>
      <div className="contact-primary">
        <h2>{t("about.cta.title")}</h2>
        <p>{t("home.contact.text")}</p>
        <a className="contact-link" href={whatsappUrl(t("gallery.whatsapp.message"))} target="_blank" rel="noopener noreferrer">{t("contact.direct")} <span aria-hidden="true">↗</span></a>

      </div>
      <details className="contact-compose">
        <summary>{t("contact.compose")}</summary>
        <p id="contact-form-note">{t("contact.form.note")}</p>
        <form onSubmit={handleSubmit} aria-describedby="contact-form-note">
          <label htmlFor="name">{t("contact.form.name")}</label>
          <input id="name" name="name" autoComplete="name" required maxLength={120} pattern={".*\\S.*"} />
          <label htmlFor="message">{t("contact.form.message")}</label>
          <textarea id="message" name="message" rows={5} required maxLength={3000} />
          <button className="contact-link" type="submit">{t("contact.form.open")} <span aria-hidden="true">↗</span></button>
        </form>
      </details>
    </section>
    <section className="contact-film" aria-label={t("contact.filmstrip")}>
      <div className="contact-film-heading"><p>{t("gallery.intro")}</p><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{t(paused ? "contact.motion.resume" : "contact.motion.pause")}</button></div>
      <div className={`contact-film-window ${paused ? "is-paused" : ""}`}>
        <div className="contact-film-track">
          {[0, 1].map(copy => <div className="contact-film-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {photos.map(number => <figure key={number}><img src={`/assets/images/portfolio-thumbnails/portraits/portrait-${String(number).padStart(2, "0")}.jpg.jpg`} alt={copy ? "" : t("contact.photo.frame", { number })} loading="lazy" width="280" height="360" /><figcaption aria-hidden="true">{String(number).padStart(2, "0")}</figcaption></figure>)}
          </div>)}
        </div>
      </div>
    </section>
  </main>;
}
