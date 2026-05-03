import { notion, DBS, requireEnv } from "./notion/_client.js";
import { loadAll, normalizeArtist, normalizeRelease } from "./notion/_normalize.js";
import { normalizeJournal } from "./notion/_journal.js";

const STATIC_PATHS = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/artists", priority: "0.9", changefreq: "weekly" },
  { path: "/releases", priority: "0.9", changefreq: "weekly" },
  { path: "/journal", priority: "0.9", changefreq: "weekly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/newsletter", priority: "0.5", changefreq: "monthly" },
  { path: "/legal/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/legal/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/legal/cookies", priority: "0.3", changefreq: "yearly" },
];

function getBaseUrl(req: any): string {
  const envUrl = process.env.SITE_URL || process.env.PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const host = req?.headers?.host || "wmgr-soundscapes.lovable.app";
  const proto = req?.headers?.["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" } as any)[c]
  );
}

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.split("T")[0]}</lastmod>` : ""}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ""}${priority ? `\n    <priority>${priority}</priority>` : ""}
  </url>`;
}

export default async function handler(req: any, res: any) {
  const base = getBaseUrl(req);
  const urls: string[] = [];

  for (const s of STATIC_PATHS) {
    urls.push(urlEntry(`${base}${s.path}`, undefined, s.changefreq, s.priority));
  }

  try {
    requireEnv("/api/sitemap", ["NOTION_TOKEN", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID", "NOTION_JOURNAL_DB_ID"]);
    const [artistPages, releasePages, journalPages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.journal),
    ]);

    const artists = artistPages.map(normalizeArtist);
    const artistMap = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistMap));
    const journal = journalPages.map(normalizeJournal).filter((a: any) => a.published);

    for (const a of artists) {
      if (a.slug) urls.push(urlEntry(`${base}/artists/${a.slug}`, undefined, "monthly", "0.7"));
    }
    for (const r of releases as any[]) {
      if (r.slug) urls.push(urlEntry(`${base}/releases/${r.slug}`, r.releaseDate, "monthly", "0.8"));
    }
    for (const j of journal as any[]) {
      if (j.slug) {
        const lastmod = j.lastEditedTime || j.publishedDate || j.createdTime;
        urls.push(urlEntry(`${base}/journal/${j.slug}`, lastmod, "monthly", "0.7"));
      }
    }
  } catch (e) {
    console.error("[sitemap] failed to load dynamic entries", e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  res.writeHead(200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  }).end(xml);
}
