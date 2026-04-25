import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = 25;
  const offset = (page - 1) * limit;
  const eligibility = sp.get("eligibility");
  const paymentStatus = sp.get("paymentStatus");
  const country = sp.get("country");
  const search = sp.get("search");
  const SORT_COLS = {
    created_at: submissions.createdAt,
    full_name: submissions.fullName,
    country: submissions.country,
    eligibility_status: submissions.eligibilityStatus,
    payment_status: submissions.paymentStatus,
  } as const;
  type SortKey = keyof typeof SORT_COLS;
  const rawSort = sp.get("sortBy") ?? "created_at";
  const sortBy: SortKey = rawSort in SORT_COLS ? (rawSort as SortKey) : "created_at";
  const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";

  const conditions = [isNull(submissions.deletedAt)];

  if (eligibility && (eligibility === "passed" || eligibility === "rejected")) {
    conditions.push(eq(submissions.eligibilityStatus, eligibility));
  }
  if (paymentStatus) {
    conditions.push(eq(submissions.paymentStatus, paymentStatus));
  }
  if (country) {
    conditions.push(sql`lower(${submissions.country}) = lower(${country})`);
  }
  if (search) {
    const term = `%${search}%`;
    conditions.push(
      sql`(${submissions.fullName} LIKE ${term} OR ${submissions.email} LIKE ${term})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = db
    .select()
    .from(submissions)
    .where(where)
    .orderBy(sortDir === "desc" ? desc(SORT_COLS[sortBy]) : SORT_COLS[sortBy])
    .limit(limit)
    .offset(offset)
    .all();

  const total = (
    db.select({ count: sql<number>`count(*)` }).from(submissions).where(where).get()
  )?.count ?? 0;

  return NextResponse.json({ rows, total, page, pages: Math.ceil(total / limit) });
}
