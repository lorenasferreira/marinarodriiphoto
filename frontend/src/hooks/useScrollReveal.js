import { useEffect } from "react";
import "../styles/motion.css";

export default function useScrollReveal(ref, resetKey) {
  useEffect(() => {
    const root = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !window.IntersectionObserver || motion.matches) return;
    const elements = [...root.querySelectorAll("[data-reveal]")];
    let observer;
    const reveal = (element) => {
      element.classList.remove("reveal-pending");
      observer?.unobserve(element);
    };
    const showAll = () => elements.forEach(reveal);

    // Register successfully before hiding anything. Failures leave content visible.
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) reveal(target);
        });
      }, { threshold: 0.01 });
      elements.forEach((element) => {
        if (element.getBoundingClientRect().top > window.innerHeight) {
          observer.observe(element);
          element.classList.add("reveal-pending");
        }
      });
    } catch {
      observer?.disconnect();
      showAll();
      return;
    }

    const onFocus = (event) => {
      let element = event.target.closest("[data-reveal]");
      while (element && root.contains(element)) {
        reveal(element);
        element = element.parentElement?.closest("[data-reveal]");
      }
    };
    const onMotionChange = () => {
      if (motion.matches) {
        showAll();
        observer.disconnect();
      }
    };
    root.addEventListener("focusin", onFocus);
    motion.addEventListener("change", onMotionChange);
    return () => {
      root.removeEventListener("focusin", onFocus);
      motion.removeEventListener("change", onMotionChange);
      observer.disconnect();
      showAll();
    };
  }, [ref, resetKey]);
}
