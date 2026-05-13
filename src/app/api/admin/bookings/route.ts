export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { sessionBookings, submissions, webinarSessions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { expirePendingBookings } from "@/lib/sessions";
import { quickPaymentMethodLabel } from "@/lib/sessions/payment-method";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  expirePendingBookings();

  const sp = req.nextUrl.searchParams;
  const sessionId = sp.get("session_id");
  const paymentStatus = sp.get("payment_status");

  const conditions: SQL[] = [];
  if (sessionId) conditions.push(eq(sessionBookings.sessionId, sessionId));
  if (paymentStatus)
    conditions.push(eq(sessionBookings.paymentStatus, paymentStatus));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = db
    .select({
      booking: sessionBookings,
      submission: {
        id: submissions.id,
        fullName: submissions.fullName,
        email: submissions.email,
        country: submissions.country,
      },
      session: {
        id: webinarSessions.id,
        date: webinarSessions.date,
        time: webinarSessions.time,
        priceUsd: webinarSessions.priceUsd,
        priceIdr: webinarSessions.priceIdr,
      },
    })
    .from(sessionBookings)
    .leftJoin(submissions, eq(sessionBookings.submissionId, submissions.id))
    .leftJoin(webinarSessions, eq(sessionBookings.sessionId, webinarSessions.id))
    .where(where)
    .orderBy(desc(sessionBookings.createdAt))
    .all();

  const bookings = rows.map((r) => ({
    ...r,
    payment_method:
      r.submission && r.session ? quickPaymentMethodLabel(r.submission) : null,
  }));

  return NextResponse.json({ bookings });
}
