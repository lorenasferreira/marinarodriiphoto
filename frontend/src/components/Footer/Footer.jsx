import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <img
            src="/assets/images/ui/logo.png"
            alt="Mari Rodrigues Photography"
            className="footer-logo"
          />

          <div className="footer-text">
            <span className="footer-copy">
              © {currentYear} Mari Rodrigues. All rights reserved.
            </span>

            <a
              href="https://lorenaferreira.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-credit"
            >
              Website designed &amp; developed by Lorena Ferreira
            </a>
          </div>
        </div>

        <div className="footer-right">
          <a
            href="https://wa.me/34654926645"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <svg
              className="footer-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.52 3.48A11.8 11.8 0 0 0 12.02 0C5.39 0 .02 5.37.02 12c0 2.12.55 4.18 1.6 6L0 24l6.17-1.62A11.94 11.94 0 0 0 12.02 24C18.65 24 24 18.63 24 12c0-3.2-1.25-6.22-3.48-8.52ZM12.02 21.82a9.8 9.8 0 0 1-4.98-1.35l-.36-.21-3.66.96.98-3.57-.23-.37a9.8 9.8 0 1 1 8.25 4.54Zm5.39-7.38c-.29-.14-1.7-.84-1.97-.94-.27-.1-.47-.14-.67.14-.2.29-.77.94-.94 1.14-.17.2-.35.22-.64.07-.29-.14-1.23-.45-2.35-1.45-.87-.78-1.45-1.74-1.62-2.03-.17-.29-.02-.45.13-.59.13-.13.29-.35.43-.53.14-.17.2-.29.29-.49.1-.2.05-.37-.02-.53-.07-.14-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.53.07-.8.37-.27.29-1.04 1.02-1.04 2.48s1.06 2.86 1.21 3.05c.14.2 2.08 3.18 5.05 4.46.71.31 1.26.49 1.7.62.71.23 1.35.2 1.86.12.57-.08 1.7-.7 1.94-1.38.24-.67.24-1.25.17-1.38-.07-.12-.27-.2-.57-.35Z" />
            </svg>
          </a>

          <a
            href="https://www.instagram.com/mrodriiphoto/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <svg
              className="footer-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Zm4.75-2.38a.88.88 0 1 1-.88-.87.88.88 0 0 1 .88.87Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
