import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./BackToTop.css";

export default function BackToTop() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > Math.max(600, window.innerHeight));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  if (!visible) return null;
  return <button className="back-to-top" type="button" aria-label={t("ui.backToTop")} onClick={() => {
    document.querySelector(".header-brand")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }}><span aria-hidden="true">↑</span></button>;
}
