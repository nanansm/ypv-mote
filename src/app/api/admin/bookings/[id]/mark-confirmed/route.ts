import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessionBookings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { sendBookingZoomLink } from "@/lib/sessions/email";

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

  if (booking.paymentStatus === "confirmed") {
    return NextResponse.json(
      { error: "Booking is already confirmed" },
      { status: 409 }
    );
  }
  if (booking.paymentStatus !== "paid") {
    return NextResponse.json(
      {
        error:
          "Booking must be in 'paid' state before it can be confirmed",
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  db.update(sessionBookings)
    .set({ paymentStatus: "confirmed", confirmedAt: now, updatedAt: now })
    .where(eq(sessionBookings.id, id))
    .run();

  const updated = db
    .select()
    .from(sessionBookings)
    .where(eq(sessionBookings.id, id))
    .get();

  let emailStatus: "sent" | "failed" = "sent";
  let emailError: string | null = null;
  try {
    await sendBookingZoomLink(id);
  } catch (err) {
    emailStatus = "failed";
    emailError = String(err);
    console.error("[admin/mark-confirmed] zoom email failed:", err);
  }

  return NextResponse.json({
    booking: updated,
    email: { status: emailStatus, error: emailError },
  });
}
