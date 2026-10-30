import { useEffect } from "react";

export default function useScrollReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = [...root.querySelectorAll("[data-reveal]")];
    // Elements stay visible until the observer has initialized successfully.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.remove("reveal-pending");
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.01 });
    elements.forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        observer.observe(element);
        element.classList.add("reveal-pending");
      }
    });
    return () => {
      observer.disconnect();
      elements.forEach((element) => element.classList.remove("reveal-pending"));
    };
  }, [ref]);
}
