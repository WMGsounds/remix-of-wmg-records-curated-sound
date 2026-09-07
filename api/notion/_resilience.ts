// ============================================================================
//  NOTION RESILIENCE LAYER
// ----------------------------------------------------------------------------
//  One unreachable Notion page must never block a deployment of the whole
//  site. Everything that talks to Notion goes through notionRequest():
//
//    * throttled  — at most MAX_RPS requests per second across the process
//    * retried    — exponential backoff with jitter on 429/5xx
//    * cached     — successful responses are written to disk during the build,
//                   keyed by page id + last_edited_time, and served as a
//                   fallback when Notion is still failing after all retries
//    * logged     — every failure names the page id and slug
//
//  Nothing here changes page content: the cache key includes the content
//  version, so a stale copy is only ever used when the live fetch is broken.
// ============================================================================

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Notion's documented limit is ~3 requests/second per integration. */
const MAX_RPS = 3;
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);

export type NotionContext = { pageId?: string; slug?: string; label?: string };

const describe = (ctx: NotionContext) =>
  [ctx.label, ctx.slug ? `slug=${ctx.slug}` : null, ctx.pageId ? `page=${ctx.pageId}` : null]
    .filter(Boolean)
    .join(" ");

const statusOf = (error: unknown): number | undefined => {
  const e = error as { status?: number; statusCode?: number; code?: string; message?: string };
  if (typeof e?.status === "number") return e.status;
  if (typeof e?.statusCode === "number") return e.statusCode;
  const m = /\b(429|5\d{2})\b/.exec(String(e?.message ?? ""));
  return m ? Number(m[1]) : undefined;
};

const isRetryable = (error: unknown): boolean => {
  const status = statusOf(error);
  if (status !== undefined) return RETRY_STATUS.has(status);
  // Network-level faults (socket hang up, ETIMEDOUT, ECONNRESET) are transient.
  const code = String((error as { code?: string })?.code ?? "");
  return /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|EPIPE|UND_ERR/.test(code);
};

/* ------------------------------------------------------------------ *
 * Global throttle: a simple serialized gate that guarantees at least
 * 1000/MAX_RPS ms between the start of consecutive Notion requests.
 * ------------------------------------------------------------------ */
const MIN_GAP_MS = Math.ceil(1000 / MAX_RPS);
let nextSlot = 0;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function takeSlot(): Promise<void> {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + MIN_GAP_MS;
  if (at > now) await sleep(at - now);
}

/* ------------------------------------------------------------------ *
 * Build-time disk cache. Enabled only when WMG_NOTION_CACHE_DIR is set
 * (scripts/prerender.mjs sets it); serverless requests never write to disk.
 * ------------------------------------------------------------------ */
const cacheDir = process.env.WMG_NOTION_CACHE_DIR;

const cacheFile = (key: string) =>
  path.join(cacheDir!, `${createHash("sha1").update(key).digest("hex")}.json`);

function readCache<T>(key: string): T | undefined {
  if (!cacheDir) return undefined;
  try {
    return JSON.parse(fs.readFileSync(cacheFile(key), "utf8")) as T;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, value: unknown): void {
  if (!cacheDir) return;
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile(key), JSON.stringify(value), "utf8");
  } catch (error) {
    console.warn("[notion] could not write build cache", (error as Error)?.message);
  }
}

/**
 * Run one Notion API call with throttling, retries and (optionally) a
 * disk-cached fallback.
 *
 * @param cacheKey  Include the content version (last_edited_time) so a cache
 *                  hit can never serve content older than the live page.
 *                  Omit to disable caching for this call.
 */
export async function notionRequest<T>(
  fn: () => Promise<T>,
  ctx: NotionContext = {},
  cacheKey?: string,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await takeSlot();
    try {
      const result = await fn();
      if (cacheKey) writeCache(cacheKey, result);
      return result;
    } catch (error) {
      lastError = error;
      const status = statusOf(error);
      const where = describe(ctx);
      if (!isRetryable(error) || attempt === MAX_ATTEMPTS) {
        console.error(
          `[notion] request failed (status ${status ?? "?"}) after ${attempt} attempt(s) ${where}: ${
            (error as Error)?.message ?? error
          }`,
        );
        break;
      }
      // Exponential backoff with full jitter: 1s, 2s, 4s, 8s (± jitter).
      const delay = Math.round(BASE_DELAY_MS * 2 ** (attempt - 1) * (0.5 + Math.random()));
      console.warn(
        `[notion] attempt ${attempt}/${MAX_ATTEMPTS} failed (status ${status ?? "?"}) ${where}; retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  if (cacheKey) {
    const cached = readCache<T>(cacheKey);
    if (cached !== undefined) {
      console.warn(`[notion] serving cached copy after repeated failures ${describe(ctx)}`);
      return cached;
    }
  }

  throw lastError;
}

/**
 * Run a whole multi-request operation, falling back to its cached result if
 * the operation fails outright. Individual requests inside `fn` should still
 * use notionRequest() for throttling and retries.
 */
export async function withCacheFallback<T>(
  cacheKey: string,
  fn: () => Promise<T>,
  ctx: NotionContext = {},
): Promise<T> {
  try {
    const result = await fn();
    writeCache(cacheKey, result);
    return result;
  } catch (error) {
    const cached = readCache<T>(cacheKey);
    if (cached !== undefined) {
      console.warn(
        `[notion] using cached copy after failure ${describe(ctx)}: ${(error as Error)?.message ?? error}`,
      );
      return cached;
    }
    throw error;
  }
}
