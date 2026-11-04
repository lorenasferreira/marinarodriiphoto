import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Header.css";

const languages = ["en", "es", "ca", "pt"];

function HeaderContent() {
  const { t, i18n } = useTranslation();
  const headerRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  const detectedLanguage = i18n.language?.split("-")[0];

  const currentLanguage = languages.includes(detectedLanguage)
    ? detectedLanguage
    : "en";

  function changeLanguage(language) {
    i18n.changeLanguage(language);
    setLanguageOpen(false);
    setMenuOpen(false);
  }

  function closeMenu() {
    setMenuOpen(false);
    setLanguageOpen(false);
  }

  useEffect(() => {
    let previous = window.scrollY;
    let anchor = previous;
    let direction = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const nextDirection = Math.sign(y - previous);
      if (nextDirection && nextDirection !== direction) { anchor = previous; direction = nextDirection; }
      setIsScrolled(y > 20);
      if (y < 100 || menuOpen || languageOpen || headerRef.current?.contains(document.activeElement)) {
        setHidden(false);
        anchor = y;
      } else if (Math.abs(y - anchor) > 14) {
        setHidden(direction > 0);
      }
      previous = y;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [menuOpen, languageOpen]);

  return (
    <header ref={headerRef} onFocusCapture={() => setHidden(false)} onKeyDown={(event) => {
      if (event.key === "Escape" && (menuOpen || languageOpen)) {
        headerRef.current?.querySelector(languageOpen ? ".lang-current" : ".menu-toggle")?.focus();
        closeMenu();
      }
    }} className={`site-header home-header ${isScrolled ? "is-scrolled" : ""} ${hidden && !menuOpen && !languageOpen ? "is-hidden" : ""}`}>
      <nav className="nav">
        <Link to="/" className="header-brand" aria-label={t("ui.homeLabel")} onClick={closeMenu}>
            <img src="/assets/images/ui/logo-black.png" alt="" />
            <span>Marina Rodrigues</span>
          </Link>
        <div className="nav-left">
          <button
            className="menu-toggle"
            type="button"
            aria-label={t(menuOpen ? "ui.closeMenu" : "ui.openMenu")}
            aria-controls="site-navigation"
            aria-expanded={menuOpen}
            onClick={() => {
              setLanguageOpen(false);
              setMenuOpen((previousValue) => !previousValue);
            }}
          >
            ☰
          </button>

          <ul id="site-navigation" className={`nav-links ${menuOpen ? "open" : ""}`}>
            <li>
              <Link to="/" onClick={closeMenu}>
                {t("nav.home")}
              </Link>
            </li>

            <li>
              <Link to="/packages" onClick={closeMenu}>
                {t("nav.portfolio")}
              </Link>
            </li>

            <li>
              <Link to="/about" onClick={closeMenu}>
                {t("nav.about")}
              </Link>
            </li>

            <li>
              <Link to="/contact" onClick={closeMenu}>
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="lang-switch">
          <div className="lang-desktop">
            {languages.map((language) => (
              <button
                key={language}
                type="button"
                className={currentLanguage === language ? "active" : ""}
                onClick={() => changeLanguage(language)}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="lang-mobile">
            <button
              className="lang-current"
              type="button"
              aria-label={t("ui.changeLanguage")}
              aria-expanded={languageOpen}
              onClick={() => {
                setMenuOpen(false);
                setLanguageOpen((previousValue) => !previousValue);
              }}
            >
              {currentLanguage.toUpperCase()} ▾
            </button>

            <ul className={`lang-dropdown ${languageOpen ? "open" : ""}`}>
              {languages
                .filter((language) => language !== currentLanguage)
                .map((language) => (
                  <li key={language}>
                    <button
                      type="button"
                      onClick={() => changeLanguage(language)}
                    >
                      {language.toUpperCase()}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

function Header() {
  const { pathname } = useLocation();
  return <HeaderContent key={pathname} />;
}

export default Header;
