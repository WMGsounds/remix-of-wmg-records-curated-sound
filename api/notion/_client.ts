import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

const REQUIRED_ENV = [
  "NOTION_TOKEN",
  "NOTION_ARTISTS_DB_ID",
  "NOTION_RELEASES_DB_ID",
  "NOTION_TRACKS_DB_ID",
] as const;

export const getEnvStatus = () =>
  Object.fromEntries(REQUIRED_ENV.map((name) => [name, Boolean(process.env[name])])) as Record<
    (typeof REQUIRED_ENV)[number],
    boolean
  >;

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
  const e = error as { name?: string; message?: string; stack?: string; code?: string; status?: number };
  console.error("[notion-api] Route failed", {
    route,
    ...context,
    envStatus: getEnvStatus(),
    error: {
      name: e?.name,
      message: e?.message ?? String(error),
      code: e?.code,
      status: e?.status,
      stack: e?.stack,
    },
  });
}

export const DBS = {
  artists: process.env.NOTION_ARTISTS_DB_ID!,
  releases: process.env.NOTION_RELEASES_DB_ID!,
  tracks: process.env.NOTION_TRACKS_DB_ID!,
};

// Notion file URLs expire ~1h. Cache responses 50 min so we always re-fetch
// before the URL goes stale.
export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3000, stale-while-revalidate=600",
  "Content-Type": "application/json",
};
