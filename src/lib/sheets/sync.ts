import { db } from "@/db";
import {
  sessionBookings,
  submissions,
  syncLogs,
  webinarSessions,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSheetsClient } from "./client";

const SHEET_HEADERS = [
  "id", "submitted_at", "locale", "full_name", "email", "phone",
  "country", "date_of_birth", "age_at_submission",
  "vocational_training_completed", "interested_in_field",
  "english_level", "worked_abroad", "has_passport",
  "professional_experience", "diploma_in_english", "current_location",
  "eligibility_status", "rejection_reason_key", "extra_responses",
  "session_date", "booking_reference",
];

async function ensureHeaderRow(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>["sheets"],
  sheetId: string,
  tabName: string
): Promise<void> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A1:${columnLetter(SHEET_HEADERS.length)}1`,
    });
    const existingRow = res.data.values?.[0] ?? [];
    const isUpToDate =
      existingRow.length === SHEET_HEADERS.length &&
      SHEET_HEADERS.every((h, i) => existingRow[i] === h);
    if (!isUpToDate) {
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

function columnLetter(colNumber: number): string {
  let s = "";
  let n = colNumber;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s || "A";
}

async function findExistingRow(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>["sheets"],
  sheetId: string,
  tabName: string,
  submissionId: string
): Promise<number | null> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A:A`,
    });
    const rows = res.data.values ?? [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i]?.[0] === submissionId) return i + 1;
    }
    return null;
  } catch (err) {
    console.warn("[sheets] Could not search for existing row:", err);
    return null;
  }
}

function loadActiveBookingForSheet(submissionId: string): {
  sessionDate: string;
  bookingReference: string;
} | null {
  const row = db
    .select({
      booking: sessionBookings,
      session: webinarSessions,
    })
    .from(sessionBookings)
    .leftJoin(webinarSessions, eq(sessionBookings.sessionId, webinarSessions.id))
    .where(
      and(
        eq(sessionBookings.submissionId, submissionId),
        sql`${sessionBookings.paymentStatus} NOT IN ('expired', 'cancelled')`
      )
    )
    .get();
  if (!row || !row.session) return null;
  return {
    sessionDate: row.session.date,
    bookingReference: row.booking.bookingReference,
  };
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

  const bookingInfo = loadActiveBookingForSheet(submissionId);

  const values = [
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
    bookingInfo?.sessionDate ?? "",
    bookingInfo?.bookingReference ?? "",
  ];

  const lastCol = columnLetter(SHEET_HEADERS.length);
  const existingRowIndex = await findExistingRow(
    sheets,
    sheetId,
    tabName,
    submissionId
  );

  if (existingRowIndex) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A${existingRowIndex}:${lastCol}${existingRowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [values] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [values] },
    });
  }

  const syncedAt = new Date().toISOString();
  db.update(submissions)
    .set({ sheetSyncedAt: syncedAt, updatedAt: syncedAt })
    .where(eq(submissions.id, submissionId))
    .run();

  db.insert(syncLogs)
    .values({
      submissionId,
      service: "google_sheets",
      action: existingRowIndex ? "update" : "initial",
      status: "success",
      createdAt: syncedAt,
    })
    .run();
}
