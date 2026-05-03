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

type DemoFile = { label: string; url: string; filename: string; size: number };

function notificationHtml(
  name: string,
  email: string,
  subject: string,
  message: string,
  demos?: DemoFile[] | null,
): string {
  const demoBlock = demos && demos.length > 0
    ? `
    <div style="margin-top:24px;padding:18px 20px;border:1px solid ${COLOR_GOLD};background:#fffaf0;">
      <div style="letter-spacing:0.18em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:${COLOR_GOLD};margin-bottom:10px;">Demo File${demos.length > 1 ? "s" : ""} Attached</div>
      ${demos
        .map(
          (d) => `
      <div style="margin-bottom:14px;">
        <div style="letter-spacing:0.18em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;font-size:10px;color:${COLOR_MUTED};margin-bottom:4px;">${escapeHtml(d.label)}</div>
        <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${COLOR_TEXT};margin:0 0 6px;">${escapeHtml(d.filename)}${d.size > 0 ? ` <span style="color:${COLOR_MUTED};">· ${(d.size / (1024 * 1024)).toFixed(2)} MB</span>` : ""}</p>
        <p style="margin:6px 0 0;"><a href="${escapeHtml(d.url)}" style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${COLOR_TEXT};text-decoration:underline;" target="_blank" rel="noopener">Download ${escapeHtml(d.label)} →</a></p>
      </div>`,
        )
        .join("")}
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
  demos?: DemoFile[] | null,
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
  if (demos && demos.length > 0) {
    lines.push("", "Demo files attached:");
    for (const d of demos) {
      lines.push("", `${d.label}: ${d.filename}`, d.url);
    }
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

async function readRawBody(req: any): Promise<string> {
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: any) => {
      data += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body: any = {};
    try {
      if (req.body && typeof req.body === "object") {
        body = req.body;
      } else if (typeof req.body === "string" && req.body.length > 0) {
        body = JSON.parse(req.body);
      } else {
        const raw = await readRawBody(req);
        body = raw ? JSON.parse(raw) : {};
      }
    } catch (parseErr) {
      console.error("[contact] Body parse failed:", parseErr);
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    console.log("[contact] Received submission", {
      hasName: !!body?.name,
      hasEmail: !!body?.email,
      subject: body?.subject,
      hasMessage: !!body?.message,
      demoCount: Array.isArray(body?.demos) ? body.demos.length : (body?.demoUrl ? 1 : 0),
    });
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const honeypot = typeof body.website === "string" ? body.website.trim() : "";

    // Demo uploads (Uploadcare URLs — uploaded directly from the browser)
    const demos: DemoFile[] = [];
    const rawDemos: any[] = Array.isArray(body.demos)
      ? body.demos
      : (typeof body.demoUrl === "string" && body.demoUrl.length > 0
          ? [{ label: "Demo", url: body.demoUrl, filename: body.demoFilename, size: body.demoSize }]
          : []);
    for (let i = 0; i < rawDemos.length && demos.length < 3; i++) {
      const d = rawDemos[i];
      if (!d || typeof d.url !== "string" || d.url.length === 0) continue;
      const url = d.url.trim();
      if (!/^https:\/\//i.test(url)) {
        return res.status(400).json({ error: "Invalid demo file URL" });
      }
      const filename =
        typeof d.filename === "string" && d.filename.length > 0
          ? d.filename.slice(0, 200)
          : "demo";
      const size = typeof d.size === "number" && isFinite(d.size) ? d.size : 0;
      const label = typeof d.label === "string" && d.label.length > 0 ? d.label.slice(0, 40) : `Demo ${demos.length + 1}`;
      demos.push({ label, url, filename, size });
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

    let notifyResult: any;
    try {
      notifyResult = await resend.emails.send({
        from: "WMG Website <noreply@wmgsounds.com>",
        to: [recipient],
        replyTo: email,
        subject: `WMG: ${subject} — from ${name}`,
        html: notificationHtml(name, email, subject, message, demo),
        text: notificationText(name, email, subject, message, demo),
      });
    } catch (sendErr: any) {
      console.error("[contact] Notification threw:", sendErr?.message || sendErr, sendErr?.stack);
      return res.status(502).json({ error: "Failed to send message", detail: sendErr?.message ?? String(sendErr) });
    }

    if (notifyResult?.error) {
      console.error("[contact] Notification send failed:", JSON.stringify(notifyResult.error));
      return res.status(502).json({ error: "Failed to send message", detail: notifyResult.error?.message ?? "resend_error" });
    }
    console.log("[contact] Notification sent", { id: notifyResult?.data?.id });

    // Auto-response (to submitter)
    const auto = AUTO_RESPONSES[subject] ?? AUTO_RESPONSES.Support;
    try {
      const autoResult = await resend.emails.send({
        from: "WMG (Wareham Music Group) <noreply@wmgsounds.com>",
        to: [email],
        subject: auto.subject,
        html: autoResponseHtml(auto.body, auto.eyebrow),
        text: autoResponseText(auto.body, auto.eyebrow),
      });
      if (autoResult?.error) {
        console.error("[contact] Auto-response send failed:", JSON.stringify(autoResult.error));
      } else {
        console.log("[contact] Auto-response sent", { id: autoResult?.data?.id });
      }
    } catch (autoErr: any) {
      console.error("[contact] Auto-response threw:", autoErr?.message || autoErr, autoErr?.stack);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[contact] Unexpected error:", err?.message || err, err?.stack);
    return res.status(500).json({ error: "Unexpected server error", detail: err?.message ?? String(err) });
  }
}
