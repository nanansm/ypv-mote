import { WorkerMailer } from "worker-mailer";

/**
 * SMTP sidecar.
 *
 * worker-mailer reaches SMTP through `cloudflare:sockets`, a Workers built-in
 * that the OpenNext/esbuild pipeline cannot resolve when it is imported from
 * inside the Next.js server bundle. Keeping it in its own Worker sidesteps that
 * entirely: wrangler bundles this file directly and resolves the module fine.
 *
 * Reachable only through the MAILER service binding — it has no public URL.
 */
type SendRequest = {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
};

function isSendRequest(v: unknown): v is SendRequest {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.host === "string" &&
    typeof r.port === "number" &&
    typeof r.user === "string" &&
    typeof r.pass === "string" &&
    typeof r.fromEmail === "string" &&
    typeof r.to === "string" &&
    typeof r.subject === "string" &&
    typeof r.text === "string"
  );
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== "POST") {
      return Response.json({ error: "POST only" }, { status: 405 });
    }

    const body = await req.json().catch(() => null);
    if (!isSendRequest(body)) {
      return Response.json({ error: "Malformed send request" }, { status: 400 });
    }

    try {
      const mailer = await WorkerMailer.connect({
        host: body.host,
        port: body.port,
        // 465 is implicit TLS; 587 upgrades with STARTTLS after the greeting.
        secure: body.port === 465,
        startTls: body.port !== 465,
        credentials: { username: body.user, password: body.pass },
        authType: ["plain", "login"],
      });
      try {
        await mailer.send({
          from: { name: body.fromName || "YPV Switzerland", email: body.fromEmail },
          to: { email: body.to },
          subject: body.subject,
          text: body.text,
        });
      } finally {
        await mailer.close();
      }
      return Response.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error("[mailer] send failed:", message);
      return Response.json({ ok: false, error: message }, { status: 502 });
    }
  },
};
