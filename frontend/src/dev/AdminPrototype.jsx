import { lazy, Suspense, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { portfolioTypes as categories } from "../pages/Category/portfolioData";
import { categoryLabels } from "./adminCopy";
import PortfolioPhotoManager from "./PortfolioPhotoManager";
import usePortfolioPhotos from "./usePortfolioPhotos";
import AdminPasswordForm from "./AdminPasswordForm";
import "./prototype.css";

const ProjectSamples = import.meta.env.DEV
  ? lazy(() => import("./AdminProjectSamples").then(module => ({ default: module.ProjectSamples }))) : null;
const ProjectSampleStatistics = import.meta.env.DEV
  ? lazy(() => import("./AdminProjectSamples").then(module => ({ default: module.ProjectSampleStatistics }))) : null;

function Overview({ photos, status, changes }) {
  const counts = [
    [status === "ready" ? photos.length : "—", "Fotografias", "Portfólio comercial"],
    [categories.length, "Categorias", "Coleções do portfólio"],
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
      {import.meta.env.DEV && <Suspense fallback={null}><ProjectSampleStatistics /></Suspense>}
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

export default function AdminPrototype({ session, onLogout, signingOut, sessionMessage, onSessionExpired, onPasswordChanged }) {
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
        <NavLink to="/admin/password">Alterar senha</NavLink>
        {import.meta.env.DEV && <NavLink to="/admin/projects">Projetos pessoais · Prévia</NavLink>}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link to="/">Ver site público ↗</Link>
        {import.meta.env.DEV && <span>Ambiente local</span>}
      </div>
    </aside>
    <main className="admin-main">
      <div className="admin-session-bar">
        <span>{session.email}</span>
        <button type="button" onClick={onLogout} disabled={signingOut}>{signingOut ? "Saindo…" : "Sair"}</button>
      </div>
      {sessionMessage && <p role="alert">{sessionMessage}</p>}
      {import.meta.env.VITE_PUBLIC_PORTFOLIO_API !== "true" && <aside className="demo-notice"><strong>Portfólio comercial</strong><p>As alterações nas fotos são salvas no banco de dados. A versão publicada do site ainda usa a galeria fixa.</p></aside>}
      <Routes>
        <Route index element={<Overview photos={photos} status={status} changes={changes} />} />
        <Route path="photos" element={<PortfolioPhotoManager library={library} record={record} />} />
        <Route path="password" element={<AdminPasswordForm onChanged={onPasswordChanged} onExpired={onSessionExpired} />} />
        {import.meta.env.DEV && <Route path="projects" element={<Suspense fallback={null}><ProjectSamples /></Suspense>} />}
        <Route path="*" element={<><h1>Página do painel não encontrada</h1><Link to="/admin">Voltar à visão geral</Link></>} />
      </Routes>
    </main>
  </div>;
}
