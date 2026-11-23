import { useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { portfolioTypes as categories } from "../pages/Category/portfolioData";
import { categoryLabels } from "./adminCopy";
import { demoProjects } from "./demoProjects";
import PortfolioPhotoManager from "./PortfolioPhotoManager";
import usePortfolioPhotos from "./usePortfolioPhotos";
import "./prototype.css";

const sampleLabels = {
  "honorable-mention": "Menção honrosa",
  "painting-collaboration": "Colaboração com pintura",
  rosalia: "Rosalía",
  melanina: "Melanina",
};

function ProjectSamples() {
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

function Overview({ photos, status, changes }) {
  const counts = [
    [status === "ready" ? photos.length : "—", "Fotografias", "Portfólio comercial"],
    [categories.length, "Categorias", "Coleções do portfólio"],
    [demoProjects.length, "Exemplos de projetos", "Prévia de um recurso futuro"],
    [demoProjects.filter(project => project.status === "draft").length, "Exemplos em rascunho", "Projetos pessoais"],
  ];
  return <>
    <div className="admin-section-heading">
      <div><p className="prototype-eyebrow">Visão geral do estúdio</p><h1>Seu espaço de trabalho</h1></div>
      <Link className="admin-primary" to="/admin/photos">Abrir biblioteca de fotos ↗</Link>
    </div>
    <p className="admin-introduction">Organize as fotografias do seu portfólio comercial.</p>
    <div className="admin-statistics">
      {counts.map(([value, label, note]) => <article key={label}>
        <strong>{value}</strong><h2>{label}</h2><p>{note}</p>
      </article>)}
    </div>
    <div className="admin-overview-columns">
      <section>
        <div className="admin-section-heading"><h2>Coleções</h2><Link to="/admin/photos">Gerenciar →</Link></div>
        {categories.map(category => <div className="admin-collection" key={category}>
          <span>{categoryLabels[category]}</span>
          <span>{status === "ready" ? photos.filter(photo => photo.category === category).length : "—"}</span>
        </div>)}
      </section>
      <section>
        <h2>Atividade desta sessão</h2>
        <p className="admin-note">A lista mostra as alterações feitas nesta sessão do painel.</p>
        {changes.length
          ? <ol className="admin-history">{changes.map(change => <li key={change.id}><time>{change.time}</time>{change.message}</li>)}</ol>
          : <p>Nenhuma alteração nesta sessão.</p>}
      </section>
    </div>
  </>;
}

export default function AdminPrototype({ session, onLogout, signingOut, sessionMessage, onSessionExpired }) {
  const library = usePortfolioPhotos(onSessionExpired);
  const { photos, status } = library;
  const [changes, setChanges] = useState([]);
  const record = message => {
    const change = { id: crypto.randomUUID(), message, time: new Date().toLocaleTimeString("pt-BR") };
    setChanges(current => [change, ...current].slice(0, 8));
  };

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-brand" to="/admin">
        <img src="/assets/images/ui/logo-black.png" alt="" />
        <span>Marina Rodrigues<small>Painel do estúdio</small></span>
      </Link>
      <p className="prototype-eyebrow">Gerenciar</p>
      <nav aria-label="Administração">
        <NavLink end to="/admin">Visão geral</NavLink>
        <NavLink to="/admin/photos">Fotografias</NavLink>
        <NavLink to="/admin/projects">Projetos pessoais · Prévia</NavLink>
      </nav>
      <div className="admin-sidebar-bottom">
        <Link to="/">Ver site público ↗</Link>
        <span>Ambiente local</span>
      </div>
    </aside>
    <main className="admin-main">
      <div className="admin-session-bar">
        <span>{session.email}</span>
        <button type="button" onClick={onLogout} disabled={signingOut}>{signingOut ? "Saindo…" : "Sair"}</button>
      </div>
      {sessionMessage && <p role="alert">{sessionMessage}</p>}
      <aside className="demo-notice"><strong>Portfólio comercial</strong><p>As alterações nas fotos são salvas no banco de dados. A versão publicada do site ainda usa a galeria fixa.</p></aside>
      <Routes>
        <Route index element={<Overview photos={photos} status={status} changes={changes} />} />
        <Route path="photos" element={<PortfolioPhotoManager library={library} record={record} />} />
        <Route path="projects" element={<ProjectSamples />} />
        <Route path="*" element={<><h1>Página do painel não encontrada</h1><Link to="/admin">Voltar à visão geral</Link></>} />
      </Routes>
    </main>
  </div>;
}
