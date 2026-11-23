import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useScrollReveal from "../../hooks/useScrollReveal";
import { portfolioTypes } from "../Category/portfolioData";
import { portfolioPhotoIndex, selectPortfolioPhotos } from "./portfolioSource";
import usePublicPortfolio from "./usePublicPortfolio";
import "./Portfolio.css";

import { whatsappUrl as getWhatsappUrl } from "../../data/contact";

const imageAltKeys = { publicity: "publicity", "events-bts": "bts", "editorial-artistic": "editorial", portraits: "portrait" };

function photoAlt(image, t) {
  return image.altText?.trim() || t(`packages.${imageAltKeys[image.category]}.alt`);
}

function Lightbox({ images, index, onSelect, onClose, focusFallback }) {
  const { t } = useTranslation();
  const dialog = useRef(null);
  const touch = useRef(null);
  const image = images[index];
  const move = direction => onSelect(images[(index + direction + images.length) % images.length].id);

  useEffect(() => {
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = dialog.current;
    node.showModal();
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      else focusFallback();
    };
  }, [focusFallback]);

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
    <div className={`lightbox-stage${image.title ? " lightbox-stage-titled" : ""}`} onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={event => {
      if (!touch.current) return;
      const dx = event.changedTouches[0].clientX - touch.current.x;
      const dy = event.changedTouches[0].clientY - touch.current.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      touch.current = null;
    }}>
      <img key={image.src} src={image.src} srcSet={image.srcSet} sizes={image.srcSet ? "90vw" : undefined}
        alt={photoAlt(image, t)} width={image.width} height={image.height} />
      {image.title && <p className="lightbox-title">{image.title}</p>}
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
  const syncOpenPhoto = useCallback(photos => {
    setOpened(selection => selection && portfolioPhotoIndex(selectPortfolioPhotos(photos, selection.filter), selection.id) >= 0
      ? selection : null);
  }, []);
  const { photos, status, retry } = usePublicPortfolio(syncOpenPhoto);
  const root = useRef(null);
  const focusFallback = useCallback(() => root.current?.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true }), []);
  const whatsappUrl = getWhatsappUrl(t("gallery.whatsapp.message"));
  const images = selectPortfolioPhotos(photos, active);
  const openIndex = portfolioPhotoIndex(images, opened?.id);
  const revealKey = `${active}:${images.map(image => image.id).join(",")}`;
  useScrollReveal(root, revealKey);
  useEffect(() => { document.title = `${t("gallery.title")} — Marina Rodrigues`; }, [t]);

  return <main id="top" className="portfolio-page" ref={root}>
    <header className="portfolio-intro">
      <h1>{t("gallery.title")}</h1>
      <p>{t("gallery.intro")}</p>
    </header>
    <nav className="portfolio-filters" aria-label={t("gallery.filters")}>
      {["all", ...portfolioTypes].map(category => <button key={category} type="button" aria-pressed={active === category} aria-controls="portfolio-gallery" onClick={() => { setOpened(null); setActive(category); }}>{t(category === "all" ? "gallery.all" : `portfolio.${category}.title`)}</button>)}
    </nav>
    {status === "loading" && <p className="portfolio-status" role="status">{t("gallery.loading")}</p>}
    {status === "error" && <div className="portfolio-status"><p role="alert">{t("gallery.unavailable")}</p><button type="button" onClick={retry}>{t("gallery.retry")}</button></div>}
    {status === "ready" && !images.length && <p className="portfolio-status" role="status">{t("gallery.empty")}</p>}
    <div id="portfolio-gallery" className="portfolio-grid" key={active}>
      {images.map((image, index) => <figure key={image.id} className={`portfolio-photo ${image.width > image.height ? "is-landscape" : "is-portrait"}`} data-reveal>
        <button className="photo-hover" type="button" aria-haspopup="dialog" aria-label={image.title
          ? t("gallery.openTitle", { title: image.title })
          : t("gallery.open", { category: t(`portfolio.${image.category}.title`), number: index + 1 })} onClick={() => setOpened({ id: image.id, filter: active })}>
          <img src={image.thumbnail} width={image.width} height={image.height} alt={photoAlt(image, t)} loading={index < 2 ? "eager" : "lazy"} decoding="async" />
        </button>
      </figure>)}
    </div>
    <section className="portfolio-invitation" data-reveal>
      <h2>{t("about.cta.title")}</h2>
      <p>{t("home.contact.text")}</p>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">{t("about.cta.button")} <span aria-hidden="true">↗</span></a>
    </section>
    {openIndex >= 0 && <Lightbox images={images} index={openIndex} onSelect={id => setOpened({ id, filter: active })}
      onClose={() => setOpened(null)} focusFallback={focusFallback} />}
  </main>;
}

export default function Portfolio() {
  const { type } = useParams();
  if (type && !portfolioTypes.includes(type)) return <Navigate to="/portfolio" replace />;
  return <Gallery key={type || "all"} initialCategory={type} />;
}
