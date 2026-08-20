import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import pt from "./locales/pt.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import ca from "./locales/ca.json";

const supportedLanguages = ["pt", "en", "es", "ca"];

const savedLanguage = localStorage.getItem("language");

const initialLanguage = supportedLanguages.includes(savedLanguage)
  ? savedLanguage
  : "pt";

i18n.use(initReactI18next).init({
  resources: {
    pt: {
      translation: pt,
    },
    en: {
      translation: en,
    },
    es: {
      translation: es,
    },
    ca: {
      translation: ca,
    },
  },

  lng: initialLanguage,

  fallbackLng: "en",

  supportedLngs: supportedLanguages,

  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem("language", language);
});

export default i18n;
