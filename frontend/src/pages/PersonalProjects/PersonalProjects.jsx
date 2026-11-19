import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { publishedProjects, projectContent } from "../../data/personalProjects";
import "./PersonalProjects.css";

function Photograph({ image, language, ...props }) {
  return <img src={image.src} width={image.width} height={image.height} alt={image.translations?.[language]?.alt || image.alt} decoding="async" {...props} />;
}

function ProjectCover({ image, language, ...props }) {
  const { t } = useTranslation();
  return image
    ? <Photograph image={image} language={language} {...props} />
    : <div className="project-cover-placeholder">{t("projects.coverPlaceholder")}</div>;
}

function ProjectLightbox({ images, initialIndex, onClose, returnFocus }) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(initialIndex);
  const dialog = useRef(null);
  const move = step => setIndex(value => (value + step + images.length) % images.length);
  useEffect(() => {
    const trigger = returnFocus;
    const overflow = document.body.style.overflow;
    const node = dialog.current;
    document.body.style.overflow = "hidden";
    node.showModal();
    return () => { node.close(); document.body.style.overflow = overflow; trigger?.focus({ preventScroll: true }); };
  }, [returnFocus]);
  return createPortal(<dialog className="project-lightbox" ref={dialog} aria-label={t("gallery.viewer")} onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
    if (event.key === "Tab") {
      const buttons = [...dialog.current.querySelectorAll("button")];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  }}>
    <button className="project-close" onClick={onClose} aria-label={t("gallery.close")} autoFocus>×</button>
    <div className="project-stage"><Photograph image={images[index]} language={i18n.resolvedLanguage} /></div>
    <div className="project-controls">
      <button onClick={() => move(-1)} aria-label={t("gallery.previous")}>←</button>
      <span aria-live="polite" aria-atomic="true">{t("gallery.position", { current: index + 1, total: images.length })}</span>
      <button onClick={() => move(1)} aria-label={t("gallery.next")}>→</button>
    </div>
  </dialog>, document.body);
}

export function UnavailableProject({ basePath = "/personal-projects" }) {
  const { t } = useTranslation();
  return <main id="top" className="projects-page projects-unavailable"><h1>{t("projects.unavailable")}</h1><Link className="project-link" to={basePath}>{t("projects.back")} <span aria-hidden="true">↗</span></Link></main>;
}

export function ProjectList({ projects, basePath }) {
  const { t, i18n } = useTranslation();
  return <div className="project-list">{projects.map(project => {
    const content = projectContent(project, i18n.resolvedLanguage);
    return <article className="project-preview" key={project.id}>
      <Link to={`${basePath}/${project.slug}`} aria-label={t("projects.viewNamed", { title: content.title })}>
        <ProjectCover image={project.coverImage} language={i18n.resolvedLanguage} loading="lazy" />
        <div className="project-caption"><h2>{content.title}</h2><span aria-hidden="true">↗</span></div>
      </Link>
      {content.category && <p>{t(`projects.category.${content.category}`)}</p>}
      {content.subtitle && <p>{content.subtitle}</p>}
    </article>;
  })}</div>;
}

export function PersonalProjects() {
  const { t } = useTranslation();
  const projects = publishedProjects();
  return <main id="top" className="projects-page">
    <header className="projects-intro"><h1>{t("nav.personalProjects")}</h1><p>{t("projects.intro")}</p></header>
    {projects.length ? <ProjectList projects={projects} basePath="/personal-projects" /> : <section className="projects-empty"><p>{t("projects.empty")}</p><Link className="project-link" to="/portfolio">{t("projects.portfolio")} <span aria-hidden="true">↗</span></Link></section>}
  </main>;
}

export function ProjectDetail({ project, basePath = "/personal-projects", children }) {
  const { t, i18n } = useTranslation();
  const [opened, setOpened] = useState(null);
  const content = projectContent(project, i18n.resolvedLanguage);
  const gallery = project.galleryImages ?? [];
  return <main id="top" className="projects-page project-detail">
    {children}
    <Link className="project-link" to={basePath}>← {t("projects.back")}</Link>
    <header className="projects-intro">
      <h1>{content.title}</h1>
      {content.category && <p>{t(`projects.category.${content.category}`)}</p>}
      {content.subtitle && <p>{content.subtitle}</p>}
    </header>
    <ProjectCover image={project.coverImage} language={i18n.resolvedLanguage} fetchPriority="high" />
    {(content.description || content.awardDetails || content.credits?.length > 0) && <div className="project-statement">
      {content.description && <p>{content.description}</p>}
      {content.awardDetails && <p>{content.awardDetails}</p>}
      {content.credits?.length > 0 && <section><h2>{t("projects.credits")}</h2>{content.credits.map((credit, index) => <p key={index}>{credit}</p>)}</section>}
    </div>}
    {gallery.length > 0 && <div className="project-gallery">{gallery.map((image, index) => <figure key={image.id || image.src} className={image.width > image.height ? "landscape" : "portrait"}>
      <button type="button" aria-haspopup="dialog" aria-label={t("projects.openImage", { number: index + 1 })} onClick={event => { setOpened({ index, trigger: event.currentTarget }); }}><Photograph image={image} language={i18n.resolvedLanguage} loading="lazy" /></button>
    </figure>)}</div>}
    {project.videos?.map((video, index) => <video
      className="project-video"
      key={video.src}
      src={video.src}
      controls
      playsInline
      preload="none"
      aria-label={t("projects.video", { number: index + 1 })}
    >
      {video.captions?.map(track => <track key={track.srcLang} kind="captions" {...track} />)}
    </video>)}
    <Link className="project-link project-return" to={basePath}>← {t("projects.back")}</Link>
    {opened !== null && <ProjectLightbox images={gallery} initialIndex={opened.index} returnFocus={opened.trigger} onClose={() => setOpened(null)} />}
  </main>;
}

export function PersonalProject() {
  const { slug } = useParams();
  const project = publishedProjects().find(item => item.slug === slug);
  return project ? <ProjectDetail key={slug} project={project} /> : <UnavailableProject />;
}
