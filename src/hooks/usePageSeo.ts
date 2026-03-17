import { useEffect } from "react";

const BASE_URL = "https://www.info-peche.fr";

interface SeoOptions {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Sets document title, meta description, canonical, OG tags, and optional JSON-LD per page.
 */
export function usePageSeo({ title, description, canonical, ogType = "website", ogImage, jsonLd }: SeoOptions) {
  useEffect(() => {
    // Title
    document.title = title;

    // Helper to set/create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    if (ogImage) setMeta("property", "og:image", ogImage);

    // Canonical
    const path = canonical || window.location.pathname;
    const href = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);

    // JSON-LD
    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    const scriptEls: HTMLScriptElement[] = [];
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-page-seo", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      scriptEls.push(script);
    });

    return () => {
      document.title = "Info Pêche — Le magazine de référence de la pêche au coup";
      scriptEls.forEach((s) => s.remove());
    };
  }, [title, description, canonical, ogType, ogImage, jsonLd]);
}
