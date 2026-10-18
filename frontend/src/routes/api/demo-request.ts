import { createFileRoute } from "@tanstack/react-router";

import { CONTACT } from "@/data/site";

/**
 * Book-a-Demo endpoint. Runs as a Vercel serverless function (no separate backend).
 * Env vars (Vercel → Settings → Environment Variables, NOT prefixed with VITE_):
 *   BREVO_API_KEY         secret API key from Brevo
 *   BREVO_SENDER_EMAIL    verified sender in Brevo (e.g. hello@syntrixa360.com)
 *   BREVO_SENDER_NAME     optional, default "Syntrixa Website"
 *   DEMO_NOTIFICATION_TO  optional, default support@syntrixa360.com
 */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Best-effort rate limit (per warm serverless instance). For stronger protection use Vercel Firewall.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

async function brevo(apiKey: string, body: unknown) {
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": apiKey, accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Brevo HTTP ${res.status}`);
}

export const Route = createFileRoute("/api/demo-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["BREVO_API_KEY"];
        const senderEmail = process.env["BREVO_SENDER_EMAIL"];
        if (!apiKey || !senderEmail) {
          return json({ detail: `Demo booking is not configured yet. Please email ${CONTACT.supportEmail}.` }, 503);
        }

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (limited(ip)) return json({ detail: "Too many requests. Please try again later." }, 429);

        let raw: Record<string, unknown>;
        try {
          raw = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ detail: "Invalid request." }, 400);
        }
        if (raw["website"]) return json({ request_id: "OK", status: "email_sent" }, 201); // honeypot: silently drop bots

        const f = (k: string, max: number) => String(raw[k] ?? "").trim().slice(0, max);
        const d = {
          name: f("name", 120),
          email: f("email", 254),
          company: f("company", 160),
          phone: f("phone", 30),
          industry: f("industry", 60),
          team_size: f("team_size", 20),
          message: f("message", 2000),
        };
        if (d.name.length < 2 || !EMAIL_RE.test(d.email) || !d.company || d.phone.length < 7) {
          return json({ detail: "Please fill in name, valid email, company and phone." }, 422);
        }

        const id = `DMO-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;
        const when = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
        const s = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, esc(v)])) as typeof d;
        const sender = { name: process.env["BREVO_SENDER_NAME"] || "Syntrixa Website", email: senderEmail };

        try {
          await brevo(apiKey, {
            sender,
            to: [{ email: process.env["DEMO_NOTIFICATION_TO"] || CONTACT.supportEmail, name: "Syntrixa Support" }],
            replyTo: { email: d.email, name: d.name },
            subject: `New demo booking ${id} — ${d.company}`,
            htmlContent: `<h2>New Syntrixa demo request</h2>
<p><b>Request ID:</b> ${id}</p><p><b>Submitted:</b> ${when}</p>
<p><b>Name:</b> ${s.name}</p><p><b>Email:</b> ${s.email}</p>
<p><b>Company:</b> ${s.company}</p><p><b>Phone:</b> ${s.phone}</p>
<p><b>Industry:</b> ${s.industry}</p><p><b>Sales team size:</b> ${s.team_size}</p>
<p><b>Message:</b><br>${s.message || "Not provided"}</p>`,
          });
        } catch (e) {
          console.error("demo-request: notification failed", e instanceof Error ? e.message : e);
          return json({ detail: `Your request could not be sent right now. Please try again or email ${CONTACT.supportEmail}.` }, 502);
        }

        // Confirmation to the customer: best effort, never fails the request.
        try {
          await brevo(apiKey, {
            sender,
            to: [{ email: d.email, name: d.name }],
            replyTo: { email: CONTACT.supportEmail, name: "Syntrixa Support" },
            subject: "We received your Syntrixa demo request",
            htmlContent: `<p>Hi ${s.name},</p><p>Thanks for requesting a Syntrixa demo (ref ${id}). Our team will contact you shortly.</p>
<p>Questions? Email ${CONTACT.supportEmail} or call ${CONTACT.phoneDisplay}.</p><p>— Team Syntrixa</p>`,
          });
        } catch (e) {
          console.error("demo-request: confirmation failed", e instanceof Error ? e.message : e);
        }

        return json({ request_id: id, status: "email_sent", message: "Your demo request was sent successfully." }, 201);
      },
    },
  },
});
