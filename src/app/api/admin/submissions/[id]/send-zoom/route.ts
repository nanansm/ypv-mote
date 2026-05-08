export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/client";
import { renderTemplate } from "@/lib/email/templates";
import { getWebinarConfig } from "@/lib/config";
import { logEmail } from "@/lib/logging";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const submission = db.select().from(submissions).where(eq(submissions.id, id)).get();
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!submission.email) return NextResponse.json({ error: "No email on file" }, { status: 400 });

  const template = db.select().from(emailTemplates).where(eq(emailTemplates.key, "zoom_link")).get();
  if (!template) return NextResponse.json({ error: "zoom_link template not seeded" }, { status: 500 });

  const webinar = await getWebinarConfig();
  const vars: Record<string, string> = {
    name: submission.fullName ?? "",
    webinar_name: webinar.name,
    webinar_date: webinar.date || "TBD",
    zoom_link: webinar.zoomLink || "[Zoom link not configured]",
  };

  try {
    await sendEmail({
      to: submission.email,
      subject: renderTemplate(template.subject, vars),
      text: renderTemplate(template.bodyText, vars),
    });
    logEmail({ submissionId: id, templateKey: "zoom_link", toEmail: submission.email, status: "sent" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logEmail({ submissionId: id, templateKey: "zoom_link", toEmail: submission.email ?? "", status: "failed", errorMessage: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
