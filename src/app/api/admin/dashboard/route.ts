import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq, gte, isNull, and, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const notDeleted = isNull(submissions.deletedAt);

  const total = (db.select({ c: sql<number>`count(*)` }).from(submissions).where(and(notDeleted, gte(submissions.createdAt, since30))).get())?.c ?? 0;
  const passed = (db.select({ c: sql<number>`count(*)` }).from(submissions).where(and(notDeleted, gte(submissions.createdAt, since30), eq(submissions.eligibilityStatus, "passed"))).get())?.c ?? 0;
  const pendingPayment = (db.select({ c: sql<number>`count(*)` }).from(submissions).where(and(notDeleted, eq(submissions.eligibilityStatus, "passed"), eq(submissions.paymentStatus, "pending"))).get())?.c ?? 0;
  const confirmed = (db.select({ c: sql<number>`count(*)` }).from(submissions).where(and(notDeleted, eq(submissions.paymentStatus, "confirmed"))).get())?.c ?? 0;

  // Submissions per day last 30 days
  const dailyRaw = db.all<{ day: string; count: number }>(
    sql`SELECT date(created_at) as day, count(*) as count FROM submissions WHERE deleted_at IS NULL AND created_at >= ${since30} GROUP BY day ORDER BY day`
  );

  // Rejection reasons breakdown
  const rejectionRaw = db.all<{ key: string; count: number }>(
    sql`SELECT rejection_reason_key as key, count(*) as count FROM submissions WHERE deleted_at IS NULL AND eligibility_status = 'rejected' AND rejection_reason_key IS NOT NULL GROUP BY rejection_reason_key`
  );

  // Recent 10 submissions
  const recent = db.select().from(submissions).where(notDeleted).orderBy(sql`created_at DESC`).limit(10).all();

  return NextResponse.json({
    stats: { total, passed, passRate: total > 0 ? Math.round((passed / total) * 100) : 0, pendingPayment, confirmed },
    daily: dailyRaw,
    rejections: rejectionRaw,
    recent,
  });
}
