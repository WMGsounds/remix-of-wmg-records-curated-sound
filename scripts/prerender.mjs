/**
 * Build-time pre-rendering.
 *
 * Renders every public route to static HTML so crawlers receive real markup,
 * per-page <title>/<meta>/canonical/OG/Twitter tags and JSON-LD before any
 * JavaScript runs. Run after `vite build` + the SSR bundle build.
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

const routes = await server.collectRoutes();
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

for (const route of routes) {
  try {
    const { html, head } = await server.render(route);
    let page = injectHead(template, head);
    page = injectBody(page, html);
    const outFile = outFileFor(route);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, page, "utf8");
    ok += 1;
  } catch (error) {
    failed += 1;
    console.error(`[prerender] FAILED ${route}:`, error?.message ?? error);
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
if (failed > 0) process.exitCode = 1;
