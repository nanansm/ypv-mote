import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/client";
import { renderTemplate } from "@/lib/email/templates";
import { getAdminNotificationEmail } from "@/lib/config";
import { syncSubmissionToSheet } from "@/lib/sheets/sync";
import { syncLogs } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      partialSubmissionId: string;
      englishLevel: string;
      workedAbroad: number;
      hasPassport: string;
      professionalExperience: string;
      diplomaInEnglish: number;
      currentLocation: string;
      extraResponses?: Record<string, string>;
    };

    const submission = db
      .select()
      .from(submissions)
      .where(eq(submissions.id, body.partialSubmissionId))
      .get();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Merge extra responses from screen step (already in DB) with section-3 extras
    const existingExtra: Record<string, string> = submission.extraResponses
      ? JSON.parse(submission.extraResponses) as Record<string, string>
      : {};
    const merged = { ...existingExtra, ...(body.extraResponses ?? {}) };
    const extraJson = Object.keys(merged).length > 0 ? JSON.stringify(merged) : null;

    db.update(submissions)
      .set({
        englishLevel: body.englishLevel,
        workedAbroad: body.workedAbroad,
        hasPassport: body.hasPassport,
        professionalExperience: body.professionalExperience,
        diplomaInEnglish: body.diplomaInEnglish,
        currentLocation: body.currentLocation,
        extraResponses: extraJson,
        updatedAt: now,
      })
      .where(eq(submissions.id, body.partialSubmissionId))
      .run();

    // Booking confirmation email is now sent on /api/sessions/book, not here.
    // (The user picks a session next, which has the price + date + reference required for the email.)

    // Admin notification (fire and forget)
    void sendAdminNotification(body.partialSubmissionId).catch((e) =>
      console.error("[api/submit] admin notification failed:", e)
    );

    // Google Sheets sync (fire and forget)
    void syncSubmissionToSheet(body.partialSubmissionId).catch((syncErr) => {
      console.error("[api/submit] sheets sync failed:", syncErr);
      db.insert(syncLogs)
        .values({
          submissionId: body.partialSubmissionId,
          service: "google_sheets",
          status: "failed",
          errorMessage: String(syncErr),
          createdAt: new Date().toISOString(),
        })
        .run();
    });

    return NextResponse.json({ submissionId: body.partialSubmissionId });
  } catch (err) {
    console.error("[api/submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendAdminNotification(submissionId: string) {
  const submission = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .get();

  if (!submission) return;

  const adminEmail = await getAdminNotificationEmail();
  if (!adminEmail) return;

  const template = db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, "admin_notification"))
    .get();

  if (!template) return;

  const vars: Record<string, string> = {
    submission_id: submission.id,
    name: submission.fullName ?? "",
    email: submission.email ?? "",
    country: submission.country ?? "",
    age: submission.ageAtSubmission?.toString() ?? "",
    eligibility_status: submission.eligibilityStatus,
    rejection_reason: submission.rejectionReasonKey ?? "N/A",
  };

  const subject = renderTemplate(template.subject, vars);
  const text = renderTemplate(template.bodyText, vars);

  await sendEmail({ to: adminEmail, subject, text });
}
