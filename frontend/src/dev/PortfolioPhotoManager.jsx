import { useEffect, useRef, useState } from "react";
import { portfolioTypes } from "../pages/Category/portfolioData";
import { categoryLabels } from "./adminCopy";
import PortfolioPhotoTextFields from "./PortfolioPhotoTextFields";
import PortfolioPhotoUploadForm from "./PortfolioPhotoUploadForm";
import { metadataForSave, movePhotoIds, reorderPortfolioPhotos, updatePortfolioPhoto, uploadPortfolioPhoto } from "./portfolioPhotoApi";

function PhotoEditor({ photo, photos, disabled, onSave, onMove }) {
  const [draft, setDraft] = useState({
    category: photo.category, title: photo.title ?? "", altText: photo.altText ?? "", published: photo.published,
  });
  const [preview, setPreview] = useState(false);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!preview) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, [preview]);

  const earlier = movePhotoIds(photos, photo, -1);
  const later = movePhotoIds(photos, photo, 1);
  const edited = draft.category !== photo.category || draft.title !== (photo.title ?? "")
    || draft.altText !== (photo.altText ?? "") || draft.published !== photo.published;
  const setField = (field, value) => setDraft(current => ({ ...current, [field]: value }));

  return <>
    <img src={photo.thumbnailUrl} alt={photo.altText || photo.originalFilename} />
    <h2>{photo.title || photo.originalFilename}</h2>
    <dl>
      <dt>ID da foto</dt><dd>{photo.id}</dd>
      <dt>Nome original do arquivo</dt><dd>{photo.originalFilename}</dd>
      <dt>Dimensões</dt><dd>{photo.width} × {photo.height} px</dd>
      <dt>Posição salva</dt><dd>{photo.displayOrder + 1}</dd>
      <dt>Visibilidade salva</dt><dd>{photo.published ? "Publicada" : "Oculta"}</dd>
    </dl>
    <form className="admin-photo-editor" onSubmit={event => { event.preventDefault(); onSave(draft); }}>
      <label>Categoria<select disabled={disabled} value={draft.category} onChange={event => setField("category", event.target.value)}>
        {portfolioTypes.map(category => <option key={category} value={category}>{categoryLabels[category]}</option>)}
      </select></label>
      <PortfolioPhotoTextFields disabled={disabled} title={draft.title} altText={draft.altText}
        onChange={event => setField(event.target.name, event.target.value)} />
      <label>Visibilidade<select disabled={disabled} value={draft.published ? "published" : "hidden"} onChange={event => setField("published", event.target.value === "published")}>
        <option value="published">Publicada</option><option value="hidden">Oculta</option>
      </select></label>
      <button className="admin-primary" type="submit" disabled={disabled || !edited}>Salvar detalhes da foto</button>
    </form>
    <div className="admin-actions">
      <button type="button" onClick={() => setPreview(true)}>Visualizar foto</button>
      <button type="button" disabled={disabled || edited || !earlier} onClick={() => onMove(earlier)}>Mover para cima</button>
      <button type="button" disabled={disabled || edited || !later} onClick={() => onMove(later)}>Mover para baixo</button>
    </div>
    {edited && <p className="admin-note">Salve os detalhes da foto antes de mudar a ordem.</p>}
    {preview && <dialog ref={dialogRef} className="admin-image-dialog" aria-label="Visualização da foto"
      onCancel={event => { event.preventDefault(); setPreview(false); }}>
      <button type="button" autoFocus onClick={() => setPreview(false)}>Fechar visualização</button>
      <img src={photo.imageUrl}
        srcSet={photo.responsiveUrls?.length ? photo.responsiveUrls.map(source => `${source.url} ${source.width}w`).join(", ") : undefined}
        sizes="90vw" alt={photo.altText || photo.originalFilename} />
      {photo.cloudinaryPublicId && <a href={photo.originalUrl} target="_blank" rel="noreferrer">Abrir arquivo original</a>}
    </dialog>}
  </>;
}

export default function PortfolioPhotoManager({ library, record }) {
  const { photos, revision, status, saving, feedback, reload, save } = library;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photo = photos.find(item => item.id === selected);
  const shown = photos.filter(item => (category === "all" || item.category === category)
    && `${item.title ?? ""} ${item.originalFilename} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase()));

  async function saveDetails(draft) {
    const metadata = metadataForSave(photos, photo, draft);
    if (await save(signal => updatePortfolioPhoto(photo.id, metadata, signal), "Detalhes da foto salvos.")) {
      if (category !== "all" && category !== draft.category) setCategory(draft.category);
      record(`Detalhes salvos: ${photo.originalFilename}`);
    }
  }

  async function saveOrder(ids) {
    if (await save(signal => reorderPortfolioPhotos(photo.category, ids, signal), "Ordem das fotos salva.")) {
      record(`Ordem salva: ${categoryLabels[photo.category]}`);
    }
  }

  async function upload(file, details) {
    setUploading(true);
    try {
      if (await save(signal => uploadPortfolioPhoto(file, details, signal), "Foto enviada e salva como oculta.")) {
        setUploadOpen(false);
        if (category !== "all") setCategory(details.category);
        setQuery("");
        record(`Foto enviada como oculta: ${file.name}`);
      }
    } finally {
      setUploading(false);
    }
  }

  return <>
    <div className="admin-section-heading">
      <div><p className="prototype-eyebrow">Biblioteca de imagens</p><h1>Fotografias</h1></div>
      <div className="admin-actions">
        <button type="button" disabled={status === "loading" || saving} onClick={reload}>Atualizar fotos</button>
        <button type="button" className="admin-primary" disabled={status !== "ready" || saving}
          aria-expanded={uploadOpen} onClick={() => setUploadOpen(open => !open)}>Enviar foto</button>
      </div>
    </div>
    <p className="admin-note">Os detalhes e a ordem das fotos são salvos no banco de dados. A substituição e a exclusão de arquivos ainda não estão disponíveis.</p>
    {uploadOpen && <PortfolioPhotoUploadForm initialCategory={category === "all" ? portfolioTypes[0] : category}
      disabled={saving || status !== "ready"} onUpload={upload} onCancel={() => setUploadOpen(false)} />}
    <div className="admin-toolbar">
      <label>Buscar fotos<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label>Filtrar por categoria<select value={category} onChange={event => setCategory(event.target.value)}>
        <option value="all">Todas as categorias</option>
        {portfolioTypes.map(item => <option key={item} value={item}>{categoryLabels[item]}</option>)}
      </select></label>
      {status === "ready" && <span>{shown.length} {shown.length === 1 ? "foto" : "fotos"}</span>}
    </div>
    <div className="admin-feedback">
      {saving && <p role="status">{uploading ? "Enviando e salvando a foto…" : "Salvando e atualizando a lista de fotos…"}</p>}
      {status === "loading" && <p role="status">Carregando fotos…</p>}
      {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}
    </div>
    {photos.length > 0 && <div className="admin-library">
      <div className="admin-photo-grid">
        {shown.map(item => <button type="button" key={item.id} disabled={saving} aria-pressed={selected === item.id}
          className={`admin-photo ${selected === item.id ? "is-selected" : ""} ${item.published ? "" : "is-hidden-photo"}`}
          onClick={() => setSelected(item.id)}>
          <img src={item.thumbnailUrl} alt={item.altText || ""} loading="lazy" width={item.width} height={item.height} />
          <span>{item.title || item.originalFilename}</span>{!item.published && <small>Oculta</small>}
        </button>)}
        {!shown.length && <p>Nenhuma foto corresponde à busca.</p>}
      </div>
      <aside className="admin-metadata" aria-label="Detalhes da foto">
        {photo
          ? <PhotoEditor key={`${photo.id}:${revision}`} photo={photo} photos={photos} disabled={saving || status !== "ready"} onSave={saveDetails} onMove={saveOrder} />
          : <p>Selecione uma foto para ver ou editar os detalhes.</p>}
      </aside>
    </div>}
    {status === "ready" && !photos.length && <p>Ainda não há fotos na biblioteca.</p>}
  </>;
}
