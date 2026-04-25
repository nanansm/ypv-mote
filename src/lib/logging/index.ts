import { db } from "@/db";
import { emailLogs, syncLogs } from "@/db/schema";

export function logEmail({
  submissionId,
  templateKey,
  toEmail,
  status,
  errorMessage,
}: {
  submissionId?: string;
  templateKey: string;
  toEmail: string;
  status: "sent" | "failed";
  errorMessage?: string;
}) {
  db.insert(emailLogs)
    .values({
      submissionId: submissionId ?? null,
      templateKey,
      toEmail,
      status,
      errorMessage: errorMessage ?? null,
      createdAt: new Date().toISOString(),
    })
    .run();
}

export function logSync({
  submissionId,
  service,
  action,
  status,
  errorMessage,
}: {
  submissionId: string;
  service: string;
  action?: string;
  status: "success" | "failed";
  errorMessage?: string;
}) {
  db.insert(syncLogs)
    .values({
      submissionId,
      service,
      action: action ?? "initial",
      status,
      errorMessage: errorMessage ?? null,
      createdAt: new Date().toISOString(),
    })
    .run();

  if (status === "failed") {
    process.stderr.write(
      `[sheets-sync-error] submission=${submissionId} error=${errorMessage ?? "unknown"}\n`
    );
  }
}
