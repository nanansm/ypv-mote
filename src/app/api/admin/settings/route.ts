export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

// Keys that contain secrets — never return their values
const SECRET_KEYS = new Set(["smtp.pass", "groq.api_key", "sheets.service_account_json"]);

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const all = db.select().from(appSettings).all();
  const safe = all.map((s) => ({
    key: s.key,
    value: SECRET_KEYS.has(s.key) ? (s.value ? "••••••••" : "") : s.value,
    updatedAt: s.updatedAt,
  }));
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as Array<{ key: string; value: string }>;
  const now = new Date().toISOString();

  for (const { key, value } of body) {
    // Don't update secret with masked placeholder
    if (SECRET_KEYS.has(key) && value === "••••••••") continue;

    const existing = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
    if (existing) {
      db.update(appSettings).set({ value, updatedAt: now }).where(eq(appSettings.key, key)).run();
    } else {
      db.insert(appSettings).values({ key, value, updatedAt: now }).run();
    }
  }

  return NextResponse.json({ ok: true });
}
