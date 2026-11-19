import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";

import Header from "./components/Header/Header";
import BackToTop from "./components/BackToTop/BackToTop";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Portfolio from "./pages/Portfolio/Portfolio";
import { PersonalProjects, PersonalProject } from "./pages/PersonalProjects/PersonalProjects";
import { publishedProjects, projectContent } from "./data/personalProjects";

// Vite removes both imports and route elements from the production bundle.
const AdminPrototype = import.meta.env.DEV ? lazy(() => import("./dev/AdminPrototype")) : null;
const ProjectPreview = import.meta.env.DEV ? lazy(() => import("./dev/ProjectPreview")) : null;

function NotFound() {
  const { t } = useTranslation();
  return <main id="top" className="projects-page projects-unavailable"><h1>{t("ui.notFound")}</h1><Link className="project-link" to="/">{t("ui.returnHome")}</Link></main>;
}

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
    const project = publishedProjects().find(item => location.pathname === `/personal-projects/${item.slug}`);
    const projectRoute = location.pathname.startsWith("/personal-projects/");
    const known = Boolean(titles[location.pathname]) || location.pathname.startsWith("/portfolio") || location.pathname === "/personal-projects" || Boolean(project);
    document.title = project ? `${projectContent(project, i18n.resolvedLanguage).title} — Marina Rodrigues` :
      titles[location.pathname] || `${t(location.pathname === "/personal-projects" ? "nav.personalProjects" : projectRoute ? "projects.unavailable" : location.pathname.startsWith("/portfolio") ? "gallery.title" : "ui.notFound")} — Marina Rodrigues`;
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = (projectRoute && !project) || !known ? "noindex, nofollow" : "index, follow";
    document.head.appendChild(robots);
    if (import.meta.env.DEV && /^\/(admin|dev)(?:\/|$)/.test(location.pathname)) {
      document.title = `${location.pathname.startsWith("/admin") ? "Studio prototype" : "Project layout preview"} — Marina Rodrigues`;
    }
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language;
    return () => robots.remove();
  }, [location.pathname, t, i18n, i18n.resolvedLanguage]);

  const isAdmin = import.meta.env.DEV && /^\/admin(?:\/|$)/.test(location.pathname);

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Header />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/packages" element={<Navigate to="/portfolio" replace />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:type" element={<Portfolio />} />
        <Route path="/personal-projects" element={<PersonalProjects />} />
        <Route path="/personal-projects/:slug" element={<PersonalProject />} />
        {import.meta.env.DEV && <>
          <Route path="/admin/*" element={<Suspense fallback={<main className="projects-page">Loading prototype…</main>}><AdminPrototype /></Suspense>} />
          <Route path="/dev/personal-projects/:slug?" element={<Suspense fallback={<main className="projects-page">Loading preview…</main>}><ProjectPreview /></Suspense>} />
        </>}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdmin && <><BackToTop /><Footer /></>}
    </>
  );
}

export default App;
