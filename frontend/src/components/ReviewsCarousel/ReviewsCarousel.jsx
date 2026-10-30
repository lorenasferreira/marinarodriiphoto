import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { reviews, reviewProfile } from "./reviewsData";
import { reviewTranslations } from "./reviewTranslations";
import "./ReviewsCarousel.css";

const languageNames = { en: "English", pt: "Português", es: "Español", ca: "Català" };
const excerptLength = 300;

function ReviewerAvatar({ review }) {
  const [failed, setFailed] = useState(false);
  const initials = review.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <span className="review-avatar" aria-hidden="true">
    {review.avatar && !failed
      ? <img src={review.avatar} alt="" width="64" height="64" onError={() => setFailed(true)} />
      : initials}
  </span>;
}

function ReviewSlides({ language }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const review = reviews[index];
  const translation = reviewTranslations[review.id]?.[language];
  const text = translated && translation ? translation : review.original;
  const long = text.length > excerptLength;
  const cutoff = text.lastIndexOf(" ", excerptLength);
  const displayedText = long && !expanded ? `${text.slice(0, cutoff > 0 ? cutoff : excerptLength)}…` : text;
  const paused = hovered || focused || expanded || hidden || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(media.matches);
    const onVisibility = () => setHidden(document.hidden);
    media.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % reviews.length);
      setExpanded(false);
      setTranslated(false);
    }, reviewProfile.autoplayMs);
    return () => window.clearTimeout(timer);
  }, [paused, index, translated]);

  function navigate(next) {
    setIndex((next + reviews.length) % reviews.length);
    setExpanded(false);
    setTranslated(false);
  }

  return (
    <div className="reviews-carousel" role="region" aria-roledescription={t("reviews.carousel")} aria-label={t("about.reviews.script")}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <p className="reviews-summary"><strong>{reviewProfile.rating.toFixed(1)} / 5</strong><span aria-hidden="true"> · </span>{t("reviews.count", { count: reviewProfile.count })}</p>
      <article className={`testimonial-card ${expanded ? "is-expanded" : ""}`} aria-live={paused ? "polite" : "off"} aria-atomic="true" aria-roledescription={t("reviews.slide")} aria-label={t("reviews.position", { current: index + 1, total: reviews.length })}>
        <div className="testimonial-content" key={review.id}>
          <header className="reviewer"><ReviewerAvatar review={review} /><div><h3>{review.name}</h3><p className="review-stars" aria-label={t("reviews.stars", { count: review.rating })}><span aria-hidden="true">★★★★★</span></p></div></header>
          <blockquote id="review-text" className="review-text" lang={translated ? language : review.language}>{displayedText}</blockquote>
          <div className="review-text-action">{long && <button className="review-text-toggle" type="button" aria-expanded={expanded} aria-controls="review-text" onClick={() => setExpanded((value) => !value)}>{t(expanded ? "reviews.readLess" : "reviews.readMore")}</button>}</div>
          <div className="review-language"><span>{t("reviews.original", { language: languageNames[review.language] })}</span>
            {translation && language !== review.language && <button type="button" aria-pressed={translated} onClick={() => { setTranslated((value) => !value); setExpanded(false); }}>{t(translated ? "reviews.viewOriginal" : "reviews.translate")}</button>}
            {translated && <span className="review-translated">{t("reviews.translated", { language: languageNames[language] })}</span>}
          </div>
          <p className="review-attribution">Google</p>
        </div>
      </article>
      <div className="review-controls">
        <button type="button" className="review-arrow" aria-label={t("reviews.previous")} onClick={() => navigate(index - 1)}><span aria-hidden="true">←</span></button>
        <div className="review-progress" aria-label={t("reviews.navigation")}>{reviews.map((item, position) => <button key={item.id} type="button" aria-label={t("reviews.goTo", { number: position + 1, name: item.name })} aria-current={index === position ? "true" : undefined} onClick={() => navigate(position)}><span /></button>)}</div>
        <button type="button" className="review-arrow" aria-label={t("reviews.next")} onClick={() => navigate(index + 1)}><span aria-hidden="true">→</span></button>
      </div>
      <a className="about-button" href={reviewProfile.url} target="_blank" rel="noopener noreferrer">{t("about.reviews.cta")} <span aria-hidden="true">↗</span></a>
    </div>
  );
}

export default function ReviewsCarousel() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.split("-")[0] || "en";
  return <ReviewSlides key={language} language={language} />;
}
