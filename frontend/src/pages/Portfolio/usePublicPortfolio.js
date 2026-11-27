import { useEffect, useState } from "react";
import { bundledPhotos, fetchPublicPortfolio } from "./portfolioSource.js";

const useApi = import.meta.env.VITE_PUBLIC_PORTFOLIO_API === "true";

export default function usePublicPortfolio(onPhotos) {
  const [result, setResult] = useState(() => useApi
    ? { photos: [], status: "loading" }
    : { photos: bundledPhotos, status: "ready" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!useApi) return;
    let request;
    async function load() {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        const photos = await fetchPublicPortfolio(controller.signal);
        if (controller.signal.aborted) return;
        onPhotos(photos);
        setResult({ photos, status: "ready" });
      } catch {
        if (controller.signal.aborted) return;
        onPhotos([]);
        setResult({ photos: [], status: "error" });
      }
    }
    load();
    window.addEventListener("focus", load);
    return () => {
      request?.abort();
      window.removeEventListener("focus", load);
    };
  }, [attempt, onPhotos]);

  return { ...result, retry: () => {
    setResult({ photos: [], status: "loading" });
    setAttempt(value => value + 1);
  } };
}
