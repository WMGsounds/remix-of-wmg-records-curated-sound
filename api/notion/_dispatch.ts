/**
 * In-process dispatcher for the /api/notion/* routes.
 *
 * The build-time pre-render used to fetch these routes over HTTP from
 * https://www.wmgsounds.com. During a Vercel build the live deployment is
 * still the PREVIOUS one, so any change to an API response shape only reached
 * the pre-rendered HTML on the deploy AFTER the one that introduced it, and a
 * slow or failing live site silently baked wrong content into the new build.
 *
 * The pre-render now calls the handlers directly, in the same process, against
 * Notion. Same handler code, same normalisers, same response shape as
 * production — no dependency on the previous deployment.
 */
import artistsHandler from "./artists.js";
import homepageHandler from "./homepage.js";
import journalHandler from "./journal.js";
import journalSlugHandler from "./journal/[slug].js";
import releasesHandler from "./releases.js";
import releaseSlugHandler from "./release/[slug].js";
import artistSlugHandler from "./artist/[slug].js";
import storeHandler from "./store.js";
import videosHandler from "./videos.js";
import type { ApiRequest, ApiResponse } from "./_client.js";

type Handler = (req: ApiRequest, res: ApiResponse) => unknown | Promise<unknown>;

export type ApiResult = { status: number; headers: Record<string, string>; body: string };

function makeRes(resolve: (r: ApiResult) => void): ApiResponse {
  return {
    status: (code: number) => ({
      json: (body: unknown) =>
        resolve({ status: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    }),
    writeHead: (code: number, headers: Record<string, string>) => ({
      end: (body: string) => resolve({ status: code, headers, body }),
    }),
  };
}

/**
 * Path -> handler + query, mirroring the rewrites in vercel.json so the build
 * and production resolve the same URL to the same handler.
 */
function resolveRoute(pathname: string): { handler: Handler; query: Record<string, string> } | null {
  const segs = pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (segs[0] !== "api" || segs[1] !== "notion") return null;
  const rest = segs.slice(2);

  if (rest.length === 1) {
    switch (rest[0]) {
      case "artists":
        return { handler: artistsHandler as Handler, query: {} };
      // vercel.json rewrites these three onto the artists function.
      case "tracks":
        return { handler: artistsHandler as Handler, query: { dataset: "tracks" } };
      case "catalogue":
        return { handler: artistsHandler as Handler, query: { dataset: "catalogue" } };
      case "gallery":
        return { handler: artistsHandler as Handler, query: { dataset: "gallery" } };
      case "homepage":
        return { handler: homepageHandler as Handler, query: {} };
      case "journal":
        return { handler: journalHandler as Handler, query: {} };
      case "releases":
        return { handler: releasesHandler as Handler, query: {} };
      case "store":
        return { handler: storeHandler as Handler, query: {} };
      case "videos":
        return { handler: videosHandler as Handler, query: {} };
      default:
        return null;
    }
  }

  if (rest.length === 2) {
    const slug = decodeURIComponent(rest[1]);
    if (rest[0] === "artist") return { handler: artistSlugHandler as Handler, query: { slug } };
    if (rest[0] === "release") return { handler: releaseSlugHandler as Handler, query: { slug } };
    if (rest[0] === "journal") return { handler: journalSlugHandler as Handler, query: { slug } };
  }

  return null;
}

/** Call an /api/notion/* route in-process. Throws for unknown routes. */
export async function callApi(pathWithQuery: string): Promise<ApiResult> {
  const [pathname, search = ""] = pathWithQuery.split("?");
  const match = resolveRoute(pathname);
  if (!match) throw new Error(`[api-dispatch] no handler for "${pathWithQuery}"`);

  const query: Record<string, string> = { ...match.query };
  for (const [k, v] of new URLSearchParams(search)) query[k] = v;

  let settle!: (r: ApiResult) => void;
  const done = new Promise<ApiResult>((resolve) => {
    settle = resolve;
  });
  await match.handler({ query }, makeRes(settle));
  return done;
}

export default callApi;
