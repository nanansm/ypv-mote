import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailLogs, syncLogs, aiAnalyses } from "@/db/schema";
import { gte, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const emailsSent = (db.select({ c: sql<number>`count(*)` }).from(emailLogs).where(gte(emailLogs.createdAt, since)).get())?.c ?? 0;
  const emailsFailed = (db.select({ c: sql<number>`count(*)` }).from(emailLogs).where(sql`${emailLogs.createdAt} >= ${since} AND ${emailLogs.status} = 'failed'`).get())?.c ?? 0;
  const sheetsSynced = (db.select({ c: sql<number>`count(*)` }).from(syncLogs).where(sql`${syncLogs.createdAt} >= ${since} AND ${syncLogs.status} = 'success'`).get())?.c ?? 0;
  const aiAnalysisCount = (db.select({ c: sql<number>`count(*)` }).from(aiAnalyses).where(gte(aiAnalyses.createdAt, since)).get())?.c ?? 0;

  return NextResponse.json({ emailsSent, emailsFailed, sheetsSynced, aiAnalysisCount });
}
