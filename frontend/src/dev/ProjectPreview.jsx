import { useEffect, useLayoutEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { projectContent, projectSections } from "../data/personalProjects";
import drafts from "../../../docs/content/personal-project-drafts.json";
import {
  ProjectDetail,
  ProjectsLanding,
  UnavailableProject,
} from "../pages/PersonalProjects/PersonalProjects";

const sections = projectSections(drafts);
const projects = sections.find(section => section.id === "personal").entries;

export default function ProjectPreview({ basePath = "/personal-projects" }) {
  const { slug } = useParams();
  const { hash } = useLocation();
  const { t, i18n } = useTranslation();
  const project = drafts.find(item => item.slug === slug);
  const content = project && projectContent(project, i18n.resolvedLanguage);
  const title = content?.title ?? t(slug ? "projects.unavailable" : "nav.personalProjects");
  const summary = content?.description?.split("\n\n")[0] ?? (slug ? undefined : t("projects.intro"));

  useLayoutEffect(() => {
    // The lazy catalogue can mount after the global scroll handler runs.
    if (!slug && hash && window.scrollY === 0) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "instant" });
    }
  }, [slug, hash]);

  useEffect(() => {
    const titleElement = document.querySelector("title");
    if (titleElement) titleElement.textContent = `${title} — Marina Rodrigues`;
    const description = document.querySelector('meta[name="description"]');
    const defaultDescription = description?.content;
    if (description && summary) description.content = summary;
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => {
      robots.remove();
      if (description) description.content = defaultDescription;
    };
  }, [title, summary]);

  if (!slug) return <ProjectsLanding sections={sections} basePath={basePath} />;
  if (!project) return <UnavailableProject basePath={basePath} />;

  const index = projects.indexOf(project);
  return <ProjectDetail key={project.id} project={project} basePath={basePath}
    previous={index > 0 ? projects[index - 1] : undefined}
    next={index >= 0 ? projects[index + 1] : undefined}
  />;
}
