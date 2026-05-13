export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessionBookings, submissions, webinarSessions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { expirePendingBookings } from "@/lib/sessions";
import { quickPaymentMethodLabel } from "@/lib/sessions/payment-method";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  expirePendingBookings();

  const { id } = await params;
  const submission = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, id))
    .get();

  const rows = db
    .select({
      booking: sessionBookings,
      session: {
        id: webinarSessions.id,
        date: webinarSessions.date,
        time: webinarSessions.time,
        priceUsd: webinarSessions.priceUsd,
        priceIdr: webinarSessions.priceIdr,
        durationMinutes: webinarSessions.durationMinutes,
        status: webinarSessions.status,
      },
    })
    .from(sessionBookings)
    .leftJoin(webinarSessions, eq(sessionBookings.sessionId, webinarSessions.id))
    .where(eq(sessionBookings.submissionId, id))
    .orderBy(desc(sessionBookings.createdAt))
    .all();

  if (rows.length === 0) {
    return NextResponse.json({ booking: null });
  }

  const enriched = rows.map((r) => ({
    ...r,
    payment_method:
      submission && r.session ? quickPaymentMethodLabel(submission) : null,
  }));

  const active = enriched.find(
    (r) =>
      r.booking.paymentStatus !== "expired" &&
      r.booking.paymentStatus !== "cancelled"
  );

  return NextResponse.json({
    booking: active ?? enriched[0],
    history: enriched,
  });
}
