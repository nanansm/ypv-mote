export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessionBookings, webinarSessions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { paidCountForSession } from "@/lib/sessions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const booking = db
    .select()
    .from(sessionBookings)
    .where(eq(sessionBookings.id, id))
    .get();
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (booking.paymentStatus === "paid" || booking.paymentStatus === "confirmed") {
    return NextResponse.json(
      { error: `Booking is already ${booking.paymentStatus}` },
      { status: 409 }
    );
  }
  if (booking.paymentStatus === "cancelled") {
    return NextResponse.json(
      { error: "Cannot mark cancelled booking as paid" },
      { status: 409 }
    );
  }

  const session = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, booking.sessionId))
    .get();
  if (!session) {
    return NextResponse.json({ error: "Session no longer exists" }, { status: 404 });
  }

  const paid = paidCountForSession(booking.sessionId);
  if (paid >= session.capacity) {
    return NextResponse.json(
      { error: "Session is full — cannot mark as paid" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  db.update(sessionBookings)
    .set({ paymentStatus: "paid", paidAt: now, updatedAt: now })
    .where(eq(sessionBookings.id, id))
    .run();

  const updated = db
    .select()
    .from(sessionBookings)
    .where(eq(sessionBookings.id, id))
    .get();

  return NextResponse.json({ booking: updated });
}
