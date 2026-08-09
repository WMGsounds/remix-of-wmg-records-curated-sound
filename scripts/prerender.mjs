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
import path from "node:path";
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

const server = await import(pathToFileURL(ssrEntry).href);
await server.preloadAllPages();

const problems = [];
const fail = (msg) => problems.push(msg);

/* ---------------- Assertion 1 + 2: registry <-> config integrity --------- */
const { routeRegistry } = await import(pathToFileURL(ssrEntry).href).then((m) => m.registry ?? m);
const registry = server.registry ?? {};
{
  const entries = registry.routeRegistry ?? [];
  const keys = new Set(registry.seoKeys ?? []);
  for (const entry of entries) {
    if (!entry.path) fail(`registry entry for page "${entry.page}" has no path`);
    if (!entry.seo) fail(`registry entry "${entry.path}" has no seo key`);
    else if (!keys.has(entry.seo))
      fail(`registry entry "${entry.path}" points at unknown seoConfig key "${entry.seo}"`);
  }
  for (const p of registry.routerPaths ?? []) {
    if (!entries.some((e) => e.path === p))
      fail(`router path "${p}" has no entry in routeRegistry`);
  }
}

const { routes, sitemap } = await server.collectSite();
console.log(`[prerender] ${routes.length} routes`);

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
const written = new Set();

for (const route of routes) {
  try {
    const { html, head } = await server.render(route);

    /* -------- Assertion 4: no route may render empty metadata ---------- */
    const title = /<title[^>]*>([^<]*)<\/title>/.exec(head)?.[1]?.trim();
    const description = /<meta name="description" content="([^"]*)"/.exec(head)?.[1]?.trim();
    if (!title) fail(`route "${route}" rendered an empty <title>`);
    if (!description) fail(`route "${route}" rendered an empty meta description`);

    let page = injectHead(template, head);
    page = injectBody(page, html);
    const outFile = outFileFor(route);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, page, "utf8");
    written.add(route);
    ok += 1;
  } catch (error) {
    failed += 1;
    console.error(`[prerender] FAILED ${route}:`, error?.message ?? error);
  }
}

/* -------- Assertion 3: output file set must match the route set --------- */
for (const route of routes) {
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
  if (!written.has(entry.path))
    fail(`sitemap entry "${entry.path}" has no pre-rendered page (it would 404)`);
}
await fs.writeFile(path.join(distDir, "sitemap.xml"), server.renderSitemap(sitemapEntries), "utf8");
console.log(`[prerender] wrote sitemap.xml (${sitemapEntries.length} urls)`);

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

if (problems.length) {
  console.error(`\n[prerender] ${problems.length} SEO consistency assertion(s) failed:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exitCode = 1;
}
if (failed > 0) process.exitCode = 1;
