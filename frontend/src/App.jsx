import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header/Header";
import BackToTop from "./components/BackToTop/BackToTop";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Portfolio from "./pages/Portfolio/Portfolio";

function App() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const titles = {
      "/": "Marina Rodrigues Photography",
      "/about": t("about.meta.title"),
      "/contact": t("contact.meta.title"),
      "/packages": `${t("gallery.title")} — Marina Rodrigues`,
    };
    if (titles[location.pathname]) document.title = titles[location.pathname];
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language;
  }, [location.pathname, t, i18n, i18n.resolvedLanguage]);

  return (
    <>
      <ScrollToTop />
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/packages" element={<Portfolio />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:type" element={<Portfolio />} />
      </Routes>

      <BackToTop />
      <Footer />
    </>
  );
}

export default App;
