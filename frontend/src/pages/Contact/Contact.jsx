import { useTranslation } from "react-i18next";
import "./Contact.css";

function Contact() {
  const { t } = useTranslation();

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name")?.trim();
    const message = formData.get("message")?.trim();

    if (!name || !message) {
      return;
    }

    const whatsappMessage = t("contact.whatsapp.message", {
      name,
      message,
    });

    const phone = "34654926645";

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      whatsappMessage,
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main id="top" className="page page--contact">
      <section className="contact-hero">
        <div className="contact-photo contact-photo--left">
          <img
            src="/assets/images/portfolio/editorial-artistic/editorial-02.jpg"
            alt={t("contact.images.leftAlt")}
          />
        </div>

        <div className="contact-photo contact-photo--right">
          <img
            src="/assets/images/portfolio/editorial-artistic/editorial-03.jpg"
            alt={t("contact.images.rightAlt")}
          />
        </div>

        <div className="contact-form-wrapper">
          <h1 className="script">{t("contact.hero.title")}</h1>

          <p className="lead">{t("contact.hero.lead")}</p>

          <form
            className="contact-form"
            id="contactForm"
            onSubmit={handleSubmit}
          >
            <div className="field">
              <label htmlFor="name">{t("contact.form.name")}</label>

              <input type="text" id="name" name="name" required />
            </div>

            <div className="field">
              <label htmlFor="message">{t("contact.form.message")}</label>

              <textarea id="message" name="message" rows="5" required />
            </div>

            <button type="submit" className="btn btn--primary">
              {t("contact.form.submit")}
            </button>
          </form>
        </div>
      </section>

      <section className="contact-gallery">
        <div className="gallery-grid">
          {Array.from({ length: 6 }, (_, index) => {
            const imageNumber = String(index + 1).padStart(2, "0");

            return (
              <figure className="gallery-item" key={imageNumber}>
                <img
                  src={`/assets/images/portfolio/portraits/portrait-${imageNumber}.jpg`}
                  alt={t("contact.gallery.imageAlt", {
                    number: index + 1,
                  })}
                />
              </figure>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Contact;
