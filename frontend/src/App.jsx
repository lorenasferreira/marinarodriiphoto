import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Packages from "./pages/Packages/Packages";
import Category from "./pages/Category/Category";

function App() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const titles = {
      "/": "Marina Rodrigues Photography",
      "/about": t("about.meta.title"),
      "/contact": t("contact.meta.title"),
      "/packages": t("packages.meta.title"),
    };
    if (titles[location.pathname]) document.title = titles[location.pathname];
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language;
  }, [location.pathname, t, i18n, i18n.resolvedLanguage]);

  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/portfolio/:type" element={<Category />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
