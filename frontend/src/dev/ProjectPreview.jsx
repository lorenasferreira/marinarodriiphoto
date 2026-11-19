import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import drafts from "../../../docs/content/personal-project-drafts.json";
import { ProjectDetail, ProjectList, UnavailableProject } from "../pages/PersonalProjects/PersonalProjects";

const basePath = "/dev/personal-projects";
const editorialSections = [
  { id: "magazines", entries: ["Vrse", "Selin"] },
  { id: "honorableMention", entries: ["Brazilian Embassy Competition"] },
  { id: "exhibitions", entries: ["Palau Sessions", "Monad", "Brazilian Embassy Competition"] },
];

export default function ProjectPreview() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const notice = <p className="project-preview-notice">{t("projects.preview")}</p>;

  if (slug) {
    const project = drafts.find(item => item.slug === slug);
    return project
      ? <ProjectDetail key={project.id} project={project} basePath={basePath}>{notice}</ProjectDetail>
      : <UnavailableProject basePath={basePath} />;
  }

  return (
    <main id="top" className="projects-page">
      {notice}
      <header className="projects-intro">
        <h1>{t("nav.personalProjects")}</h1>
        <p>{t("projects.intro")}</p>
      </header>
      <ProjectList projects={drafts} basePath={basePath} />
      <div className="project-editorial">
        {editorialSections.map(({ id, entries }) => (
          <section key={id} aria-labelledby={id}>
            <h2 id={id}>{t(`projects.editorial.${id}`)}</h2>
            <ul>{entries.map(entry => <li key={entry}>{entry}</li>)}</ul>
          </section>
        ))}
      </div>
    </main>
  );
}
