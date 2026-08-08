import { notion, DBS, requireEnv } from "./notion/_client.js";
import {
  loadAll,
  normalizeArtist,
  normalizeRelease,
  isReleasePublished,
  normalizeStoreItem,
} from "./notion/_normalize.js";
import { normalizeJournal, isJournalPublished } from "./notion/_journal.js";
import { normalizeGalleryImage, dedupeGalleryImages, sortGalleryImages } from "./notion/_gallery.js";

const STATIC_PATHS = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/artists", priority: "0.9", changefreq: "weekly" },
  { path: "/releases", priority: "0.9", changefreq: "weekly" },
  { path: "/journal", priority: "0.9", changefreq: "weekly" },
  { path: "/store", priority: "0.8", changefreq: "weekly" },
  { path: "/gallery", priority: "0.6", changefreq: "weekly" },
  { path: "/videos", priority: "0.6", changefreq: "weekly" },
  { path: "/music", priority: "0.7", changefreq: "weekly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/newsletter", priority: "0.5", changefreq: "monthly" },
  { path: "/legal/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/legal/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/legal/cookies", priority: "0.3", changefreq: "yearly" },
];

function getBaseUrl(_req: any): string {
  return "https://www.wmgsounds.com";
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" } as any)[c]
  );
}

function imageEntries(
  images: { publicUrl?: string; imageUrl?: string; title?: string; caption?: string }[],
  base: string,
): string {
  return images
    .map((img) => {
      const loc = (img.publicUrl || img.imageUrl || "").split("?")[0];
      // Only permanent, public /media/* URLs belong in the sitemap.
      if (!loc.startsWith("/media/")) return "";
      return `\n    <image:image>\n      <image:loc>${escapeXml(`${base}${loc}`)}</image:loc>${
        img.title ? `\n      <image:title>${escapeXml(img.title)}</image:title>` : ""
      }${img.caption ? `\n      <image:caption>${escapeXml(img.caption)}</image:caption>` : ""}\n    </image:image>`;
    })
    .join("");
}

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: string, images = ""): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.split("T")[0]}</lastmod>` : ""}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ""}${priority ? `\n    <priority>${priority}</priority>` : ""}${images}
  </url>`;
}

export default async function handler(req: any, res: any) {
  const base = getBaseUrl(req);
  const urls: string[] = [];

  const galleryImageXml = { value: "" };
  const storeImageXml = { value: "" };
  const staticEntries: (() => string)[] = STATIC_PATHS.map(
    (s) => () =>
      urlEntry(
        `${base}${s.path}`,
        undefined,
        s.changefreq,
        s.priority,
        s.path === "/gallery" ? galleryImageXml.value : s.path === "/store" ? storeImageXml.value : "",
      ),
  );

  try {
    requireEnv("/api/sitemap", ["NOTION_TOKEN", "NOTION_ARTISTS_DB_ID", "NOTION_RELEASES_DB_ID", "NOTION_JOURNAL_DB_ID"]);
    const [artistPages, releasePages, journalPages, galleryPages, storePages] = await Promise.all([
      loadAll(notion, DBS.artists),
      loadAll(notion, DBS.releases),
      loadAll(notion, DBS.journal),
      DBS.gallery ? loadAll(notion, DBS.gallery).catch(() => []) : Promise.resolve([]),
      DBS.storeItems ? loadAll(notion, DBS.storeItems).catch(() => []) : Promise.resolve([]),
    ]);

    // Published gallery images, listed once beneath /gallery.
    const now = Date.now();
    const galleryImages = sortGalleryImages(
      dedupeGalleryImages(
        (galleryPages as any[])
          .map((p) => normalizeGalleryImage(p, new Map(), now))
          .filter((x): x is NonNullable<typeof x> => x !== null),
      ),
    );
    galleryImageXml.value = imageEntries(galleryImages, base);

    const artists = artistPages.map(normalizeArtist);
    const artistMap = new Map(artists.map((a) => [a.id, a]));
    const releases = releasePages.map((p) => normalizeRelease(p, artistMap));
    const journal = journalPages.map(normalizeJournal).filter((a: any) => isJournalPublished(a) && !a.noindex);

    // Journal categories
    const cats = new Set<string>();
    for (const j of journal as any[]) {
      if (j.category) cats.add(j.category);
    }
    for (const cat of cats) {
      const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (slug) urls.push(urlEntry(`${base}/journal/category/${slug}`, undefined, "weekly", "0.6"));
    }

    // Store product images, listed once beneath /store.
    const releaseLookup = new Map((releases as any[]).map((r) => [r.id, r]));
    const storeItems = (storePages as any[]).map((p) =>
      normalizeStoreItem(p, { artistLookup: artistMap, releaseLookup, trackLookup: new Map() }),
    );
    storeImageXml.value = imageEntries(
      storeItems
        .filter((i: any) => i && i.availability !== "Hidden" && i.productImage)
        .map((i: any) => ({
          publicUrl: i.productImage,
          title: [i.artist?.name, i.title].filter(Boolean).join(" — ") || i.title,
          caption: i.description || "",
        })),
      base,
    );

    for (const a of artists as any[]) {
      if (a.slug && a.showOnWebsite !== false) {
        const images = imageEntries(
          [
            { publicUrl: a.heroImage, title: `${a.name} — hero image`, caption: "" },
            { publicUrl: a.heroImage2, title: `${a.name} — photograph`, caption: "" },
            ...((a.galleryImages || []) as string[]).map((u, i) => ({
              publicUrl: u,
              title: `${a.name} — gallery ${i + 1}`,
              caption: "",
            })),
          ],
          base,
        );
        urls.push(urlEntry(`${base}/artists/${a.slug}`, undefined, "monthly", "0.7", images));
      }
    }
    for (const r of releases as any[]) {
      if (r.slug && isReleasePublished(r)) {
        const images = imageEntries(
          [{ publicUrl: r.coverArt, title: `${r.title} — cover art`, caption: r.artistName || "" }],
          base,
        );
        urls.push(urlEntry(`${base}/releases/${r.slug}`, r.releaseDate, "monthly", "0.8", images));
      }
    }
    for (const j of journal as any[]) {
      if (j.slug) {
        const lastmod = j.lastEditedTime || j.publishedDate || j.createdTime;
        const images = imageEntries(
          [{ publicUrl: j.coverImage, title: j.title || "", caption: j.imageAlt || j.excerpt || "" }],
          base,
        );
        urls.push(urlEntry(`${base}/journal/${j.slug}`, lastmod, "monthly", "0.7", images));
      }
    }
  } catch (e) {
    console.error("[sitemap] failed to load dynamic entries", e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...staticEntries.map((fn) => fn()), ...urls].join("\n")}
</urlset>`;

  res.writeHead(200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  }).end(xml);
}
