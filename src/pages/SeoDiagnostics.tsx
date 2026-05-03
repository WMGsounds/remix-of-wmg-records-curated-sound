import { useEffect, useMemo, useRef, useState } from "react";
import { Seo } from "@/components/Seo";
import { SITE_URL } from "@/lib/seo";
import { useArtists, useReleases, useJournal } from "@/lib/queries";

type RouteCheck = {
  path: string;
  group: string;
  status: "pending" | "ok" | "error";
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogTitle?: string;
  twitterCard?: string;
  twitterImage?: string;
  h1Count?: number;
  jsonLdCount?: number;
  issues: string[];
};

const STATIC_ROUTES: { path: string; group: string }[] = [
  { path: "/", group: "Static" },
  { path: "/artists", group: "Static" },
  { path: "/releases", group: "Static" },
  { path: "/journal", group: "Static" },
  { path: "/about", group: "Static" },
  { path: "/contact", group: "Static" },
  { path: "/newsletter", group: "Static" },
  { path: "/legal/privacy", group: "Static" },
  { path: "/legal/terms", group: "Static" },
  { path: "/legal/cookies", group: "Static" },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const auditDoc = (doc: Document, path: string, group: string): RouteCheck => {
  const get = (sel: string, attr = "content") =>
    doc.querySelector(sel)?.getAttribute(attr) || "";
  const title = doc.querySelector("title")?.textContent || "";
  const description = get('meta[name="description"]');
  const canonical = get('link[rel="canonical"]', "href");
  const ogImage = get('meta[property="og:image"]');
  const ogTitle = get('meta[property="og:title"]');
  const twitterCard = get('meta[name="twitter:card"]');
  const twitterImage = get('meta[name="twitter:image"]');
  const h1Count = doc.querySelectorAll("h1").length;
  const jsonLdCount = doc.querySelectorAll('script[type="application/ld+json"]').length;

  const issues: string[] = [];
  if (!title) issues.push("missing <title>");
  if (!description) issues.push("missing meta description");
  if (!canonical) issues.push("missing canonical");
  if (!ogImage) issues.push("missing og:image");
  if (!ogTitle) issues.push("missing og:title");
  if (!twitterCard) issues.push("missing twitter:card");
  if (!twitterImage) issues.push("missing twitter:image");
  if (h1Count === 0) issues.push("missing H1");
  if (h1Count > 1) issues.push(`multiple H1 (${h1Count})`);
  if (jsonLdCount === 0) issues.push("no JSON-LD");

  return {
    path,
    group,
    status: issues.length ? "error" : "ok",
    title,
    description,
    canonical,
    ogImage,
    ogTitle,
    twitterCard,
    twitterImage,
    h1Count,
    jsonLdCount,
    issues,
  };
};

const auditRouteInIframe = (
  path: string,
  group: string,
  container: HTMLDivElement,
): Promise<RouteCheck> =>
  new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:absolute;left:-99999px;top:0;width:1280px;height:900px;border:0;visibility:hidden;";
    iframe.setAttribute("aria-hidden", "true");
    iframe.src = path + (path.includes("?") ? "&" : "?") + "_seoaudit=1";

    let settled = false;
    const finish = (result: RouteCheck) => {
      if (settled) return;
      settled = true;
      try {
        container.removeChild(iframe);
      } catch {
        /* noop */
      }
      resolve(result);
    };

    const timeout = window.setTimeout(() => {
      finish({
        path,
        group,
        status: "error",
        issues: ["timeout waiting for route to render"],
      });
    }, 15000);

    iframe.addEventListener("load", () => {
      // Allow Seo useEffect + data queries to populate <head>.
      window.setTimeout(() => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) {
            window.clearTimeout(timeout);
            finish({ path, group, status: "error", issues: ["no document"] });
            return;
          }
          const result = auditDoc(doc, path, group);
          window.clearTimeout(timeout);
          finish(result);
        } catch (e) {
          window.clearTimeout(timeout);
          finish({
            path,
            group,
            status: "error",
            issues: [`inspect failed: ${(e as Error).message}`],
          });
        }
      }, 2500);
    });

    container.appendChild(iframe);
  });

const SeoDiagnostics = () => {
  const { data: artists = [], isLoading: artistsLoading } = useArtists();
  const { data: releases = [], isLoading: releasesLoading } = useReleases();
  const { data: articles = [], isLoading: journalLoading } = useJournal();

  const dataReady = !artistsLoading && !releasesLoading && !journalLoading;

  const allRoutes = useMemo(() => {
    const dynamic: { path: string; group: string }[] = [];
    artists.forEach((a) => dynamic.push({ path: `/artists/${a.slug}`, group: "Artist" }));
    releases.forEach((r) => dynamic.push({ path: `/releases/${r.slug}`, group: "Release" }));
    articles.forEach((a) => dynamic.push({ path: `/journal/${a.slug}`, group: "Journal" }));
    const cats = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));
    cats.forEach((c) =>
      dynamic.push({ path: `/journal/category/${slugify(c)}`, group: "Journal Category" }),
    );
    return [...STATIC_ROUTES, ...dynamic];
  }, [artists, releases, articles]);

  const [checks, setChecks] = useState<RouteCheck[]>([]);
  const [running, setRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dataReady || !containerRef.current) return;
    if (running) return;
    let cancelled = false;
    setRunning(true);
    setChecks(allRoutes.map((r) => ({ ...r, status: "pending", issues: [] })));

    (async () => {
      const results: RouteCheck[] = [];
      for (let i = 0; i < allRoutes.length; i++) {
        if (cancelled) return;
        const r = allRoutes[i];
        const result = await auditRouteInIframe(r.path, r.group, containerRef.current!);
        results.push(result);
        if (!cancelled) {
          setChecks([
            ...results,
            ...allRoutes.slice(results.length).map((rr) => ({
              ...rr,
              status: "pending" as const,
              issues: [],
            })),
          ]);
        }
      }
      if (!cancelled) setRunning(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady, allRoutes.length]);

  const failing = checks.filter((c) => c.status === "error");
  const passing = checks.filter((c) => c.status === "ok");
  const pending = checks.filter((c) => c.status === "pending");

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <Seo
        title="SEO Diagnostics"
        description="Internal SEO diagnostics for WMG Records public routes."
        noindex
        canonicalPath="/seo-diagnostics"
      />
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-4xl mb-2">SEO Diagnostics</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Renders each public route in a hidden iframe, waits for hydration, then audits the
          live <code>&lt;head&gt;</code> and DOM for title, description, canonical, OG/Twitter
          tags, JSON-LD and H1 count. Includes all dynamic artist, release, journal article and
          journal category routes from the CMS. Sitemap:{" "}
          <a className="underline" href={`${SITE_URL}/sitemap.xml`}>{`${SITE_URL}/sitemap.xml`}</a>
        </p>

        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <span>Total: <strong>{checks.length}</strong></span>
          <span className="text-green-600">OK: <strong>{passing.length}</strong></span>
          <span className="text-destructive">Failing: <strong>{failing.length}</strong></span>
          <span className="text-muted-foreground">Pending: <strong>{pending.length}</strong></span>
          {!dataReady && <span className="text-muted-foreground">Loading CMS data…</span>}
        </div>

        {failing.length > 0 && (
          <div className="mb-10">
            <h2 className="font-serif text-2xl mb-3">Issues found</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4">Group</th>
                  <th className="py-2 pr-4">Route</th>
                  <th className="py-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {failing.map((c) => (
                  <tr key={c.path} className="border-b border-border/40 align-top">
                    <td className="py-2 pr-4">{c.group}</td>
                    <td className="py-2 pr-4 font-mono">{c.path}</td>
                    <td className="py-2 text-destructive">{c.issues.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="font-serif text-2xl mb-3">All routes</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4">Group</th>
              <th className="py-2 pr-4">Route</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">OG image</th>
              <th className="py-2 pr-4">H1</th>
              <th className="py-2 pr-4">JSON-LD</th>
              <th className="py-2">Issues</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.path} className="border-b border-border/40 align-top">
                <td className="py-2 pr-4">{c.group}</td>
                <td className="py-2 pr-4 font-mono break-all">{c.path}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      c.status === "ok"
                        ? "text-green-600"
                        : c.status === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-2 pr-4 max-w-[220px] truncate" title={c.title}>{c.title || "—"}</td>
                <td className="py-2 pr-4">{c.ogImage ? "✓" : "—"}</td>
                <td className="py-2 pr-4">{c.h1Count ?? "—"}</td>
                <td className="py-2 pr-4">{c.jsonLdCount ?? "—"}</td>
                <td className="py-2 text-destructive">{c.issues.join("; ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Hidden iframe host */}
        <div ref={containerRef} aria-hidden="true" />
      </div>
    </div>
  );
};

export default SeoDiagnostics;
