import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessionBookings, webinarSessions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { paidCountForSession } from "@/lib/sessions";

const VALID_STATUSES = new Set(["draft", "published", "closed"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HHMM = /^\d{2}:\d{2}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const row = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, id))
    .get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    session: { ...row, paid_count: paidCountForSession(row.id) },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, id))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as {
    date?: string;
    time?: string;
    duration_minutes?: number;
    capacity?: number;
    price_usd?: number;
    price_idr?: number | null;
    zoom_link?: string | null;
    description?: string | null;
    status?: string;
  };

  const update: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.date !== undefined) {
    if (!ISO_DATE.test(body.date)) {
      return NextResponse.json(
        { error: "date must be YYYY-MM-DD" },
        { status: 400 }
      );
    }
    if (body.date !== existing.date) {
      const hasBookings = db
        .select({ c: sql<number>`count(*)` })
        .from(sessionBookings)
        .where(
          and(
            eq(sessionBookings.sessionId, id),
            sql`${sessionBookings.paymentStatus} NOT IN ('expired', 'cancelled')`
          )
        )
        .get();
      if ((hasBookings?.c ?? 0) > 0) {
        return NextResponse.json(
          { error: "Cannot change date of session that has active bookings" },
          { status: 409 }
        );
      }
    }
    update.date = body.date;
  }

  if (body.time !== undefined) {
    if (!TIME_HHMM.test(body.time)) {
      return NextResponse.json(
        { error: "time must be HH:mm" },
        { status: 400 }
      );
    }
    update.time = body.time;
  }

  if (body.duration_minutes !== undefined) {
    update.durationMinutes = body.duration_minutes;
  }
  if (body.capacity !== undefined) update.capacity = body.capacity;
  if (body.price_usd !== undefined) update.priceUsd = body.price_usd;
  if (body.price_idr !== undefined) {
    if (
      body.price_idr !== null &&
      (typeof body.price_idr !== "number" || body.price_idr < 0)
    ) {
      return NextResponse.json(
        { error: "price_idr must be a non-negative number or null" },
        { status: 400 }
      );
    }
    update.priceIdr = body.price_idr;
  }
  if (body.zoom_link !== undefined) update.zoomLink = body.zoom_link;
  if (body.description !== undefined) update.description = body.description;
  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: "status must be draft, published, or closed" },
        { status: 400 }
      );
    }
    update.status = body.status;
  }

  db.update(webinarSessions).set(update).where(eq(webinarSessions.id, id)).run();

  const updated = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, id))
    .get();

  return NextResponse.json({
    session: updated
      ? { ...updated, paid_count: paidCountForSession(updated.id) }
      : null,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, id))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paid = paidCountForSession(id);
  if (paid > 0) {
    return NextResponse.json(
      { error: "Cannot delete session with paid bookings" },
      { status: 409 }
    );
  }

  db.delete(webinarSessions).where(eq(webinarSessions.id, id)).run();

  return NextResponse.json({ deleted: true });
}
