export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq, and, like, isNull, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const eligibility = sp.get("eligibility");
  const paymentStatus = sp.get("paymentStatus");
  const country = sp.get("country");
  const search = sp.get("search");

  const conditions = [isNull(submissions.deletedAt)];
  if (eligibility) conditions.push(eq(submissions.eligibilityStatus, eligibility));
  if (paymentStatus) conditions.push(eq(submissions.paymentStatus, paymentStatus));
  if (country) conditions.push(eq(submissions.country, country));
  if (search) {
    const term = `%${search}%`;
    conditions.push(sql`(${submissions.fullName} LIKE ${term} OR ${submissions.email} LIKE ${term})`);
  }

  const rows = db
    .select()
    .from(submissions)
    .where(and(...conditions))
    .orderBy(submissions.createdAt)
    .all();

  const headers = [
    "id", "locale", "full_name", "email", "phone", "country",
    "date_of_birth", "age_at_submission", "vocational_training_completed",
    "interested_in_field", "english_level", "worked_abroad", "has_passport",
    "professional_experience", "diploma_in_english", "current_location",
    "eligibility_status", "rejection_reason_key", "payment_status",
    "payment_verified_at", "email_sent_at", "sheet_synced_at", "created_at",
  ];

  const csvRows = rows.map((r) =>
    [
      r.id, r.locale, r.fullName, r.email, r.phone, r.country,
      r.dateOfBirth, r.ageAtSubmission, r.vocationalTrainingCompleted,
      r.interestedInField, r.englishLevel, r.workedAbroad, r.hasPassport,
      r.professionalExperience, r.diplomaInEnglish, r.currentLocation,
      r.eligibilityStatus, r.rejectionReasonKey, r.paymentStatus,
      r.paymentVerifiedAt, r.emailSentAt, r.sheetSyncedAt, r.createdAt,
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [headers.join(","), ...csvRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="submissions-${Date.now()}.csv"`,
    },
  });
}
