import { Resend } from "resend";

// In-memory rate limit store (per serverless instance).
// Best-effort: works for typical traffic on Vercel; not strictly shared across cold starts/regions.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const ipHits = new Map<string, number[]>();

const SITE_URL = "https://wmgsounds.com";
const LOGO_URL = `${SITE_URL}/wmg-logo-full.png`;

// Brand palette (inline only — email clients ignore <style>)
const COLOR_BG = "#0b0b0b"; // ink
const COLOR_PANEL = "#f6f1e7"; // cream/ivory
const COLOR_TEXT = "#1a1a1a";
const COLOR_MUTED = "#6b6357";
const COLOR_GOLD = "#b08a3e";
const COLOR_BORDER = "#e6dcc7";

type SubjectKey = "General" | "Press" | "Sync / Licensing" | "Demo Submission" | "Support";

const SUBJECT_TO_ENV: Record<string, string> = {
  General: "CONTACT_EMAIL_GENERAL",
  Press: "CONTACT_EMAIL_PRESS",
  "Sync / Licensing": "CONTACT_EMAIL_SYNC",
  "Demo Submission": "CONTACT_EMAIL_DEMOS",
  Support: "CONTACT_EMAIL_GENERAL",
};

const AUTO_RESPONSES: Record<string, { subject: string; body: string }> = {
  General: {
    subject: "We received your message",
    body: "Thanks for reaching out to WMG. We've received your message and someone from the team will be in touch soon.",
  },
  Press: {
    subject: "Your press enquiry has reached us",
    body: "Thank you for getting in touch. Press and interview enquiries are reviewed by our communications team and we'll come back to you within a few working days. For embargoed or time-sensitive requests, please reply to this email and flag the deadline.",
  },
  "Sync / Licensing": {
    subject: "Your sync enquiry has reached us",
    body: "Thanks for reaching out about sync and licensing. Our licensing team handles enquiries case by case — we'll review your request and respond within a few working days. If your project has a tight deadline, please reply to this email with details.",
  },
  "Demo Submission": {
    subject: "Your demo has reached us",
    body: "Thank you for sending your music to WMG. We listen to every submission, and although we can't reply individually to each one, please know that your work has reached us and will be heard. If we'd like to talk further, you'll hear back from us directly. We do not chase trends. We sign artists for the long-term, and we sign rarely.",
  },
  Support: {
    subject: "We received your message",
    body: "Thanks for reaching out to WMG. We've received your message and someone from the team will be in touch soon.",
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
  <body style="margin:0;padding:0;background:${COLOR_BG};font-family:Georgia,'Times New Roman',serif;color:${COLOR_TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR_BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLOR_PANEL};border:1px solid ${COLOR_BORDER};">
            <tr>
              <td align="center" style="padding:32px 32px 8px;">
                <a href="${SITE_URL}" style="text-decoration:none;border:0;outline:none;">
                  <img src="${LOGO_URL}" width="120" alt="WMG — Wareham Music Group" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:120px;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 32px;">
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 28px;">
                <hr style="border:0;border-top:1px solid ${COLOR_BORDER};margin:0 0 16px;" />
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="font-family:Georgia,'Times New Roman',serif;font-size:12px;color:${COLOR_MUTED};line-height:1.6;">
                      <a href="${SITE_URL}" style="text-decoration:none;border:0;">
                        <img src="${LOGO_URL}" width="72" alt="WMG" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:72px;margin:0 auto 8px;" />
                      </a>
                      <div style="letter-spacing:0.08em;text-transform:uppercase;font-size:11px;color:${COLOR_GOLD};">London · Music built to last.</div>
                      <div style="margin-top:6px;">
                        <a href="${SITE_URL}" style="color:${COLOR_MUTED};text-decoration:underline;">wmgsounds.com</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function notificationHtml(name: string, email: string, subject: string, message: string): string {
  const inner = `
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;color:${COLOR_TEXT};margin:0 0 6px;">New enquiry via wmgsounds.com</h1>
    <div style="letter-spacing:0.12em;text-transform:uppercase;font-size:11px;color:${COLOR_GOLD};margin-bottom:24px;">${escapeHtml(subject)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${COLOR_TEXT};">
      <tr><td style="padding:8px 0;color:${COLOR_MUTED};width:90px;">Name</td><td style="padding:8px 0;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:8px 0;color:${COLOR_MUTED};">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:${COLOR_TEXT};">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:${COLOR_MUTED};">Subject</td><td style="padding:8px 0;">${escapeHtml(subject)}</td></tr>
    </table>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid ${COLOR_BORDER};">
      <div style="letter-spacing:0.1em;text-transform:uppercase;font-size:11px;color:${COLOR_MUTED};margin-bottom:10px;">Message</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${COLOR_TEXT};white-space:pre-wrap;">${escapeHtml(message)}</div>
    </div>`;
  return emailShell(inner);
}

function notificationText(name: string, email: string, subject: string, message: string): string {
  return [
    "New enquiry via wmgsounds.com",
    `Subject: ${subject}`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
    "",
    "---",
    "WMG (Wareham Music Group)",
    "London · Music built to last.",
    SITE_URL,
  ].join("\n");
}

function autoResponseHtml(body: string): string {
  const inner = `
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${COLOR_TEXT};margin:0 0 18px;">${escapeHtml(body)}</p>
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${COLOR_MUTED};margin:24px 0 0;">— WMG (Wareham Music Group)</p>`;
  return emailShell(inner);
}

function autoResponseText(body: string): string {
  return [
    body,
    "",
    "— WMG (Wareham Music Group)",
    "",
    "---",
    "London · Music built to last.",
    SITE_URL,
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
      html: notificationHtml(name, email, subject, message),
      text: notificationText(name, email, subject, message),
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
      html: autoResponseHtml(auto.body),
      text: autoResponseText(auto.body),
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
