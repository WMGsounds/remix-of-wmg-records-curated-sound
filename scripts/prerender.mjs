/**
 * Build-time pre-rendering + sitemap generation.
 *
 * Renders every public route to static HTML so crawlers receive real markup,
 * per-page <title>/<meta>/canonical/OG/Twitter tags and JSON-LD before any
 * JavaScript runs, then writes dist/sitemap.xml from THE SAME route list.
 *
 * The sitemap is deliberately build-time, not a runtime function: a runtime
 * sitemap re-queries the CMS independently of the build and would advertise
 * URLs whose static page does not exist yet (there is no catch-all SPA
 * rewrite, so those 404). A build-time sitemap cannot list an unrendered URL.
 *
 * The build FAILS (non-zero exit) if the registry, the SEO config, the
 * rendered output or the metadata drift apart — see assertions below.
 *
 * Run after `vite build` + the SSR bundle build.
 */
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";




const root = process.cwd();
const distDir = path.join(root, "dist");

const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");

if (template.includes('data-rh="true"') || !template.includes('<div id="root"></div>')) {
  throw new Error(
    "[prerender] dist/index.html is already pre-rendered. Run `vite build` first so the template is clean.",
  );
}

/* ---------------- CMS access: committed /content snapshot ---------------- *
 * The build makes ZERO network calls to Notion. All CMS data comes from the
 * JSON files in /content, produced by `npm run sync:content` on a developer
 * machine or a manual GitHub Action and committed to git. A Notion outage,
 * rate limit or 502 therefore cannot break a deployment.
 *
 * If /content is missing or malformed the build fails loudly — it must never
 * silently deploy a site without CMS content. */
const contentDir = path.join(root, "content");
const manifestFile = path.join(contentDir, "manifest.json");

if (!existsSync(manifestFile)) {
  throw new Error(
    "[prerender] /content/manifest.json is missing. The build reads CMS data only from the committed " +
      "/content snapshot. Run `npm run sync:content` locally and commit /content.",
  );
}

let contentManifest;
try {
  contentManifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
} catch (error) {
  throw new Error(`[prerender] /content/manifest.json is malformed: ${error?.message ?? error}`);
}
if (!contentManifest?.entries || typeof contentManifest.entries !== "object" || !Object.keys(contentManifest.entries).length) {
  throw new Error(
    "[prerender] /content/manifest.json has no entries. Run `npm run sync:content` and commit /content.",
  );
}

globalThis.__WMG_LOCAL_API__ = async (p) => {
  const entry = contentManifest.entries[p];
  if (!entry) {
    throw new Error(
      `[prerender] no snapshot in /content for "${p}". Run \`npm run sync:content\` and commit /content.`,
    );
  }
  const file = path.join(root, entry.file);
  let body;
  try {
    body = await fs.readFile(file, "utf8");
    JSON.parse(body);
  } catch (error) {
    throw new Error(`[prerender] content snapshot "${entry.file}" is missing or malformed: ${error?.message ?? error}`);
  }
  return { status: 200, headers: { "Content-Type": "application/json" }, body };
};

console.log(
  `[prerender] CMS access: /content snapshot (${Object.keys(contentManifest.entries).length} files, synced ${
    contentManifest.generatedAt ?? "unknown"
  }) — no Notion requests during this build`,
);




const server = await import(pathToFileURL(ssrEntry).href);
await server.preloadAllPages();


const problems = [];
const fail = (msg) => problems.push(msg);

/* ---------------- Assertion 1 + 2: registry <-> config integrity --------- */
const problemsHeader = "[prerender]";
{
  const { routeRegistry, seoKeys, pageNames } = server.registry;
  const keys = new Set(seoKeys);
  const pages = new Set(pageNames);
  for (const entry of routeRegistry) {
    if (!entry.path) fail(`registry entry for page "${entry.page}" has no path`);
    if (!pages.has(entry.page))
      fail(`registry entry "${entry.path}" has no page component in routes.tsx`);
    if (!entry.seo) fail(`registry entry "${entry.path}" has no seo key`);
    else if (!keys.has(entry.seo))
      fail(`registry entry "${entry.path}" points at unknown seoConfig key "${entry.seo}"`);
  }
  for (const p of pageNames) {
    if (!routeRegistry.some((e) => e.page === p))
      fail(`page "${p}" is routed in routes.tsx but has no entry in routeRegistry`);
  }
}

const { routes, sitemap, videos } = await server.collectSite();
console.log(`[prerender] ${routes.length} routes`);

/* ---------------- lastmod for static routes, from git ------------------- *
 * CMS-backed routes carry a real content timestamp. Static pages take the
 * last commit date of their source file, never the build date: dating every
 * page "today" on each deploy is a false signal Google learns to ignore.
 * If git history is unavailable (shallow or missing checkout), the entry
 * simply ships without a <lastmod>. */
const gitDate = (file) => {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : undefined;
  } catch {
    return undefined;
  }
};

{
  const staticPageByPath = new Map(
    server.registry.routeRegistry
      .filter((e) => !e.expand && !e.path.includes(":") && e.path !== "*")
      .map((e) => [e.path, `src/pages/${e.page}.tsx`]),
  );
  const dateCache = new Map();
  for (const entry of sitemap) {
    if (entry.lastmod) continue;
    const file = staticPageByPath.get(entry.path);
    if (!file) continue;
    if (!dateCache.has(file)) dateCache.set(file, gitDate(file));
    const d = dateCache.get(file);
    if (d) entry.lastmod = d;
  }
}


const injectHead = (html, head) => {
  // Drop the template's fallback <title> so the per-page one is the only title.
  const stripped = /<title[ >]/.test(head)
    ? html.replace(/\n?\s*<title>[^<]*<\/title>/, "")
    : html;
  return stripped.replace("</head>", `  ${head}\n  </head>`);
};

const injectBody = (html, body) =>
  html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

const outFileFor = (route) =>
  route === "/"
    ? path.join(distDir, "index.html")
    : path.join(distDir, route.replace(/^\//, ""), "index.html");

let ok = 0;
let failed = 0;
/** Routes whose CMS read failed outright — skipped, not fatal. */
const skipped = new Set();
const written = new Set();
/** route -> internal hrefs found in the rendered HTML (internal-linking audit). */
const linksByRoute = new Map();
const warnings = [];

/* Which routes may raise a title-length WARNING (never an error).
 * Only pages whose descriptive wording is authored and editable: artist pages
 * and static hub pages. Release and journal titles are fixed facts, so a
 * length warning there is noise nobody can act on. */
const seoKeyFor = (route) => {
  const segs = route.split("/").filter(Boolean);
  for (const e of server.registry.routeRegistry) {
    if (e.path === "*") continue;
    const p = e.path.split("/").filter(Boolean);
    if (p.length !== segs.length) continue;
    if (p.every((s, i) => s.startsWith(":") || s === segs[i])) return e.seo;
  }
  return undefined;
};
const NO_TITLE_WARNING = new Set(["release", "journalArticle"]);

for (const route of routes) {
  try {
    const { html, head } = await server.render(route);

    /* -------- Assertion 4: no route may render empty metadata ---------- */
    const title = /<title[^>]*>([^<]*)<\/title>/.exec(head)?.[1]?.trim();
    const description = /<meta[^>]*name="description"[^>]*content="([^"]*)"/.exec(head)?.[1]?.trim();
    if (!title) fail(`route "${route}" rendered an empty <title>`);
    if (!description) fail(`route "${route}" rendered an empty meta description`);
    if (title && title.length > 60 && !NO_TITLE_WARNING.has(seoKeyFor(route)))
      warnings.push(`title is ${title.length} chars on "${route}": ${title}`);

    /* -------- Assertion 5: structured data integrity -------------------- *
     * Counts TOP-LEVEL @type values in each JSON-LD block only. Nested
     * objects (BlogPosting.publisher is an Organization, MusicAlbum.byArtist
     * is a MusicGroup) are deliberately ignored — counting them would fail
     * every article. */
    const blocks = [...head.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
      .map((m) => m[1])
      .map((raw) => {
        try {
          return JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'"));
        } catch {
          fail(`route "${route}" emitted invalid JSON-LD`);
          return null;
        }
      })
      .filter(Boolean);

    const topTypes = blocks.flatMap((b) => (Array.isArray(b) ? b : [b])).map((b) => b?.["@type"]);
    const count = (t) => topTypes.filter((x) => x === t).length;
    if (count("Organization") !== 1)
      fail(`route "${route}" has ${count("Organization")} top-level Organization blocks (expected exactly 1)`);
    if (count("WebSite") !== 1)
      fail(`route "${route}" has ${count("WebSite")} top-level WebSite blocks (expected exactly 1)`);
    if (route !== "/" && route !== "/__not-found__" && count("BreadcrumbList") !== 1)
      fail(`route "${route}" has ${count("BreadcrumbList")} BreadcrumbList blocks (expected exactly 1)`);

    // Every URL inside JSON-LD must be absolute and free of cache-busters.
    const serialized = JSON.stringify(blocks);
    for (const m of serialized.matchAll(/"(?:url|contentUrl|logo|image|item|thumbnailUrl|embedUrl|mainEntityOfPage|sameAs)":"([^"]+)"/g)) {
      if (!/^https?:\/\//i.test(m[1]))
        fail(`route "${route}" has a non-absolute URL in JSON-LD: ${m[1]}`);
      if (m[1].includes("?") && m[1].includes("wmgsounds.com"))
        fail(`route "${route}" has a query string in an on-site JSON-LD URL: ${m[1]}`);
    }
    for (const m of serialized.matchAll(/"(\/[^"]*)"/g))
      fail(`route "${route}" has a root-relative URL in JSON-LD: ${m[1]}`);
    for (const m of serialized.matchAll(/"(https?:\/\/[^"]*wmgsounds\.com[^"]*\?[^"]*)"/g))
      fail(`route "${route}" has a query string in an on-site JSON-LD URL: ${m[1]}`);


    let page = injectHead(template, head);
    page = injectBody(page, html);
    const outFile = outFileFor(route);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, page, "utf8");
    linksByRoute.set(
      route,
      new Set([...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1].replace(/\/$/, "") || "/")),
    );
    written.add(route);
    ok += 1;
  } catch (error) {
    /* One unreachable CMS page must not block deployment of all the others:
     * skip it, drop it from the sitemap for this build, and log it loudly. */
    failed += 1;
    skipped.add(route);
    const slug = route.split("/").filter(Boolean).pop() ?? route;
    console.error(
      `[prerender] SKIPPED ${route} (slug="${slug}") — excluded from this build's sitemap: ${
        error?.message ?? error
      }`,
    );
  }
}

/* -------- Assertion 3: output file set must match the route set --------- */
for (const route of routes) {
  if (skipped.has(route)) continue;
  if (!written.has(route)) {
    fail(`route "${route}" produced no pre-rendered file`);
    continue;
  }
  try {
    await fs.access(outFileFor(route));
  } catch {
    fail(`pre-rendered file missing on disk for route "${route}"`);
  }
}

/* -------- Sitemap, from the exact list of routes just rendered ---------- */
const sitemapEntries = sitemap.filter((e) => written.has(e.path));
for (const entry of sitemap) {
  if (written.has(entry.path)) continue;
  if (skipped.has(entry.path))
    warnings.push(`sitemap entry "${entry.path}" was skipped this build (CMS unreachable)`);
  else fail(`sitemap entry "${entry.path}" has no pre-rendered page (it would 404)`);
}
await fs.writeFile(path.join(distDir, "sitemap.xml"), server.renderSitemap(sitemapEntries), "utf8");
console.log(`[prerender] wrote sitemap.xml (${sitemapEntries.length} urls)`);

/* -------- Video sitemap, from the same in-process CMS read -------------- */
if (videos?.length) {
  await fs.writeFile(
    path.join(distDir, "video-sitemap.xml"),
    server.renderVideoSitemap(videos),
    "utf8",
  );
  console.log(`[prerender] wrote video-sitemap.xml (${videos.length} videos)`);
} else {
  warnings.push("no published videos found — video-sitemap.xml was not written");
}

for (const entry of sitemapEntries) {
  if (!entry.lastmod) warnings.push(`sitemap entry "${entry.path}" has no <lastmod>`);
}

/* -------- Internal linking: every release page must be reachable -------- *
 * A release nobody links to is orphaned for crawlers. Advisory (a release can
 * legitimately be published before its artist page copy catches up), but loud. */
{
  const linkSources = [...linksByRoute.entries()].filter(
    ([r]) => r.startsWith("/artists/") || r.startsWith("/journal/") || r === "/releases",
  );
  for (const route of routes) {
    if (!route.startsWith("/releases/")) continue;
    if (!linkSources.some(([, links]) => links.has(route)))
      warnings.push(`release "${route}" is not linked from any artist, journal or releases page`);
  }
}

// Static 404 document. Vercel serves dist/404.html with a real HTTP 404 status
// for any path that does not match a file, rewrite or redirect.
try {
  const { html, head } = await server.render("/__not-found__");
  let page = injectHead(template, head);
  page = injectBody(page, html);
  await fs.writeFile(path.join(distDir, "404.html"), page, "utf8");
  console.log("[prerender] wrote 404.html");
} catch (error) {
  failed += 1;
  console.error("[prerender] FAILED 404.html:", error?.message ?? error);
}

console.log(`[prerender] wrote ${ok} pages, ${failed} failed`);

// Advisory only — an over-length title is not a build error.
if (warnings.length) {
  console.warn(`\n[prerender] ${warnings.length} SEO warning(s) (advisory):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}


if (problems.length) {
  console.error(`\n[prerender] ${problems.length} SEO consistency assertion(s) failed:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exitCode = 1;
}
/* Skipping the odd page is survivable; losing a large share of the site is not.
 * Fail the build only when more than 10% of routes could not be rendered. */
if (failed > 0) {
  console.warn(`[prerender] ${failed} route(s) skipped: ${[...skipped].join(", ")}`);
  if (failed > Math.max(1, Math.floor(routes.length * 0.1))) {
    console.error(`[prerender] too many routes failed (${failed} of ${routes.length}) — failing the build`);
    process.exitCode = 1;
  }
}
