export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { syncLogs } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const rows = db.select().from(syncLogs).orderBy(desc(syncLogs.id)).limit(50).offset((page - 1) * 50).all();
  const total = (db.select({ c: sql<number>`count(*)` }).from(syncLogs).get())?.c ?? 0;
  return NextResponse.json({ rows, total, page });
}
