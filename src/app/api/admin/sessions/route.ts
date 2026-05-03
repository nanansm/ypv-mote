import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { webinarSessions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { paidCountForSession } from "@/lib/sessions";

const VALID_STATUSES = new Set(["draft", "published", "closed"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HHMM = /^\d{2}:\d{2}$/;

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const rows = db.select().from(webinarSessions).all();
  const sorted = rows
    .slice()
    .sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : 1
    );

  const sessions = sorted.map((s) => ({
    ...s,
    paid_count: paidCountForSession(s.id),
  }));

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    date?: string;
    time?: string;
    duration_minutes?: number;
    capacity?: number;
    price_usd?: number;
    price_idr?: number | null;
    zoom_link?: string;
    description?: string;
    status?: string;
  };

  if (!body.date || !ISO_DATE.test(body.date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD" },
      { status: 400 }
    );
  }
  if (!body.time || !TIME_HHMM.test(body.time)) {
    return NextResponse.json(
      { error: "time must be HH:mm" },
      { status: 400 }
    );
  }
  if (typeof body.price_usd !== "number" || body.price_usd < 0) {
    return NextResponse.json(
      { error: "price_usd must be a non-negative number" },
      { status: 400 }
    );
  }
  if (
    body.price_idr != null &&
    (typeof body.price_idr !== "number" || body.price_idr < 0)
  ) {
    return NextResponse.json(
      { error: "price_idr must be a non-negative number when provided" },
      { status: 400 }
    );
  }
  const status = body.status ?? "draft";
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "status must be draft, published, or closed" },
      { status: 400 }
    );
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.insert(webinarSessions)
    .values({
      id,
      date: body.date,
      time: body.time,
      durationMinutes: body.duration_minutes ?? 120,
      capacity: body.capacity ?? 50,
      priceUsd: body.price_usd,
      priceIdr: body.price_idr ?? null,
      zoomLink: body.zoom_link ?? null,
      description: body.description ?? null,
      status,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, id))
    .get();

  return NextResponse.json({ session: created }, { status: 201 });
}
