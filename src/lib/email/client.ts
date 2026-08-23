import { getSmtpConfig } from "@/lib/config";
import type { EmailPayload } from "./types";

/** Cloudflare's runtime identifies itself here. Node leaves userAgent unset. */
function onCloudflareWorkers(): boolean {
  return (
    typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers"
  );
}

type SmtpConfig = Awaited<ReturnType<typeof getSmtpConfig>>;

function fromHeader(cfg: SmtpConfig): { name: string; email: string } {
  return {
    name: cfg.fromName || "YPV Switzerland",
    email: cfg.fromEmail || cfg.user,
  };
}

/**
 * Two runtimes, two transports. Node keeps nodemailer. Workers cannot run it
 * (it needs node:net/tls) and cannot bundle worker-mailer either, because that
 * library imports the cloudflare:sockets built-in and the OpenNext esbuild pass
 * refuses to resolve it — so on Workers the send is handed to the ypv-mailer
 * sidecar over a service binding, which talks SMTP on our behalf.
 *
 * Gmail on port 587 with STARTTLS was proven end-to-end from a real Worker
 * before this migration started; Cloudflare blocks port 25 only.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const cfg = await getSmtpConfig();

  if (!cfg.user || !cfg.pass) {
    console.warn("[email] SMTP credentials not configured — skipping send");
    return;
  }

  const from = fromHeader(cfg);

  if (onCloudflareWorkers()) {
    const { getMailerBinding } = await import("./mailer-binding");
    const mailer = getMailerBinding();
    if (!mailer) throw new Error("MAILER service binding is not available");

    const res = await mailer.fetch("https://mailer.internal/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        pass: cfg.pass,
        fromName: from.name,
        fromEmail: from.email,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Mailer worker rejected the send (${res.status}): ${detail}`);
    }
    return;
  }

  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  await transporter.sendMail({
    from: `"${from.name}" <${from.email}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
  });
}
