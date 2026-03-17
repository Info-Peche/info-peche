import { useEffect } from "react";

const BASE_URL = "https://www.info-peche.fr";

/**
 * Sets the canonical link tag for the current page.
 * Pass a path like "/blog" or a full URL.
 * If no path is provided, uses the current window.location.pathname.
 */
export function useCanonical(path?: string) {
  useEffect(() => {
    const href = path
      ? path.startsWith("http")
        ? path
        : `${BASE_URL}${path}`
      : `${BASE_URL}${window.location.pathname}`;

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);

    return () => {
      // Reset to base on unmount so next page can set its own
    };
  }, [path]);
}
