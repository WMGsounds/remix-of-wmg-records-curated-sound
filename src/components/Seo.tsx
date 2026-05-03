import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  truncate,
} from "@/lib/seo";

type SeoProps = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  image?: string;
  type?: "website" | "article" | "music.album";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  publishedTime?: string;
  modifiedTime?: string;
};

const ensureMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => k !== "content" && el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  if (attrs.content !== undefined) el.setAttribute("content", attrs.content);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const setJsonLd = (id: string, data: unknown) => {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const removeJsonLd = (id: string) => {
  const el = document.head.querySelector(`script[data-seo="${id}"]`);
  if (el) el.remove();
};

export const Seo = ({
  title,
  description,
  canonicalPath,
  canonicalUrl,
  image,
  type = "website",
  noindex,
  jsonLd,
  publishedTime,
  modifiedTime,
}: SeoProps) => {
  const location = useLocation();
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const pageDesc = truncate(description || DEFAULT_DESCRIPTION);
  const pagePath = canonicalPath ?? location.pathname;
  const canonical = canonicalUrl || absoluteUrl(pagePath);
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

  useEffect(() => {
    document.title = pageTitle;

    ensureMeta('meta[name="description"]', { name: "description", content: pageDesc });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    });

    setLink("canonical", canonical);

    ensureMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: pageDesc });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });
    ensureMeta('meta[property="og:locale"]', { property: "og:locale", content: "en_GB" });

    ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: pageTitle });
    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: pageDesc });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

    if (publishedTime) {
      ensureMeta('meta[property="article:published_time"]', {
        property: "article:published_time",
        content: publishedTime,
      });
    }
    if (modifiedTime) {
      ensureMeta('meta[property="article:modified_time"]', {
        property: "article:modified_time",
        content: modifiedTime,
      });
    }

    if (jsonLd) {
      const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      arr.forEach((d, i) => setJsonLd(`page-${i}`, d));
      // Clean any leftover stale entries.
      const existing = document.head.querySelectorAll('script[data-seo^="page-"]');
      existing.forEach((node, idx) => {
        if (idx >= arr.length) node.remove();
      });
    } else {
      document.head.querySelectorAll('script[data-seo^="page-"]').forEach((n) => n.remove());
    }

    return () => {
      // Leave defaults in place; per-page JSON-LD cleared by next mount.
    };
  }, [pageTitle, pageDesc, canonical, ogImage, type, noindex, jsonLd, publishedTime, modifiedTime]);

  return null;
};

// Backwards-compat alias for old PageTitle imports.
export const PageTitle = Seo;
