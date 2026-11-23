import { useEffect, useState } from "react";
import { portfolioTypes } from "../pages/Category/portfolioData";
import { categoryLabels } from "./adminCopy";
import PortfolioPhotoTextFields from "./PortfolioPhotoTextFields";

export default function PortfolioPhotoUploadForm({ initialCategory, disabled, onUpload, onCancel }) {
  const [selection, setSelection] = useState(null);
  const preview = selection?.preview;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function changeFile(event) {
    const file = event.target.files[0];
    setSelection(file ? {
      file,
      preview: ["image/jpeg", "image/png", "image/webp"].includes(file.type) ? URL.createObjectURL(file) : null,
    } : null);
  }

  function submit(event) {
    event.preventDefault();
    if (!selection || disabled) return;
    const details = new FormData(event.currentTarget);
    onUpload(selection.file, {
      category: details.get("category"),
      title: details.get("title"),
      altText: details.get("altText"),
    });
  }

  return <form className="admin-photo-editor admin-upload-form" onSubmit={submit} aria-label="Envio de foto para o portfólio">
    <label className="admin-file-picker">
      <input name="file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        required disabled={disabled} onChange={changeFile} />
      <span>Selecionar arquivo de imagem</span>
      <small>{selection?.file.name ?? "Nenhum arquivo selecionado"}</small>
    </label>
    {preview && <img src={preview} alt="Prévia da foto selecionada" />}
    <label>Categoria<select name="category" defaultValue={initialCategory} disabled={disabled}>
      {portfolioTypes.map(category => <option key={category} value={category}>{categoryLabels[category]}</option>)}
    </select></label>
    <PortfolioPhotoTextFields disabled={disabled} />
    <p className="admin-note">Use JPEG, PNG ou WebP. A foto será salva como oculta.</p>
    <div className="admin-actions">
      <button type="submit" className="admin-primary" disabled={disabled || !selection}>Enviar foto como oculta</button>
      <button type="button" disabled={disabled} onClick={onCancel}>Cancelar</button>
    </div>
  </form>;
}
