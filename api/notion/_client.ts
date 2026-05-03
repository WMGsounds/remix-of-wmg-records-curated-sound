import { Client } from "@notionhq/client";

export type ApiRequest = {
  query: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  status: (code: number) => { json: (body: unknown) => void };
  writeHead: (code: number, headers: Record<string, string>) => { end: (body: string) => void };
};

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

const REQUIRED_ENV = [
  "NOTION_TOKEN",
  "NOTION_ARTISTS_DB_ID",
  "NOTION_RELEASES_DB_ID",
  "NOTION_TRACKS_DB_ID",
  "NOTION_RELEASE_TRACKS_DB_ID",
] as const;

export const getEnvStatus = () =>
  Object.fromEntries(REQUIRED_ENV.map((name) => [name, Boolean(process.env[name])])) as Record<
    (typeof REQUIRED_ENV)[number],
    boolean
  >;

const summarizeError = (error: unknown) => {
  const e = error as { name?: string; message?: string; stack?: string; code?: string; status?: number };
  return {
    name: e?.name,
    message: e?.message ?? String(error),
    code: e?.code,
    status: e?.status,
    stack: e?.stack,
  };
};

export function validateNotionEnv(route: string) {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error("[notion-api] Missing required environment variables", {
      route,
      missing,
      envStatus: getEnvStatus(),
    });
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function logApiError(route: string, error: unknown, context: Record<string, unknown> = {}) {
  console.error("[notion-api] Route failed", {
    route,
    ...context,
    envStatus: getEnvStatus(),
    error: summarizeError(error),
  });
}

export function logApiSuccess(route: string, context: Record<string, unknown> = {}) {
  console.log("[notion-api] Returning real Notion data", {
    route,
    ...context,
    envStatus: getEnvStatus(),
  });
}

export function logApiFallback(route: string, error: unknown, context: Record<string, unknown> = {}) {
  const summary = summarizeError(error);
  console.warn("[notion-api] Returning fallback mock data", {
    route,
    reason: summary.message,
    ...context,
    envStatus: getEnvStatus(),
    error: summary,
  });
}

export const DBS = {
  artists: process.env.NOTION_ARTISTS_DB_ID!,
  releases: process.env.NOTION_RELEASES_DB_ID!,
  tracks: process.env.NOTION_TRACKS_DB_ID!,
  releaseTracks: process.env.NOTION_RELEASE_TRACKS_DB_ID!,
  journal: process.env.NOTION_JOURNAL_DB_ID!,
};

export function requireEnv(route: string, names: string[]) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length > 0) {
    console.error("[notion-api] Missing required env", { route, missing });
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// Notion file URLs expire ~1h. Cache JSON 50 min on the CDN, allow the browser
// to reuse it for 5 min, and serve stale-while-revalidate for an extra 10 min
// so navigations feel instant and Notion isn't re-hit on every request.
export const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=3000, stale-while-revalidate=600",
  "Content-Type": "application/json",
  "X-Data-Source": "notion",
};
