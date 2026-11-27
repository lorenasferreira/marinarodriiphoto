import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { publishedProjects, projectContent, projectSections } from "../../data/personalProjects";
import "./PersonalProjects.css";

function Photograph({ image, language, sizes, ...props }) {
  const srcSet = sizes && image.small && image.smallWidth < image.width
    ? `${image.small} ${image.smallWidth}w, ${image.src} ${image.width}w`
    : undefined;
  return <img src={image.src} srcSet={srcSet} sizes={srcSet ? sizes : undefined}
    width={image.width} height={image.height}
    alt={image.translations?.[language]?.alt || image.alt} decoding="async" {...props} />;
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
  const [zoom, setZoom] = useState(1);
  const dialog = useRef(null);
  const stage = useRef(null);
  const image = images[index];
  const move = step => {
    setIndex(value => (value + step + images.length) % images.length);
    setZoom(1);
  };
  const changeZoom = step => setZoom(value => Math.max(1, Math.min(3, value + step)));
  useEffect(() => {
    const viewport = stage.current;
    viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
    viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
  }, [zoom, index]);
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
    <div className="project-zoom">
      <button onClick={() => changeZoom(-0.5)} aria-disabled={zoom === 1} aria-label={t("gallery.zoomOut")}>−</button>
      <button onClick={() => changeZoom(0.5)} aria-disabled={zoom === 3} aria-label={t("gallery.zoomIn")}>+</button>
    </div>
    <div className="project-stage" ref={stage} tabIndex={zoom > 1 ? 0 : undefined}>
      <Photograph image={image} language={i18n.resolvedLanguage}
        style={{ "--zoom": zoom, "--photo-ratio": image.width / image.height, "--photo-width": `${image.width}px` }} />
    </div>
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

export function ProjectList({ projects, basePath, headingLevel = "h2" }) {
  const { t, i18n } = useTranslation();
  const Heading = headingLevel;
  return <div className="project-list">{projects.map(project => {
    const content = projectContent(project, i18n.resolvedLanguage);
    return <article className="project-preview" id={`project-${project.slug}`} key={project.id}>
      <Link to={`${basePath}/${project.slug}`} state={{ fromProjectList: basePath }}
        aria-label={t("projects.viewNamed", { title: content.title })}>
        <ProjectCover image={project.coverImage} language={i18n.resolvedLanguage} sizes="(max-width: 768px) 87vw, 42vw" loading="lazy" />
        <div className="project-caption"><Heading>{content.title}</Heading><span aria-hidden="true">↗</span></div>
      </Link>
      {content.category && <p>{t(`projects.category.${content.category}`)}</p>}
      {content.subtitle && <p>{content.subtitle}</p>}
    </article>;
  })}</div>;
}

function EditorialSections({ sections, basePath }) {
  const { t } = useTranslation();
  if (!sections.length) return null;
  return <div className="project-editorial">{sections.map(({ id, entries }) =>
    <section className="project-editorial-section" key={id} aria-labelledby={id} data-section={id}>
      <h2 id={id}>{t(`projects.editorial.${id}`)}</h2>
      <ProjectList projects={entries} basePath={basePath} headingLevel="h3" />
    </section>
  )}</div>;
}

export function PersonalProjects() {
  return <ProjectsLanding sections={projectSections(publishedProjects())} basePath="/personal-projects" />;
}

export function ProjectsLanding({ sections, basePath }) {
  const { t } = useTranslation();
  return <main id="top" className="projects-page">
    <header className="projects-intro"><h1>{t("nav.personalProjects")}</h1><p>{t("projects.intro")}</p></header>
    {sections.length > 0 && <nav className="project-section-links" aria-label={t("nav.personalProjects")}>
      {sections.map(({ id }) => <a className="project-link" key={id} href={`#${id}`}>{t(`projects.editorial.${id}`)}</a>)}
    </nav>}
    {!sections.length && <section className="projects-empty">
      <p>{t("projects.empty")}</p>
      <Link className="project-link" to="/portfolio">{t("projects.portfolio")} <span aria-hidden="true">↗</span></Link>
    </section>}
    <EditorialSections sections={sections} basePath={basePath} />
  </main>;
}

export function ProjectDetail({ project, basePath = "/personal-projects", previous, next }) {
  const { t, i18n } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(null);
  const content = projectContent(project, i18n.resolvedLanguage);
  const gallery = project.galleryImages ?? [];
  const language = i18n.resolvedLanguage;
  const groups = project.imageGroups || [{ ids: gallery.map(image => image.id || image.src) }];
  const paragraphs = text => text?.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>);
  const backToProjectList = {
    to: `${basePath}#project-${project.slug}`,
    onClick(event) {
      if (state?.fromProjectList !== basePath || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(-1);
    },
  };

  return <main id="top" className="projects-page project-detail" data-project={project.slug}>
    <Link className="project-link project-back" {...backToProjectList}>← {t("projects.back")}</Link>
    <header className="projects-intro">
      <h1>{content.title}</h1>
      {content.category && <p>{t(`projects.category.${content.category}`)}</p>}
      {content.subtitle && <p>{content.subtitle}</p>}
    </header>
    <ProjectCover image={project.coverImage} language={language} sizes="87vw" fetchPriority="high" />
    {(content.description || content.awardDetails || content.credits?.length > 0 || content.externalLinks?.length > 0) && <div className="project-statement">
      {paragraphs(content.description)}
      {content.awardDetails && <section>
        <h2>{content.awardTitle}</h2>
        {paragraphs(content.awardDetails)}
      </section>}
      {content.credits?.length > 0 && <section><h2>{t("projects.credits")}</h2>{content.credits.map(credit => <p key={credit}>{credit}</p>)}</section>}
      {content.externalLinks?.length > 0 && <div className="project-external-links">
        {content.externalLinks.map(({ labelKey, url }) => <a className="project-link" key={url} href={url}>
          {t(labelKey)} <span aria-hidden="true">↗</span>
        </a>)}
      </div>}
    </div>}
    {project.videos?.map((video, index) => <video
      className="project-video"
      key={video.src}
      src={video.src}
      poster={video.poster}
      controls
      playsInline
      preload="none"
      aria-label={t("projects.video", { number: index + 1 })}
    >
      {video.captions?.map(track => <track key={track.srcLang} kind="captions" {...track} />)}
    </video>)}
    {groups.map(({ titleKey, ids }) => <div className="project-image-group" key={titleKey || "gallery"}>
      {titleKey && <h2>{t(titleKey)}</h2>}
      <div className="project-gallery">{ids.map(id => {
        const index = gallery.findIndex(image => (image.id || image.src) === id);
        const image = gallery[index];
        return <figure key={id} className={image.width > image.height ? "landscape" : "portrait"}>
          <button type="button" aria-haspopup="dialog"
            aria-label={t("projects.openImage", { number: index + 1 })}
            onClick={event => setOpened({ index, trigger: event.currentTarget })}>
            <Photograph image={image} language={language} loading="lazy"
              sizes={image.width > image.height ? "87vw" : "(max-width: 768px) 87vw, 42vw"} />
          </button>
        </figure>;
      })}</div>
    </div>)}
    <nav className="project-navigation" aria-label={t("nav.personalProjects")}>
      {previous && <Link className="project-link" rel="prev" to={`${basePath}/${previous.slug}`}>← {projectContent(previous, language).title}</Link>}
      <Link className="project-link" {...backToProjectList}>{t("projects.back")}</Link>
      {next && <Link className="project-link" rel="next" to={`${basePath}/${next.slug}`}>{projectContent(next, language).title} →</Link>}
    </nav>
    {opened !== null && <ProjectLightbox images={gallery} initialIndex={opened.index} returnFocus={opened.trigger} onClose={() => setOpened(null)} />}
  </main>;
}

export function PersonalProject() {
  const { slug } = useParams();
  const projects = publishedProjects();
  const project = projects.find(item => item.slug === slug);
  const personal = projects.filter(item => !item.section);
  const index = personal.indexOf(project);
  return project
    ? <ProjectDetail key={slug} project={project} previous={personal[index - 1]} next={index >= 0 ? personal[index + 1] : undefined} />
    : <UnavailableProject />;
}
