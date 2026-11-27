import { demoProjects } from "./demoProjects";

const sampleLabels = {
  "honorable-mention": "Menção honrosa",
  "painting-collaboration": "Colaboração com pintura",
  rosalia: "Rosalía",
  melanina: "Melanina",
};

export function ProjectSamples() {
  return <>
    <div className="admin-section-heading">
      <div><p className="prototype-eyebrow">Recurso futuro</p><h1>Projetos pessoais</h1></div>
    </div>
    <p className="admin-note">Prévia com exemplos fictícios, disponível apenas para visualização.</p>
    <ul className="admin-project-list">
      {demoProjects.map(project => <li className="admin-project-row" key={project.id}>
        <span aria-hidden="true" className="admin-project-sample">Prévia</span>
        <strong>{sampleLabels[project.slug]}</strong>
        <span className="admin-badge">Exemplo</span>
      </li>)}
    </ul>
  </>;
}

export function ProjectSampleStatistics() {
  return <>
    <article><strong>{demoProjects.length}</strong><h2>Exemplos de projetos</h2><p>Prévia de um recurso futuro</p></article>
    <article><strong>{demoProjects.filter(project => project.status === "draft").length}</strong><h2>Exemplos em rascunho</h2><p>Projetos pessoais</p></article>
  </>;
}
