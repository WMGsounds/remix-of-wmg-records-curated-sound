import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser's automatic scroll restoration so navigation always starts at top.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Run immediately, then again after paint to cover lazy-loaded routes
    // whose content mounts a tick after the route change.
    scrollTop();
    const raf = requestAnimationFrame(scrollTop);
    const t = setTimeout(scrollTop, 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
};
