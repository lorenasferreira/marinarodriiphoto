import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Footer.css";

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-editorial">
        <div className="footer-main">
          <div className="footer-identity">
            <Link className="footer-brand" to="/" aria-label={t("ui.homeLabel")}>
              <img src="/assets/images/ui/logo-black.png" alt="" />
              <span>Marina Rodrigues</span>
            </Link>
            <p className="footer-description">{t("footer.description")}</p>
          </div>
          <div className="footer-details">
            <div>
              <p className="footer-label">{t("footer.inquiries")}</p>
              <Link className="footer-contact" to="/contact">{t("nav.contact")} <span aria-hidden="true">↗</span></Link>
            </div>
            <div>
              <p className="footer-label">{t("about.editorial.base")}</p>
              <p>{t("about.editorial.location")}</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-socials">
            <a href="https://www.instagram.com/mrodriiphoto/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://wa.me/34654926645" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
          <div className="footer-legal">
            <p className="footer-copy">© {currentYear} Marina Rodrigues. All rights reserved.</p>
            <a className="footer-credit" href="https://lorenaferreira.dev" target="_blank" rel="noopener noreferrer">Website designed &amp; developed by Lorena Ferreira</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
