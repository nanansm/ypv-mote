import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eligibilityConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const row = db.select().from(eligibilityConfig).where(eq(eligibilityConfig.id, 1)).get();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    validCountries: string[];
    defaultAgeMin: number;
    defaultAgeMax: number;
    countryAgeOverrides: Record<string, { min: number; max: number }>;
    requireVocationalTraining: boolean;
    requireFieldInterest: boolean;
  };

  const now = new Date().toISOString();
  db.update(eligibilityConfig).set({
    validCountries: JSON.stringify(body.validCountries),
    defaultAgeMin: body.defaultAgeMin,
    defaultAgeMax: body.defaultAgeMax,
    countryAgeOverrides: JSON.stringify(body.countryAgeOverrides),
    requireVocationalTraining: body.requireVocationalTraining ? 1 : 0,
    requireFieldInterest: body.requireFieldInterest ? 1 : 0,
    updatedAt: now,
    updatedBy: (auth as { id: string }).id,
  }).where(eq(eligibilityConfig.id, 1)).run();

  return NextResponse.json({ ok: true });
}
