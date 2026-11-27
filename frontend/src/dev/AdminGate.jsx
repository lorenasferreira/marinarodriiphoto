import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminPrototype from "./AdminPrototype";
import AdminPasswordForm from "./AdminPasswordForm";
import { currentSession, signIn, signOut } from "./adminSession";

const sessionUnavailable = "Não foi possível verificar sua sessão. Confira se o servidor está funcionando e tente novamente.";
const clearValidation = event => event.currentTarget.setCustomValidity("");

export default function AdminGate() {
  const [session, setSession] = useState(null);
  const [check, setCheck] = useState(0);
  const [status, setStatus] = useState("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const signedInEmail = session?.email;
  const passwordChanged = () => {
    setSession(null);
    setMessage("Senha alterada. Entre novamente com a nova senha.");
  };
  const endSession = useCallback(() => {
    setSession(null);
    setMessage("Sua sessão terminou. Entre novamente para continuar.");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    currentSession(controller.signal).then(active => {
      if (controller.signal.aborted) return;
      setSession(active);
      setStatus("ready");
    }).catch(() => {
      if (!controller.signal.aborted) setStatus("unavailable");
    });

    return () => controller.abort();
  }, [check]);

  useEffect(() => {
    if (!signedInEmail) return;
    const controller = new AbortController();
    let checking = false;
    async function verifySession() {
      if (checking) return;
      checking = true;
      try {
        const active = await currentSession(controller.signal);
        if (controller.signal.aborted) return;
        if (!active || active.email !== signedInEmail) {
          endSession();
        }
      } catch {
        if (!controller.signal.aborted) setMessage(sessionUnavailable);
      } finally {
        checking = false;
      }
    }
    window.addEventListener("focus", verifySession);
    return () => {
      window.removeEventListener("focus", verifySession);
      controller.abort();
    };
  }, [signedInEmail, endSession]);

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const credentials = new FormData(form);
    form.elements.password.value = "";
    setBusy(true);
    setMessage("");
    try {
      setSession(await signIn(credentials.get("email"), credentials.get("password")));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setMessage("");
    try {
      await signOut();
      setSession(null);
    } catch {
      setMessage("Não foi possível sair. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (session?.passwordChangeRequired) {
    return <main className="admin-shell admin-login">
      <section className="admin-login-panel">
        <AdminPasswordForm required onChanged={passwordChanged} onExpired={endSession} />
        {message && <p role="alert">{message}</p>}
        <button type="button" onClick={handleLogout} disabled={busy}>Sair</button>
      </section>
    </main>;
  }

  if (session) {
    return <AdminPrototype key={session.email} session={session} onLogout={handleLogout} signingOut={busy}
      sessionMessage={message} onSessionExpired={endSession} onPasswordChanged={passwordChanged} />;
  }

  return (
    <main className="admin-shell admin-login">
      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <h1 id="admin-login-title">Entrar no painel</h1>
        {status === "checking" && <p role="status">Verificando sua sessão…</p>}
        {status === "unavailable" && <>
          <p role="alert">{sessionUnavailable}</p>
          <button type="button" onClick={() => {
            setStatus("checking");
            setCheck(previous => previous + 1);
          }}>Tentar novamente</button>
        </>}
        {status === "ready" && <form onSubmit={handleLogin}>
          <label>E-mail<input name="email" type="email" autoComplete="username" required onInput={clearValidation}
            onInvalid={event => event.currentTarget.setCustomValidity(event.currentTarget.validity.valueMissing
              ? "Informe seu e-mail." : "Informe um e-mail válido.")} /></label>
          <label>Senha<input name="password" type="password" autoComplete="current-password" required onInput={clearValidation}
            onInvalid={event => event.currentTarget.setCustomValidity("Informe sua senha.")} /></label>
          {message && <p role="alert">{message}</p>}
          <button className="admin-primary" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>}
        <Link to="/">Voltar ao site</Link>
      </section>
    </main>
  );
}
