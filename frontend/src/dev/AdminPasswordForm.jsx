import { useState } from "react";
import { changePassword } from "./adminSession";

export default function AdminPasswordForm({ required, onChanged, onExpired }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const newPassword = fields.get("newPassword");
    if (newPassword !== fields.get("confirmPassword")) {
      setMessage("As novas senhas não coincidem.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setMessage("A nova senha deve ter no máximo 72 bytes.");
      return;
    }
    form.reset();
    setBusy(true);
    setMessage("");
    try {
      await changePassword(fields.get("currentPassword"), newPassword);
      onChanged();
    } catch (error) {
      if (error.status === 401 || error.status === 409) onExpired();
      else if (error.status === 400) setMessage("Confira a senha atual e escolha uma nova senha diferente.");
      else if (error.status === 429) setMessage("Muitas tentativas. Aguarde um minuto e tente novamente.");
      else setMessage("Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <h1>{required ? "Crie sua nova senha" : "Alterar senha"}</h1>
    {required && <p>Para acessar o painel, substitua sua senha temporária.</p>}
    <form className="admin-password-form" onSubmit={submit}>
      <label>{required ? "Senha temporária" : "Senha atual"}<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
      <label>Nova senha<input name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
      <label>Confirme a nova senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
      <p>Use pelo menos 12 caracteres e no máximo 72 bytes.</p>
      {message && <p role="alert">{message}</p>}
      <button className="admin-primary" disabled={busy}>{busy ? "Salvando…" : "Salvar nova senha"}</button>
    </form>
  </>;
}
