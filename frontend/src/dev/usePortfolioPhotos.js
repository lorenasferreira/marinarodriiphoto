import { useCallback, useEffect, useRef, useState } from "react";
import { photoErrorMessage } from "./adminCopy.js";
import { loadPortfolioPhotos } from "./portfolioPhotoApi.js";

export default function usePortfolioPhotos(onSessionExpired) {
  const [photos, setPhotos] = useState([]);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const pending = useRef(null);

  const refresh = useCallback(async (signal, failureMessage) => {
    try {
      const rows = await loadPortfolioPhotos(signal);
      if (signal.aborted) return false;
      setPhotos(rows);
      setRevision(value => value + 1);
      setStatus("ready");
      return true;
    } catch (error) {
      if (signal.aborted) return false;
      if (error.status === 401) onSessionExpired();
      else {
        setStatus("error");
        setFeedback({ error: true, text: failureMessage });
      }
      return false;
    }
  }, [onSessionExpired]);

  const reload = useCallback(async () => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setStatus("loading");
    setFeedback(null);
    try {
      await refresh(controller.signal, "Não foi possível carregar as fotos. Confira se o servidor está funcionando e tente novamente.");
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }, [refresh]);

  useEffect(() => {
    // Run after mount so the initial state can render before starting a request.
    const timer = window.setTimeout(reload, 0);
    return () => {
      window.clearTimeout(timer);
      pending.current?.abort();
      pending.current = null;
    };
  }, [reload]);

  async function save(write, successMessage) {
    if (pending.current || status !== "ready") return false;
    const controller = new AbortController();
    const { signal } = controller;
    pending.current = controller;
    setSaving(true);
    setFeedback(null);
    try {
      await write(signal);
      if (signal.aborted) return false;
      const refreshed = await refresh(signal, "A alteração foi salva. Não foi possível atualizar a lista. Atualize as fotos antes de editar novamente.");
      if (refreshed) setFeedback({ text: successMessage });
      return true;
    } catch (error) {
      if (signal.aborted) return false;
      if (error.status === 401) {
        onSessionExpired();
      } else if (error.status === 409) {
        const refreshed = await refresh(signal, "A ordem não foi salva e não foi possível carregar a versão atual. Atualize a lista de fotos.");
        if (refreshed) setFeedback({ error: true, text: "A lista de fotos mudou. Confira a ordem atualizada e tente novamente." });
      } else if ([400, 403, 404, 413, 415, 429].includes(error.status)) {
        setFeedback({ error: true, text: photoErrorMessage(error) });
      } else {
        setStatus("error");
        setFeedback({ error: true, text: photoErrorMessage(error) });
      }
      return false;
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!signal.aborted) setSaving(false);
    }
  }

  return { photos, revision, status, saving, feedback, reload, save };
}
