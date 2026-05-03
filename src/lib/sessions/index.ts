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

export function paidCountForSession(sessionId: string): number {
  const row = db
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

export function expirePendingBookings(now: Date = new Date()): number {
  const nowIso = now.toISOString();
  const result = db
    .update(sessionBookings)
    .set({ paymentStatus: "expired", updatedAt: nowIso })
    .where(
      and(
        eq(sessionBookings.paymentStatus, "pending"),
        lt(sessionBookings.expiresAt, nowIso)
      )
    )
    .run();
  return result.changes ?? 0;
}

export function activeBookingForSubmission(
  submissionId: string
): SessionBooking | null {
  expirePendingBookings();
  const row = db
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

export function sessionNumberWithinMonth(sessionId: string): number {
  const target = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, sessionId))
    .get();
  if (!target) return 1;

  const [year, month] = target.date.split("-");
  const monthPrefix = `${year}-${month}-`;

  const rows = db
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

export function generateBookingReference(
  fullName: string,
  sessionId: string
): string {
  const target = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, sessionId))
    .get();
  if (!target) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const { month3 } = sessionMonthIndex(target);
  const num = sessionNumberWithinMonth(sessionId);
  const last = sanitizeLastName(fullName);
  const base = `YPV-${month3}${num}-${last}`;

  let candidate = base;
  let suffix = 2;
  while (referenceExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
    if (suffix > 999) {
      throw new Error("Could not generate unique booking reference");
    }
  }
  return candidate;
}

function referenceExists(reference: string): boolean {
  const row = db
    .select({ id: sessionBookings.id })
    .from(sessionBookings)
    .where(eq(sessionBookings.bookingReference, reference))
    .get();
  return !!row;
}

export function listAvailableSessions(now: Date = new Date()) {
  expirePendingBookings(now);
  const today = now.toISOString().slice(0, 10);
  const sessions = db
    .select()
    .from(webinarSessions)
    .where(
      and(
        eq(webinarSessions.status, "published"),
        gte(webinarSessions.date, today)
      )
    )
    .all();

  return sessions
    .slice()
    .sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : 1
    )
    .map((s) => {
      const paidCount = paidCountForSession(s.id);
      return {
        id: s.id,
        date: s.date,
        time: s.time,
        duration_minutes: s.durationMinutes,
        price_usd: s.priceUsd,
        capacity: s.capacity,
        paid_count: paidCount,
        is_full: paidCount >= s.capacity,
        description: s.description,
      };
    });
}

export function expiryWindowMs(): number {
  return 24 * 60 * 60 * 1000;
}
