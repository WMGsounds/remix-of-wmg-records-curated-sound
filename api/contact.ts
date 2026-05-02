import { Resend } from "resend";


// In-memory rate limit store (per serverless instance).
// Best-effort: works for typical traffic on Vercel; not strictly shared across cold starts/regions.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const ipHits = new Map<string, number[]>();

const SITE_URL = "https://wmgsounds.com";
const LOGO_URL = `${SITE_URL}/wmg-logo-full.png`;

// Brand palette (inline only — email clients ignore <style>)
const COLOR_OUTER = "#0f0f0f"; // outer wrapper / dark canvas
const COLOR_BAND = "#1a1a1a"; // header & footer bands
const COLOR_PANEL = "#f5f0e8"; // warm cream content area
const COLOR_TEXT = "#1a1a1a"; // dark ink on cream
const COLOR_MUTED = "#6b6357";
const COLOR_FOOT_MUTED = "#7a7a7a";
const COLOR_GOLD = "#c9a84c";
const COLOR_CREAM_LINK = "#f5f0e8";
const COLOR_BORDER = "#e6dcc7";

type SubjectKey = "General" | "Press" | "Sync / Licensing" | "Demo Submission" | "Support";

const SUBJECT_TO_ENV: Record<string, string> = {
  General: "CONTACT_EMAIL_GENERAL",
  Press: "CONTACT_EMAIL_PRESS",
  "Sync / Licensing": "CONTACT_EMAIL_SYNC",
  "Demo Submission": "CONTACT_EMAIL_DEMOS",
  Support: "CONTACT_EMAIL_GENERAL",
};

const AUTO_RESPONSES: Record<string, { subject: string; body: string; eyebrow: string }> = {
  General: {
    subject: "We received your message",
    body: "Thanks for reaching out to WMG. We've received your message and someone from the team will be in touch soon.",
    eyebrow: "General Enquiry Received",
  },
  Press: {
    subject: "Your press enquiry has reached us",
    body: "Thank you for getting in touch. Press and interview enquiries are reviewed by our communications team and we'll come back to you within a few working days. For embargoed or time-sensitive requests, please reply to this email and flag the deadline.",
    eyebrow: "Press Enquiry Received",
  },
  "Sync / Licensing": {
    subject: "Your sync enquiry has reached us",
    body: "Thanks for reaching out about sync and licensing. Our licensing team handles enquiries case by case — we'll review your request and respond within a few working days. If your project has a tight deadline, please reply to this email with details.",
    eyebrow: "Sync Enquiry Received",
  },
  "Demo Submission": {
    subject: "Your demo has reached us",
    body: "Thank you for sending your music to WMG. We listen to every submission, and although we can't reply individually to each one, please know that your work has reached us and will be heard. If we'd like to talk further, you'll hear back from us directly. We do not chase trends. We sign artists for the long-term, and we sign rarely.",
    eyebrow: "Demo Submission Received",
  },
  Support: {
    subject: "We received your message",
    body: "Thanks for reaching out to WMG. We've received your message and someone from the team will be in touch soon.",
    eyebrow: "General Enquiry Received",
  },
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;

function getClientIp(req: any): string {
  const xff = req.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length > 0) return xff[0];
  const real = req.headers?.["x-real-ip"];
  if (typeof real === "string") return real;
  return req.socket?.remoteAddress ?? "unknown";
}

function rateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (ipHits.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((hits[0] + RATE_LIMIT_WINDOW_MS - now) / 1000);
    ipHits.set(ip, hits);
    return { ok: false, retryAfter };
  }
  hits.push(now);
  ipHits.set(ip, hits);
  // Light cleanup
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      const filtered = v.filter((t) => t > windowStart);
      if (filtered.length === 0) ipHits.delete(k);
      else ipHits.set(k, filtered);
    }
  }
  return { ok: true };
}

function emailShell(innerHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>WMG</title>
  </head>
  <body style="margin:0;padding:0;background:${COLOR_OUTER};font-family:Georgia,'Times New Roman',serif;color:${COLOR_TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR_OUTER};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${COLOR_PANEL};color-scheme:light only;">
            <!-- Header band -->
            <tr>
              <td align="center" style="background:${COLOR_BAND};padding:32px 24px;">
                <a href="${SITE_URL}" style="text-decoration:none;border:0;outline:none;">
                  <img src="${LOGO_URL}" width="225" alt="WMG — Wareham Music Group" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:225px;margin:0 auto;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="background:${COLOR_BAND};line-height:0;font-size:0;">
                <div style="height:1px;background:${COLOR_GOLD};line-height:1px;font-size:1px;">&nbsp;</div>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="background:${COLOR_PANEL};padding:32px 40px;">
                ${innerHtml}
              </td>
            </tr>
            <!-- Gold rule -->
            <tr>
              <td style="background:${COLOR_PANEL};line-height:0;font-size:0;padding:0 40px;">
                <div style="height:1px;background:${COLOR_GOLD};line-height:1px;font-size:1px;">&nbsp;</div>
              </td>
            </tr>
            <!-- Footer band -->
            <tr>
              <td align="center" style="background:${COLOR_BAND};padding:28px 24px 12px;">
                <div style="letter-spacing:0.18em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:${COLOR_GOLD};">London · Music built to last.</div>
                <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:13px;">
                  <a href="${SITE_URL}" style="color:${COLOR_CREAM_LINK};text-decoration:none;">wmgsounds.com</a>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="background:${COLOR_BAND};padding:0 24px 24px;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;color:${COLOR_FOOT_MUTED};line-height:1.6;">© ${new Date().getFullYear()} Wareham Music Group. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function eyebrow(label: string): string {
  return `<div style="letter-spacing:0.2em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:${COLOR_GOLD};margin:0 0 22px;">${escapeHtml(label)}</div>`;
}

function notificationHtml(
  name: string,
  email: string,
  subject: string,
  message: string,
  demo?: { url: string; filename: string; size: number } | null,
): string {
  const demoBlock = demo
    ? `
    <div style="margin-top:24px;padding:18px 20px;border:1px solid ${COLOR_GOLD};background:#fffaf0;">
      <div style="letter-spacing:0.18em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:${COLOR_GOLD};margin-bottom:10px;">Demo File Attached</div>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${COLOR_TEXT};margin:0 0 6px;">${escapeHtml(demo.filename)}${demo.size > 0 ? ` <span style="color:${COLOR_MUTED};">· ${(demo.size / (1024 * 1024)).toFixed(2)} MB</span>` : ""}</p>
      <p style="margin:10px 0 0;"><a href="${escapeHtml(demo.url)}" style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${COLOR_TEXT};text-decoration:underline;" target="_blank" rel="noopener">Download demo file →</a></p>
    </div>`
    : "";
  const inner = `
    ${eyebrow(`${subject} · New Enquiry`)}
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;color:${COLOR_TEXT};margin:0 0 22px;text-align:left;">New enquiry via wmgsounds.com</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${COLOR_TEXT};">
      <tr><td style="padding:8px 0;color:${COLOR_MUTED};width:90px;">Name</td><td style="padding:8px 0;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:8px 0;color:${COLOR_MUTED};">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:${COLOR_TEXT};">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:${COLOR_MUTED};">Subject</td><td style="padding:8px 0;">${escapeHtml(subject)}</td></tr>
    </table>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid ${COLOR_BORDER};">
      <div style="letter-spacing:0.18em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:${COLOR_MUTED};margin-bottom:12px;">Message</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${COLOR_TEXT};white-space:pre-wrap;text-align:left;">${escapeHtml(message)}</div>
    </div>
    ${demoBlock}`;
  return emailShell(inner);
}

function notificationText(
  name: string,
  email: string,
  subject: string,
  message: string,
  demo?: { url: string; filename: string; size: number } | null,
): string {
  const lines = [
    "New enquiry via wmgsounds.com",
    `Subject: ${subject}`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
  ];
  if (demo) {
    lines.push("", "Demo file attached:", demo.filename, demo.url);
  }
  lines.push(
    "",
    "---",
    "WMG (Wareham Music Group)",
    "London · Music built to last.",
    SITE_URL,
    `© ${new Date().getFullYear()} Wareham Music Group. All rights reserved.`,
  );
  return lines.join("\n");
}

function autoResponseHtml(body: string, eyebrowLabel: string): string {
  const inner = `
    ${eyebrow(eyebrowLabel)}
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${COLOR_TEXT};margin:0 0 22px;text-align:left;">${escapeHtml(body)}</p>
    <p style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:${COLOR_MUTED};margin:28px 0 0;text-align:left;">— WMG (Wareham Music Group)</p>`;
  return emailShell(inner);
}

function autoResponseText(body: string, eyebrowLabel: string): string {
  return [
    eyebrowLabel.toUpperCase(),
    "",
    body,
    "",
    "— WMG (Wareham Music Group)",
    "",
    "---",
    "London · Music built to last.",
    SITE_URL,
    `© ${new Date().getFullYear()} Wareham Music Group. All rights reserved.`,
  ].join("\n");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const honeypot = typeof body.website === "string" ? body.website.trim() : "";

    // Demo upload (Uploadcare URL — uploaded directly from the browser)
    let demo: { url: string; filename: string; size: number } | null = null;
    if (typeof body.demoUrl === "string" && body.demoUrl.length > 0) {
      const url = body.demoUrl.trim();
      const isUploadcare = /^https:\/\/(ucarecdn\.com|[a-z0-9-]+\.ucr\.io)\//i.test(url);
      if (!isUploadcare) {
        return res.status(400).json({ error: "Invalid demo file URL" });
      }
      const filename =
        typeof body.demoFilename === "string" && body.demoFilename.length > 0
          ? body.demoFilename.slice(0, 200)
          : "demo";
      const size = typeof body.demoSize === "number" && isFinite(body.demoSize) ? body.demoSize : 0;
      demo = { url, filename, size };
    }

    // Honeypot — silently succeed
    if (honeypot.length > 0) {
      return res.status(200).json({ ok: true });
    }

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (name.length > 100) return res.status(400).json({ error: "Name too long" });
    if (message.length > 5000) return res.status(400).json({ error: "Message too long" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email address" });

    // Rate limit
    const ip = getClientIp(req);
    const rl = rateLimit(ip);
    if (!rl.ok) {
      if (rl.retryAfter) res.setHeader("Retry-After", String(rl.retryAfter));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    // Resolve recipient
    const envKey = SUBJECT_TO_ENV[subject] ?? "CONTACT_EMAIL_GENERAL";
    const recipient = process.env[envKey] ?? process.env.CONTACT_EMAIL_GENERAL;
    if (!recipient) {
      console.error(`[contact] Missing env: ${envKey}`);
      return res.status(500).json({ error: "Server email is not configured" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[contact] Missing RESEND_API_KEY");
      return res.status(500).json({ error: "Server email is not configured" });
    }

    const resend = new Resend(apiKey);

    // Notification (to label)
    const notifyResult = await resend.emails.send({
      from: "WMG Website <noreply@wmgsounds.com>",
      to: [recipient],
      replyTo: email,
      subject: `WMG: ${subject} — from ${name}`,
      html: notificationHtml(name, email, subject, message, demo),
      text: notificationText(name, email, subject, message, demo),
    });

    if ((notifyResult as any)?.error) {
      console.error("[contact] Notification send failed:", (notifyResult as any).error);
      return res.status(502).json({ error: "Failed to send message" });
    }

    // Auto-response (to submitter)
    const auto = AUTO_RESPONSES[subject] ?? AUTO_RESPONSES.Support;
    const autoResult = await resend.emails.send({
      from: "WMG (Wareham Music Group) <noreply@wmgsounds.com>",
      to: [email],
      subject: auto.subject,
      html: autoResponseHtml(auto.body, auto.eyebrow),
      text: autoResponseText(auto.body, auto.eyebrow),
    });

    if ((autoResult as any)?.error) {
      // Notification already sent; log but don't fail the user request
      console.error("[contact] Auto-response send failed:", (autoResult as any).error);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
