import { useEffect, useState } from "react";

/**
 * Measures the height of the fixed site header so sections can sit
 * naturally beneath it without hard-coded offsets.
 */
export function useHeaderHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = document.querySelector("header");
    if (!el) return;

    const update = () => setHeight(el.getBoundingClientRect().height);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
