/**
 * Notion -> /content snapshot sync.
 *
 * Run on a developer machine or a manual GitHub Action:
 *
 *     npm run sync:content
 *
 * It calls the same /api/notion/* handlers the site uses, in-process, and
 * writes each response to a JSON file under /content (committed to git).
 * The Vercel build then reads ONLY /content and makes zero Notion calls,
 * so a Notion outage or rate limit can never break a deployment.
 *
 * Safety rules:
 *  - A failed fetch NEVER overwrites an existing good snapshot.
 *  - The run reports what changed, what stayed the same and what failed.
 *  - Exit code is non-zero if a path failed and had no previous snapshot.
 */
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const root = process.cwd();
const contentDir = path.join(root, "content");
const manifestFile = path.join(contentDir, "manifest.json");

/* -------- env -------- */
if (existsSync(path.join(root, ".env"))) {
  for (const line of (await fs.readFile(path.join(root, ".env"), "utf8")).split("\n")) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const REQUIRED_ENV = [
  "NOTION_TOKEN",
  "NOTION_ARTISTS_DB_ID",
  "NOTION_RELEASES_DB_ID",
  "NOTION_TRACKS_DB_ID",
  "NOTION_RELEASE_TRACKS_DB_ID",
  "NOTION_JOURNAL_DB_ID",
  "NOTION_STORE_DB_ID",
  "NOTION_GALLERY_DATABASE_ID",
  "NOTION_VIDEOS_DATABASE_ID",
];
const missing = REQUIRED_ENV.filter((n) => !process.env[n]);
if (missing.length) {
  console.error(
    `[sync] Missing Notion environment variables: ${missing.join(", ")}.\n` +
      "Add them to .env (local) or to the workflow secrets before running sync:content.",
  );
  process.exit(1);
}

process.env.WMG_NOTION_CACHE_DIR ||= path.join(root, "node_modules", ".cache", "wmg-notion");

/* -------- bundle the in-process API dispatcher -------- */
const dispatchOut = path.join(root, "dist-api", "dispatch.mjs");
await esbuild.build({
  entryPoints: [path.join(root, "api", "notion", "_dispatch.ts")],
  outfile: dispatchOut,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  packages: "external",
  logLevel: "silent",
  plugins: [
    {
      name: "js-to-ts",
      setup(build) {
        build.onResolve({ filter: /^\.{1,2}\/.*\.js$/ }, (args) => {
          const candidate = path.resolve(args.resolveDir, args.path.replace(/\.js$/, ".ts"));
          return existsSync(candidate) ? { path: candidate } : undefined;
        });
      },
    },
  ],
});
const { callApi } = await import(pathToFileURL(dispatchOut).href);

/* -------- helpers -------- */
const startedAt = Date.now();
const elapsed = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;

const fileFor = (apiPath) =>
  path.join(contentDir, `${apiPath.replace(/^\/api\/notion\//, "").replace(/\/+$/, "")}.json`);

const hashOf = (s) => createHash("sha1").update(s).digest("hex");

const previousManifest = existsSync(manifestFile)
  ? JSON.parse(await fs.readFile(manifestFile, "utf8"))
  : { entries: {} };

const entries = {};
const changed = [];
const unchanged = [];
const failedWithFallback = [];
const failedHard = [];

async function snapshot(apiPath) {
  const file = fileFor(apiPath);
  const rel = path.relative(root, file);
  let body;
  try {
    const res = await callApi(apiPath);
    if (res.status !== 200) throw new Error(`handler returned HTTP ${res.status}: ${res.body.slice(0, 200)}`);
    JSON.parse(res.body); // malformed responses must never be written
    body = JSON.stringify(JSON.parse(res.body), null, 0);
  } catch (error) {
    const message = error?.message ?? String(error);
    if (existsSync(file)) {
      // Refuse to overwrite good content with a failure.
      const prev = previousManifest.entries?.[apiPath];
      entries[apiPath] = {
        file: rel,
        hash: prev?.hash ?? hashOf(await fs.readFile(file, "utf8")),
        fetchedAt: prev?.fetchedAt ?? null,
        stale: true,
      };
      failedWithFallback.push(`${apiPath} — kept previous snapshot (${message})`);
    } else {
      failedHard.push(`${apiPath} — no previous snapshot (${message})`);
    }
    return null;
  }

  const hash = hashOf(body);
  const prevHash = previousManifest.entries?.[apiPath]?.hash;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body, "utf8");
  entries[apiPath] = { file: rel, hash, fetchedAt: new Date().toISOString(), stale: false };
  if (prevHash === hash) unchanged.push(apiPath);
  else changed.push(apiPath);
  return JSON.parse(body);
}

/* -------- what to snapshot -------- */
const LIST_PATHS = [
  "/api/notion/artists",
  "/api/notion/releases",
  "/api/notion/tracks",
  "/api/notion/catalogue",
  "/api/notion/gallery",
  "/api/notion/homepage",
  "/api/notion/journal",
  "/api/notion/store",
  "/api/notion/videos",
];

console.log(`[sync] pulling ${LIST_PATHS.length} collection endpoints from Notion…`);
const lists = {};
for (const p of LIST_PATHS) lists[p] = await snapshot(p);

const slugsOf = (data) =>
  Array.isArray(data) ? [...new Set(data.map((x) => x?.slug).filter(Boolean))] : [];

const detailPaths = [
  ...slugsOf(lists["/api/notion/artists"]).map((s) => `/api/notion/artist/${encodeURIComponent(s)}`),
  ...slugsOf(lists["/api/notion/releases"]).map((s) => `/api/notion/release/${encodeURIComponent(s)}`),
  ...slugsOf(lists["/api/notion/journal"]).map((s) => `/api/notion/journal/${encodeURIComponent(s)}`),
];

console.log(`[sync] pulling ${detailPaths.length} detail pages…`);
for (const p of detailPaths) await snapshot(p);

/* -------- keep snapshots for paths we could not enumerate this run -------- */
for (const [apiPath, prev] of Object.entries(previousManifest.entries ?? {})) {
  if (entries[apiPath]) continue;
  const file = path.join(root, prev.file);
  if (existsSync(file)) entries[apiPath] = { ...prev, stale: true };
}

/* -------- write manifest -------- */
const manifest = {
  generatedAt: new Date().toISOString(),
  source: "notion",
  count: Object.keys(entries).length,
  entries: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))),
};
await fs.mkdir(contentDir, { recursive: true });
await fs.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

/* -------- report -------- */
console.log(`\n[sync] finished in ${elapsed()} — ${manifest.count} snapshots in /content`);
console.log(`[sync] changed:   ${changed.length}`);
for (const p of changed) console.log(`         + ${p}`);
console.log(`[sync] unchanged: ${unchanged.length}`);
if (failedWithFallback.length) {
  console.warn(`[sync] failed but kept previous content: ${failedWithFallback.length}`);
  for (const m of failedWithFallback) console.warn(`         ! ${m}`);
}
if (failedHard.length) {
  console.error(`[sync] FAILED with no previous content: ${failedHard.length}`);
  for (const m of failedHard) console.error(`         x ${m}`);
  console.error("[sync] /content is incomplete — do not commit this run; re-run sync:content.");
  process.exit(1);
}
console.log("[sync] commit /content so the next Vercel build picks it up.");
