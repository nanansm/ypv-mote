import nodemailer from "nodemailer";
import { getSmtpConfig } from "@/lib/config";
import type { EmailPayload } from "./types";

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const cfg = await getSmtpConfig();

  if (!cfg.user || !cfg.pass) {
    console.warn("[email] SMTP credentials not configured — skipping send");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  await transporter.sendMail({
    from: cfg.fromEmail
      ? `"${cfg.fromName || "YPV Switzerland"}" <${cfg.fromEmail}>`
      : cfg.user,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
  });
}
