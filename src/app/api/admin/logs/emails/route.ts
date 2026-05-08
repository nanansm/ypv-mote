export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { desc, gte, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const status = sp.get("status");
  const since = sp.get("since");
  const limit = 50;

  const conditions = [];
  if (status) conditions.push(eq(emailLogs.status, status));
  if (since) conditions.push(gte(emailLogs.createdAt, since));

  const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined;

  const rows = db.select().from(emailLogs).where(where).orderBy(desc(emailLogs.id)).limit(limit).offset((page - 1) * limit).all();
  const total = (db.select({ c: sql<number>`count(*)` }).from(emailLogs).where(where).get())?.c ?? 0;

  return NextResponse.json({ rows, total, page });
}
