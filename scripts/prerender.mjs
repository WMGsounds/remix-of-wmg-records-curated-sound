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

const server = await import(pathToFileURL(ssrEntry).href);
await server.preloadAllPages();

const routes = await server.collectRoutes();
console.log(`[prerender] ${routes.length} routes`);

const injectHead = (html, head) =>
  html.replace("</head>", `  ${head}\n  </head>`);

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

console.log(`[prerender] wrote ${ok} pages, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
