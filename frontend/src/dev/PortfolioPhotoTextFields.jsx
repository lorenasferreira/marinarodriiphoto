import { useId } from "react";

export default function PortfolioPhotoTextFields({ disabled, title, altText, onChange }) {
  const titleHelp = useId();
  const altHelp = useId();

  return <>
    <div className="admin-photo-field">
      <label>Título da foto<input name="title" maxLength={160} disabled={disabled} value={title}
        aria-describedby={titleHelp} onChange={onChange} /></label>
      <small id={titleHelp}>Dê um título curto que ajude a encontrar a foto, como “Retrato à luz da janela”. Evite nomes de arquivos da câmera ou de capturas de tela.</small>
    </div>
    <div className="admin-photo-field">
      <label>Texto alternativo<input name="altText" maxLength={255} disabled={disabled} value={altText}
        aria-describedby={altHelp} onChange={onChange} /></label>
      <small id={altHelp}>Descreva a cena para quem não pode ver a foto. Por exemplo, “Bailarina sentada ao lado de uma janela, com luz suave no rosto.”</small>
    </div>
  </>;
}
