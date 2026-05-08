export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/client";
import { renderTemplate } from "@/lib/email/templates";
import { wisePersonalProvider } from "@/lib/payment/wise-personal";
import { getWebinarConfig, getAdminNotificationEmail } from "@/lib/config";
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

  try {
    const [wiseDetails, webinar, adminEmail] = await Promise.all([
      wisePersonalProvider.getPaymentDetails(),
      getWebinarConfig(),
      getAdminNotificationEmail(),
    ]);
    const detailsBlock = wisePersonalProvider.formatDetailsBlock(wiseDetails);
    const template = db.select().from(emailTemplates).where(eq(emailTemplates.key, "eligible_participant")).get();
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 500 });

    const vars: Record<string, string> = {
      name: submission.fullName ?? "",
      webinar_name: webinar.name,
      webinar_price: webinar.price,
      webinar_date: webinar.date || "TBD",
      wise_details_block: detailsBlock,
      reference_instruction: wiseDetails.referenceInstruction,
      admin_email: adminEmail,
    };

    await sendEmail({
      to: submission.email,
      subject: renderTemplate(template.subject, vars),
      text: renderTemplate(template.bodyText, vars),
    });

    logEmail({ submissionId: id, templateKey: "eligible_participant", toEmail: submission.email, status: "sent" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logEmail({ submissionId: id, templateKey: "eligible_participant", toEmail: submission.email ?? "", status: "failed", errorMessage: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
