export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessionBookings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const booking = await db
    .select()
    .from(sessionBookings)
    .where(eq(sessionBookings.id, id))
    .get();
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (booking.paymentStatus === "cancelled") {
    return NextResponse.json(
      { error: "Booking is already cancelled" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  await db.update(sessionBookings)
    .set({ paymentStatus: "cancelled", updatedAt: now })
    .where(eq(sessionBookings.id, id))
    .run();

  const updated = await db
    .select()
    .from(sessionBookings)
    .where(eq(sessionBookings.id, id))
    .get();

  return NextResponse.json({ booking: updated });
}
