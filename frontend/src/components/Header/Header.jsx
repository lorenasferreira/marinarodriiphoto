import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Header.css";

const languages = ["en", "es", "ca", "pt"];

function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
      <nav className="nav">
        <div className="nav-left">
          <button
            className="menu-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => {
              setLanguageOpen(false);
              setMenuOpen((previousValue) => !previousValue);
            }}
          >
            ☰
          </button>

          <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
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
              aria-label="Change language"
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

export default Header;
