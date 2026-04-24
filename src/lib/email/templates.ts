import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export function renderTemplate(
  body: string,
  vars: Record<string, string>
): string {
  return body.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export async function getTemplate(
  key: string
): Promise<{ subject: string; bodyText: string } | null> {
  const row = db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, key))
    .get();
  if (!row) return null;
  return { subject: row.subject, bodyText: row.bodyText };
}
