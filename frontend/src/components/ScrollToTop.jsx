import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map());

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    // Native hash links can copy the current history entry's router key.
    const entry = `${location.key}:${location.pathname}${location.search}${location.hash}`;
    const saved = positions.current.get(entry);
    let target;
    if (location.hash) {
      let id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* Keep malformed hashes literal. */ }
      target = document.getElementById(id) || document.getElementsByName(id)[0];
    }

    // Run before paint and before reveal observers measure the destination page.
    // Instant scrolling also overrides any CSS smooth-scroll behavior.
    if (navigationType === "POP" && saved) {
      window.scrollTo({ left: saved.x, top: saved.y, behavior: "instant" });
    } else if (target) {
      // Layout offsets exclude the temporary translate used by scroll reveals.
      // Measuring the animated rectangle would leave the anchor misaligned.
      let top = 0;
      for (let element = target; element; element = element.offsetParent) {
        top += element.offsetTop;
      }
      top -= parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
      window.scrollTo({ left: 0, top, behavior: "instant" });
    } else {
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    }

    const remember = () => {
      positions.current.set(entry, { x: window.scrollX, y: window.scrollY });
    };
    remember();
    window.addEventListener("scroll", remember, { passive: true });
    return () => window.removeEventListener("scroll", remember);
  }, [location, navigationType]);

  return null;
}
