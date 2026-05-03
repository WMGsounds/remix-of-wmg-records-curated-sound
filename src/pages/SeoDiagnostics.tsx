import { useEffect, useState } from "react";
import { Seo } from "@/components/Seo";
import { SITE_URL } from "@/lib/seo";

type RouteCheck = {
  path: string;
  status: "pending" | "ok" | "error";
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogTitle?: string;
  twitterCard?: string;
  h1Count?: number;
  jsonLdCount?: number;
  issues: string[];
};

const ROUTES = [
  "/",
  "/artists",
  "/releases",
  "/journal",
  "/about",
  "/contact",
  "/newsletter",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

const audit = (html: string, path: string): RouteCheck => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const get = (sel: string, attr = "content") =>
    doc.querySelector(sel)?.getAttribute(attr) || "";
  const title = doc.querySelector("title")?.textContent || "";
  const description = get('meta[name="description"]');
  const canonical = get('link[rel="canonical"]', "href");
  const ogImage = get('meta[property="og:image"]');
  const ogTitle = get('meta[property="og:title"]');
  const twitterCard = get('meta[name="twitter:card"]');
  const h1Count = doc.querySelectorAll("h1").length;
  const jsonLdCount = doc.querySelectorAll('script[type="application/ld+json"]').length;

  const issues: string[] = [];
  if (!title) issues.push("missing <title>");
  if (!description) issues.push("missing meta description");
  if (!canonical) issues.push("missing canonical");
  if (!ogImage) issues.push("missing og:image");
  if (!ogTitle) issues.push("missing og:title");
  if (!twitterCard) issues.push("missing twitter:card");
  // Note: SPA pre-hydration HTML may show h1Count = 0; this is hydrated client-side.
  if (h1Count > 1) issues.push(`multiple h1 tags (${h1Count})`);
  if (jsonLdCount === 0) issues.push("no JSON-LD structured data");

  return {
    path,
    status: issues.length ? "error" : "ok",
    title,
    description,
    canonical,
    ogImage,
    ogTitle,
    twitterCard,
    h1Count,
    jsonLdCount,
    issues,
  };
};

const SeoDiagnostics = () => {
  const [checks, setChecks] = useState<RouteCheck[]>(
    ROUTES.map((p) => ({ path: p, status: "pending", issues: [] })),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results: RouteCheck[] = [];
      for (const path of ROUTES) {
        try {
          const res = await fetch(path, { headers: { Accept: "text/html" } });
          const html = await res.text();
          results.push(audit(html, path));
        } catch (e) {
          results.push({
            path,
            status: "error",
            issues: [`fetch failed: ${(e as Error).message}`],
          });
        }
        if (!cancelled) setChecks([...results, ...ROUTES.slice(results.length).map((p) => ({ path: p, status: "pending" as const, issues: [] }))]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <Seo
        title="SEO Diagnostics"
        description="Internal SEO diagnostics for WMG Records public routes."
        noindex
        canonicalPath="/seo-diagnostics"
      />
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl mb-2">SEO Diagnostics</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Developer-only audit of public routes. Fetches each route's pre-hydration HTML and
          checks for title, meta description, canonical, OG/Twitter tags, JSON-LD and H1 count.
          Note: H1 counts reflect server-rendered HTML; some H1 tags are hydrated client-side
          and may not appear here. Sitemap: <a className="underline" href={`${SITE_URL}/sitemap.xml`}>{`${SITE_URL}/sitemap.xml`}</a>
        </p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4">Route</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">OG image</th>
              <th className="py-2">Issues</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.path} className="border-b border-border/40 align-top">
                <td className="py-2 pr-4 font-mono">{c.path}</td>
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
                <td className="py-2 pr-4 max-w-[200px] truncate" title={c.title}>{c.title || "—"}</td>
                <td className="py-2 pr-4 max-w-[260px] truncate" title={c.description}>{c.description || "—"}</td>
                <td className="py-2 pr-4 max-w-[200px] truncate" title={c.ogImage}>{c.ogImage ? "✓" : "—"}</td>
                <td className="py-2 text-destructive">{c.issues.join("; ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SeoDiagnostics;
