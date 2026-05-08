export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    db.run(sql`SELECT 1`);
    return NextResponse.json({ ok: true, db: "up", ts: new Date().toISOString() });
  } catch (err) {
    console.error("[api/health]", err);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
