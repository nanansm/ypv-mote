import { db } from "@/db";
import { sessionBookings, webinarSessions } from "@/db/schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";

export const ACTIVE_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "confirmed",
] as const;

export const PAID_PAYMENT_STATUSES = ["paid", "confirmed"] as const;

export type WebinarSession = typeof webinarSessions.$inferSelect;
export type SessionBooking = typeof sessionBookings.$inferSelect;

const MONTH_ABBR = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export async function paidCountForSession(sessionId: string): Promise<number> {
  const row = await db
    .select({ c: sql<number>`count(*)` })
    .from(sessionBookings)
    .where(
      and(
        eq(sessionBookings.sessionId, sessionId),
        sql`${sessionBookings.paymentStatus} IN ('paid', 'confirmed')`
      )
    )
    .get();
  return row?.c ?? 0;
}

export async function expirePendingBookings(now: Date = new Date()): Promise<number> {
  const nowIso = now.toISOString();
  const result = await db
    .update(sessionBookings)
    .set({ paymentStatus: "expired", updatedAt: nowIso })
    .where(
      and(
        eq(sessionBookings.paymentStatus, "pending"),
        lt(sessionBookings.expiresAt, nowIso)
      )
    )
    .run();
  return result.rowsAffected ?? 0;
}

export async function activeBookingForSubmission(
  submissionId: string
): Promise<SessionBooking | null> {
  await expirePendingBookings();
  const row = await db
    .select()
    .from(sessionBookings)
    .where(
      and(
        eq(sessionBookings.submissionId, submissionId),
        sql`${sessionBookings.paymentStatus} NOT IN ('expired', 'cancelled')`
      )
    )
    .get();
  return row ?? null;
}

function sanitizeLastName(fullName: string): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "GUEST";
  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1];
  const cleaned = last.replace(/[^A-Za-z]/g, "").toUpperCase();
  return cleaned || "GUEST";
}

function sessionMonthIndex(session: { date: string }): {
  month3: string;
  monthIndex: number;
} {
  const [yearStr, monthStr] = session.date.split("-");
  const m = parseInt(monthStr, 10);
  const y = parseInt(yearStr, 10);
  return {
    month3: MONTH_ABBR[m - 1] ?? "XXX",
    monthIndex: y * 12 + (m - 1),
  };
}

export async function sessionNumberWithinMonth(sessionId: string): Promise<number> {
  const target = await db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, sessionId))
    .get();
  if (!target) return 1;

  const [year, month] = target.date.split("-");
  const monthPrefix = `${year}-${month}-`;

  const rows = await db
    .select({ id: webinarSessions.id, date: webinarSessions.date })
    .from(webinarSessions)
    .where(sql`${webinarSessions.date} LIKE ${monthPrefix + "%"}`)
    .all();

  const sorted = rows
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  const idx = sorted.findIndex((r) => r.id === sessionId);
  return idx >= 0 ? idx + 1 : 1;
}

export async function generateBookingReference(
  fullName: string,
  sessionId: string
): Promise<string> {
  const target = await db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, sessionId))
    .get();
  if (!target) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const { month3 } = sessionMonthIndex(target);
  const num = await sessionNumberWithinMonth(sessionId);
  const last = sanitizeLastName(fullName);
  const base = `YPV-${month3}${num}-${last}`;

  let candidate = base;
  let suffix = 2;
  while (await referenceExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
    if (suffix > 999) {
      throw new Error("Could not generate unique booking reference");
    }
  }
  return candidate;
}

async function referenceExists(reference: string): Promise<boolean> {
  const row = await db
    .select({ id: sessionBookings.id })
    .from(sessionBookings)
    .where(eq(sessionBookings.bookingReference, reference))
    .get();
  return !!row;
}

export async function listAvailableSessions(now: Date = new Date()) {
  await expirePendingBookings(now);
  const today = now.toISOString().slice(0, 10);
  const sessions = await db
    .select()
    .from(webinarSessions)
    .where(
      and(
        eq(webinarSessions.status, "published"),
        gte(webinarSessions.date, today)
      )
    )
    .all();

  const sorted = sessions
    .slice()
    .sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : 1
    );

  const result = [];
  for (const s of sorted) {
    const paidCount = await paidCountForSession(s.id);
    result.push({
      id: s.id,
      date: s.date,
      time: s.time,
      duration_minutes: s.durationMinutes,
      price_usd: s.priceUsd,
      capacity: s.capacity,
      paid_count: paidCount,
      is_full: paidCount >= s.capacity,
      description: s.description,
    });
  }
  return result;
}

export function expiryWindowMs(): number {
  return 24 * 60 * 60 * 1000;
}
