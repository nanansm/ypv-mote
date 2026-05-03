import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { sessionBookings, submissions, webinarSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  activeBookingForSubmission,
  expiryWindowMs,
  generateBookingReference,
} from "@/lib/sessions";
import { sendBookingConfirmation } from "@/lib/sessions/email";
import { wisePersonalProvider } from "@/lib/payment/wise-personal";
import { syncSubmissionToSheet } from "@/lib/sheets/sync";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      submission_id?: string;
      session_id?: string;
    };

    if (!body.submission_id || !body.session_id) {
      return NextResponse.json(
        { error: "submission_id and session_id are required" },
        { status: 400 }
      );
    }

    const submission = db
      .select()
      .from(submissions)
      .where(eq(submissions.id, body.submission_id))
      .get();
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }
    if (submission.eligibilityStatus !== "passed") {
      return NextResponse.json(
        { error: "Submission is not eligible" },
        { status: 403 }
      );
    }

    const session = db
      .select()
      .from(webinarSessions)
      .where(eq(webinarSessions.id, body.session_id))
      .get();
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "published") {
      return NextResponse.json(
        { error: "Session is not open for booking" },
        { status: 400 }
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (session.date < today) {
      return NextResponse.json(
        { error: "Session date is in the past" },
        { status: 400 }
      );
    }

    const existing = activeBookingForSubmission(body.submission_id);
    if (existing) {
      return NextResponse.json(
        {
          error: "Submission already has an active booking",
          booking_id: existing.id,
          booking_reference: existing.bookingReference,
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + expiryWindowMs()).toISOString();
    const reference = generateBookingReference(
      submission.fullName ?? "",
      session.id
    );
    const bookingId = uuidv4();

    db.insert(sessionBookings)
      .values({
        id: bookingId,
        submissionId: body.submission_id,
        sessionId: body.session_id,
        bookingReference: reference,
        paymentStatus: "pending",
        expiresAt,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .run();

    const wiseDetails = await wisePersonalProvider.getPaymentDetails();
    const wiseBlock = wisePersonalProvider.formatDetailsBlock(wiseDetails);

    // Send confirmation email (best-effort, fire and forget so booking still
    // succeeds if SMTP is down).
    void sendBookingConfirmation(bookingId).catch((emailErr) => {
      console.error("[api/sessions/book] confirmation email failed:", emailErr);
    });

    // Re-sync the submission row to Google Sheets so session date + booking
    // reference end up in the spreadsheet.
    void syncSubmissionToSheet(body.submission_id).catch((syncErr) => {
      console.error("[api/sessions/book] sheets sync failed:", syncErr);
    });

    return NextResponse.json({
      booking_id: bookingId,
      booking_reference: reference,
      expires_at: expiresAt,
      wise_instructions: {
        details_block: wiseBlock,
        reference_instruction: wiseDetails.referenceInstruction,
        amount_usd: session.priceUsd,
      },
    });
  } catch (err) {
    console.error("[api/sessions/book]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
