import { db } from "@/db";
import { submissions, syncLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSheetsClient } from "./client";

const SHEET_HEADERS = [
  "id", "submitted_at", "locale", "full_name", "email", "phone",
  "country", "date_of_birth", "age_at_submission",
  "vocational_training_completed", "interested_in_field",
  "english_level", "worked_abroad", "has_passport",
  "professional_experience", "diploma_in_english", "current_location",
  "eligibility_status", "rejection_reason_key", "extra_responses",
];

async function ensureHeaderRow(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>["sheets"],
  sheetId: string,
  tabName: string
): Promise<void> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A1:A1`,
    });
    const existingValue = res.data.values?.[0]?.[0];
    if (!existingValue) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tabName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [SHEET_HEADERS] },
      });
    }
  } catch (err) {
    console.warn("[sheets] Could not check/write header row:", err);
  }
}

export async function syncSubmissionToSheet(submissionId: string): Promise<void> {
  const row = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .get();

  if (!row) throw new Error(`Submission not found: ${submissionId}`);

  const { sheets, sheetId, tabName } = await getSheetsClient();

  await ensureHeaderRow(sheets, sheetId, tabName);

  const values = [
    [
      row.id,
      row.createdAt,
      row.locale,
      row.fullName ?? "",
      row.email ?? "",
      row.phone ?? "",
      row.country ?? "",
      row.dateOfBirth ?? "",
      row.ageAtSubmission?.toString() ?? "",
      row.vocationalTrainingCompleted?.toString() ?? "",
      row.interestedInField?.toString() ?? "",
      row.englishLevel ?? "",
      row.workedAbroad?.toString() ?? "",
      row.hasPassport ?? "",
      row.professionalExperience ?? "",
      row.diplomaInEnglish?.toString() ?? "",
      row.currentLocation ?? "",
      row.eligibilityStatus,
      row.rejectionReasonKey ?? "",
      row.extraResponses ?? "",
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  const syncedAt = new Date().toISOString();
  db.update(submissions)
    .set({ sheetSyncedAt: syncedAt, updatedAt: syncedAt })
    .where(eq(submissions.id, submissionId))
    .run();

  db.insert(syncLogs)
    .values({
      submissionId,
      service: "google_sheets",
      status: "success",
      createdAt: syncedAt,
    })
    .run();
}
