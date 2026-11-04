import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useScrollReveal from "../../hooks/useScrollReveal";
import { portfolioImages, portfolioTypes } from "../Category/portfolioData";
import "./Portfolio.css";

// Existing WhatsApp contact used by Contact.jsx and Footer.jsx.
const whatsappNumber = "34654926645";

const imageAltKeys = { publicity: "publicity", "events-bts": "bts", "editorial-artistic": "editorial", portraits: "portrait" };

const photos = portfolioTypes.flatMap(category => portfolioImages[category].map(image => ({
  ...image, category, src: `/assets/images/portfolio/${category}/${image.file}`,
  thumbnail: `/assets/images/portfolio-thumbnails/${category}/${image.file}.jpg`,
})));

function Lightbox({ images, initialIndex, onClose }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(initialIndex);
  const dialog = useRef(null);
  const touch = useRef(null);
  const image = images[index];
  const move = direction => setIndex(current => (current + direction + images.length) % images.length);

  useEffect(() => {
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = dialog.current;
    node.showModal();
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(<dialog ref={dialog} className="portfolio-lightbox" aria-label={t("gallery.viewer")} onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
    if (event.key === "Tab") {
      const buttons = [...dialog.current.querySelectorAll("button")];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  }}>
    <button className="lightbox-close" aria-label={t("gallery.close")} onClick={onClose} autoFocus>×</button>
    <div className="lightbox-stage" onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={event => {
      if (!touch.current) return;
      const dx = event.changedTouches[0].clientX - touch.current.x;
      const dy = event.changedTouches[0].clientY - touch.current.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      touch.current = null;
    }}>
      <img key={image.src} src={image.src} alt={t(`packages.${imageAltKeys[image.category]}.alt`)} width={image.width} height={image.height} />
    </div>
    <div className="lightbox-controls">
      <button aria-label={t("gallery.previous")} onClick={() => move(-1)}>←</button>
      <span aria-live="polite" aria-atomic="true">{t("gallery.position", { current: index + 1, total: images.length })}</span>
      <button aria-label={t("gallery.next")} onClick={() => move(1)}>→</button>
    </div>
  </dialog>, document.body);
}

function Gallery({ initialCategory }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(initialCategory || "all");
  const [opened, setOpened] = useState(null);
  const root = useRef(null);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t("gallery.whatsapp.message"))}`;
  const images = active === "all" ? photos : photos.filter(image => image.category === active);
  useScrollReveal(root, active);
  useEffect(() => { document.title = `${t("gallery.title")} — Marina Rodrigues`; }, [t]);

  return <main id="top" className="portfolio-page" ref={root}>
    <header className="portfolio-intro">
      <h1>{t("gallery.title")}</h1>
      <p>{t("gallery.intro")}</p>
    </header>
    <nav className="portfolio-filters" aria-label={t("gallery.filters")}>
      {["all", ...portfolioTypes].map(category => <button key={category} type="button" aria-pressed={active === category} aria-controls="portfolio-gallery" onClick={() => setActive(category)}>{t(category === "all" ? "gallery.all" : `portfolio.${category}.title`)}</button>)}
    </nav>
    <div id="portfolio-gallery" className="portfolio-grid" key={active}>
      {images.map((image, index) => <figure key={image.src} className={`portfolio-photo ${image.width > image.height ? "is-landscape" : "is-portrait"}`} data-reveal>
        <button className="photo-hover" type="button" aria-haspopup="dialog" aria-label={t("gallery.open", { category: t(`portfolio.${image.category}.title`), number: index + 1 })} onClick={() => setOpened(index)}>
          <img src={image.thumbnail} width={image.width} height={image.height} alt={t(`packages.${imageAltKeys[image.category]}.alt`)} loading={index < 2 ? "eager" : "lazy"} decoding="async" />
        </button>
      </figure>)}
    </div>
    <section className="portfolio-invitation" data-reveal>
      <h2>{t("about.cta.title")}</h2>
      <p>{t("home.contact.text")}</p>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">{t("about.cta.button")} <span aria-hidden="true">↗</span></a>
    </section>
    {opened !== null && <Lightbox images={images} initialIndex={opened} onClose={() => setOpened(null)} />}
  </main>;
}

export default function Portfolio() {
  const { type } = useParams();
  if (type && !portfolioTypes.includes(type)) return <Navigate to="/portfolio" replace />;
  return <Gallery key={type || "all"} initialCategory={type} />;
}
