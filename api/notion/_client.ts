import { Client } from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

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
