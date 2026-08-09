/**
 * Daily scheduled rebuild.
 *
 * Why this exists: the future-date publish gate (api/notion/_schedule.ts) is
 * evaluated at BUILD time, and the site is fully pre-rendered. Without a
 * scheduled build, a release whose date passes overnight would not appear
 * until somebody happens to deploy. This endpoint is called by the Vercel cron
 * schedule declared in vercel.json and fires a Vercel Deploy Hook, which
 * triggers a production build -> fresh pre-render + fresh sitemap.xml.
 *
 * Required environment variables (Vercel project settings):
 *   VERCEL_DEPLOY_HOOK_URL  the deploy hook created under
 *                           Settings -> Git -> Deploy Hooks (production branch)
 *   CRON_SECRET             optional; when set, Vercel sends it automatically
 *                           as `Authorization: Bearer <CRON_SECRET>` and this
 *                           handler rejects anything else.
 *
 * Manual verification: GET /api/cron/rebuild?token=<CRON_SECRET>
 */

type CronRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};

type CronResponse = {
  status: (code: number) => { json: (body: unknown) => void };
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function handler(req: CronRequest, res: CronResponse) {
  const route = "/api/cron/rebuild";
  const secret = process.env.CRON_SECRET;
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (secret) {
    const auth = first(req.headers?.authorization) ?? "";
    const token = first(req.query?.token) ?? "";
    if (auth !== `Bearer ${secret}` && token !== secret) {
      console.warn("[cron] Unauthorized rebuild attempt", { route });
      res.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }
  }

  if (!hookUrl) {
    console.error("[cron] VERCEL_DEPLOY_HOOK_URL is not set", { route });
    res.status(500).json({
      ok: false,
      error: "VERCEL_DEPLOY_HOOK_URL is not set. Create a Vercel Deploy Hook and add it as an env var.",
    });
    return;
  }

  const triggeredAt = new Date().toISOString();
  try {
    const r = await fetch(hookUrl, { method: "POST" });
    const body = await r.text();
    if (!r.ok) {
      console.error("[cron] Deploy hook failed", { route, status: r.status, body });
      res.status(502).json({ ok: false, triggeredAt, status: r.status, body });
      return;
    }
    console.log("[cron] Deploy hook triggered", { route, triggeredAt, status: r.status, body });
    res.status(200).json({ ok: true, triggeredAt, status: r.status, response: body });
  } catch (error) {
    console.error("[cron] Deploy hook request threw", { route, error: String(error) });
    res.status(500).json({ ok: false, triggeredAt, error: String(error) });
  }
}
